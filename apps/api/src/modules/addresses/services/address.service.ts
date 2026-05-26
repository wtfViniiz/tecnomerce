import { ResourceError } from "@/core/errors/resource-error.js";
import type { IAuditProvider } from "@/providers/contracts.js";
import type { AddressRecord, IAddressProvider } from "@/providers/contracts-fase4.js";
import type { CreateAddressInput, UpdateAddressInput } from "@/modules/addresses/schemas/address.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class AddressService {
  public constructor(
    private readonly addressProvider: IAddressProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async listByUserId(userId: string): Promise<AddressRecord[]> {
    return this.addressProvider.listByUserId(userId);
  }

  public async getById(id: string): Promise<AddressRecord> {
    const address = await this.addressProvider.findById(id);
    if (!address) {
      throw new ResourceError("ADDRESS.NOT_FOUND", "Address not found.");
    }
    return address;
  }

  public async create(input: CreateAddressInput, userId: string, context: ServiceContext): Promise<AddressRecord> {
    const address = await this.addressProvider.create({
      userId,
      label: input.label ?? null,
      recipientName: input.recipientName,
      phone: input.phone ?? null,
      postalCode: input.postalCode.replace("-", ""),
      street: input.street,
      number: input.number,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood,
      city: input.city,
      state: input.state,
      countryCode: input.countryCode,
      addressType: input.addressType,
      isDefault: input.isDefault
    });

    await this.auditProvider.emit({
      eventType: "ADDRESS_CREATED",
      eventCategory: "ACCOUNT",
      actorType: context.userId ? "USER" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "ADDRESS",
      targetId: address.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return address;
  }

  public async update(id: string, input: UpdateAddressInput, context: ServiceContext): Promise<AddressRecord> {
    const existing = await this.addressProvider.findById(id);
    if (!existing) {
      throw new ResourceError("ADDRESS.NOT_FOUND", "Address not found.");
    }

    const updateData: Partial<AddressRecord> = {};

    if (input.label !== undefined) updateData.label = input.label;
    if (input.recipientName !== undefined) updateData.recipientName = input.recipientName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.postalCode !== undefined) updateData.postalCode = input.postalCode.replace("-", "");
    if (input.street !== undefined) updateData.street = input.street;
    if (input.number !== undefined) updateData.number = input.number;
    if (input.complement !== undefined) updateData.complement = input.complement;
    if (input.neighborhood !== undefined) updateData.neighborhood = input.neighborhood;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.countryCode !== undefined) updateData.countryCode = input.countryCode;
    if (input.addressType !== undefined) updateData.addressType = input.addressType;

    const address = await this.addressProvider.update(id, updateData);

    await this.auditProvider.emit({
      eventType: "ADDRESS_UPDATED",
      eventCategory: "ACCOUNT",
      actorType: context.userId ? "USER" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "ADDRESS",
      targetId: address.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return address;
  }

  public async softDelete(id: string, context: ServiceContext): Promise<void> {
    const existing = await this.addressProvider.findById(id);
    if (!existing) {
      throw new ResourceError("ADDRESS.NOT_FOUND", "Address not found.");
    }

    await this.addressProvider.softDelete(id, new Date());

    await this.auditProvider.emit({
      eventType: "ADDRESS_DELETED",
      eventCategory: "ACCOUNT",
      actorType: context.userId ? "USER" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "ADDRESS",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });
  }

  public async setDefault(id: string, userId: string, context: ServiceContext): Promise<void> {
    const existing = await this.addressProvider.findById(id);
    if (!existing) {
      throw new ResourceError("ADDRESS.NOT_FOUND", "Address not found.");
    }

    await this.addressProvider.setDefault(id, userId);

    await this.auditProvider.emit({
      eventType: "ADDRESS_DEFAULT_SET",
      eventCategory: "ACCOUNT",
      actorType: context.userId ? "USER" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "ADDRESS",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });
  }
}
