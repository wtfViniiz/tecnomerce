export type AppErrorOptions = {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown> | undefined;
  exposeDetails?: boolean;
};

export class BaseAppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;
  public readonly exposeDetails: boolean;

  public constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.exposeDetails = options.exposeDetails ?? false;
  }
}
