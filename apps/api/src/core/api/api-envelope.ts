export type ApiSuccessEnvelope<TData> = {
  status: "success";
  data: TData;
  error: null;
  traceId: string;
};

export type ApiErrorEnvelope = {
  status: "error";
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  traceId: string;
};

export const successResponse = <TData>(
  traceId: string,
  data: TData
): ApiSuccessEnvelope<TData> => ({
  status: "success",
  data,
  error: null,
  traceId
});

export const errorResponse = (
  traceId: string,
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiErrorEnvelope => ({
  status: "error",
  data: null,
  error: {
    code,
    message,
    ...(details ? { details } : {})
  },
  traceId
});
