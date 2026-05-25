import { Queue, Worker } from "bullmq";

import { redisKeys } from "@/config/redis-keys.js";
import { redis } from "@/providers/redis.js";
import type { IQueueProvider } from "@/providers/contracts.js";

export class BullMqQueueProvider implements IQueueProvider {
  public async addJob(
    queueName: string,
    jobName: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const queue = new Queue(queueName, {
      connection: redis,
      prefix: redisKeys.queue
    });

    await queue.add(jobName, payload);
    await queue.close();
  }

  public async process(
    queueName: string,
    handler: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    const worker = new Worker(
      queueName,
      async (job) => {
        await handler(job.data as Record<string, unknown>);
      },
      {
        connection: redis,
        prefix: redisKeys.queue
      }
    );

    await worker.waitUntilReady();
  }

  public async retry(queueName: string, jobId: string): Promise<void> {
    const queue = new Queue(queueName, {
      connection: redis,
      prefix: redisKeys.queue
    });

    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
    }

    await queue.close();
  }

  public async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = new Queue(queueName, {
      connection: redis,
      prefix: redisKeys.queue
    });

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }

    await queue.close();
  }
}
