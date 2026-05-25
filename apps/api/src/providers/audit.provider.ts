import type { Prisma } from "@prisma/client";

import type { AuditEvent, IAuditProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

export class PrismaAuditProvider implements IAuditProvider {
  public async emit(event: AuditEvent): Promise<void> {
    const data = {
      eventType: event.eventType,
      eventCategory: event.eventCategory,
      actorType: event.actorType,
      targetType: event.targetType,
      traceId: event.traceId,
      outcome: event.outcome,
      ...(event.actorUserId !== undefined ? { actorUserId: event.actorUserId } : {}),
      ...(event.targetId !== undefined ? { targetId: event.targetId } : {}),
      ...(event.requestId !== undefined ? { requestId: event.requestId } : {}),
      ...(event.ipAddress !== undefined ? { ipAddress: event.ipAddress } : {}),
      ...(event.userAgent !== undefined ? { userAgent: event.userAgent } : {}),
      ...(event.metadata !== undefined ? { metadata: event.metadata as Prisma.JsonObject } : {})
    };

    await prisma.auditEvent.create({
      data
    });
  }
}
