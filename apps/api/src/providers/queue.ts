import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

import { redisKeys } from "@/config/redis-keys.js";
import { env } from "@/config/env.js";
import type { IQueueProvider } from "@/providers/contracts.js";
import { QUEUES, type QueueName } from "@/queues/queue-names.js";
import { logger } from "@/core/logging/logger.js";

function createBullRedis(): IORedis {
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 }
};

export class BullMqQueueProvider implements IQueueProvider {
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();

  public async addJob(
    queueName: string,
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobName, payload, { ...DEFAULT_JOB_OPTIONS, ...options });
  }

  public async process(
    queueName: string,
    handler: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    if (this.workers.has(queueName)) {
      return;
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        await handler(job.data as Record<string, unknown>);
      },
      {
        connection: createBullRedis(),
        prefix: redisKeys.queue,
        concurrency: 5
      }
    );

    worker.on("completed", (job) => {
      logger.debug({ jobId: job.id, queue: queueName }, "Job completed");
    });

    worker.on("failed", (job, error) => {
      logger.error(
        { jobId: job?.id, queue: queueName, error: error.message },
        "Job failed"
      );
    });

    worker.on("error", (error) => {
      logger.error({ queue: queueName, error: error.message }, "Worker error");
    });

    await worker.waitUntilReady();
    this.workers.set(queueName, worker);
  }

  public async retry(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  public async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  public async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [name, queue] of this.queues) {
      closePromises.push(
        queue.close().then(() => {
          this.queues.delete(name);
        })
      );
    }

    for (const [name, worker] of this.workers) {
      closePromises.push(
        worker.close().then(() => {
          this.workers.delete(name);
        })
      );
    }

    await Promise.all(closePromises);
  }

  private getQueue(queueName: string): Queue {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, {
        connection: createBullRedis(),
        prefix: redisKeys.queue,
        defaultJobOptions: DEFAULT_JOB_OPTIONS
      });
      this.queues.set(queueName, queue);
    }
    return queue;
  }
}
