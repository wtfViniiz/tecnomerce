import { describe, expect, it } from "vitest";

import { successResponse, errorResponse } from "@/core/api/api-envelope.js";

describe("API Envelope", () => {
  describe("successResponse", () => {
    it("returns the canonical success envelope", () => {
      const result = successResponse("trace-123", { foo: "bar" });

      expect(result).toEqual({
        status: "success",
        data: { foo: "bar" },
        error: null,
        traceId: "trace-123"
      });
    });

    it("preserves the traceId", () => {
      const result = successResponse("custom-trace", null);
      expect(result.traceId).toBe("custom-trace");
    });

    it("supports null data", () => {
      const result = successResponse("t", null);
      expect(result.data).toBeNull();
      expect(result.status).toBe("success");
    });
  });

  describe("errorResponse", () => {
    it("returns the canonical error envelope", () => {
      const result = errorResponse("trace-456", "AUTH.INVALID", "Invalid credentials");

      expect(result).toEqual({
        status: "error",
        data: null,
        error: {
          code: "AUTH.INVALID",
          message: "Invalid credentials"
        },
        traceId: "trace-456"
      });
    });

    it("includes details when provided", () => {
      const result = errorResponse("t", "VALIDATION.FAILED", "Bad input", { field: "email" });

      expect(result.error.details).toEqual({ field: "email" });
    });

    it("omits details when undefined", () => {
      const result = errorResponse("t", "ERR", "msg");
      expect(result.error).not.toHaveProperty("details");
    });

    it("always sets data to null", () => {
      const result = errorResponse("t", "ERR", "msg");
      expect(result.data).toBeNull();
    });
  });
});
