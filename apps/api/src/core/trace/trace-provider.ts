import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type TraceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  module?: string;
};

export interface ITraceProvider {
  generateTraceId(): string;
  getCurrentTrace(): TraceContext | undefined;
  runWithTrace<TValue>(trace: TraceContext, callback: () => TValue): TValue;
}

export class AsyncLocalTraceProvider implements ITraceProvider {
  private readonly storage = new AsyncLocalStorage<TraceContext>();

  public generateTraceId(): string {
    return randomUUID();
  }

  public getCurrentTrace(): TraceContext | undefined {
    return this.storage.getStore();
  }

  public runWithTrace<TValue>(trace: TraceContext, callback: () => TValue): TValue {
    return this.storage.run(trace, callback);
  }
}
