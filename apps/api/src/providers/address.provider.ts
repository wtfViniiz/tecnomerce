import type { AddressRecord, IAddressProvider } from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";

const mapAddress = (address: {
  id: string;
  userId: string;
  label: string | null;
  recipientName: string;
  phone: string | null;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  countryCode: string;
  addressType: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): AddressRecord => ({
  id: address.id,
  userId: address.userId,
  label: address.label,
  recipientName: address.recipientName,
  phone: address.phone,
  postalCode: address.postalCode,
  street: address.street,
  number: address.number,
  complement: address.complement,
  neighborhood: address.neighborhood,
  city: address.city,
  state: address.state,
  countryCode: address.countryCode,
  addressType: address.addressType as AddressRecord["addressType"],
  isDefault: address.isDefault,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
  deletedAt: address.deletedAt
});

export class PrismaAddressProvider implements IAddressProvider {
  public async findById(id: string): Promise<AddressRecord | null> {
    const address = await prisma.address.findUnique({ where: { id } });
    return address ? mapAddress(address) : null;
  }

  public async listByUserId(userId: string): Promise<AddressRecord[]> {
    const addresses = await prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
    return addresses.map(mapAddress);
  }

  public async create(
    input: Omit<AddressRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<AddressRecord> {
    // If setting as default, unset other defaults first
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: input.userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: input.userId,
        label: input.label,
        recipientName: input.recipientName,
        phone: input.phone,
        postalCode: input.postalCode,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        countryCode: input.countryCode,
        addressType: input.addressType,
        isDefault: input.isDefault
      }
    });

    return mapAddress(address);
  }

  public async update(id: string, input: Partial<AddressRecord>): Promise<AddressRecord> {
    const data: Record<string, unknown> = {};

    if (input.label !== undefined) data.label = input.label;
    if (input.recipientName !== undefined) data.recipientName = input.recipientName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;
    if (input.street !== undefined) data.street = input.street;
    if (input.number !== undefined) data.number = input.number;
    if (input.complement !== undefined) data.complement = input.complement;
    if (input.neighborhood !== undefined) data.neighborhood = input.neighborhood;
    if (input.city !== undefined) data.city = input.city;
    if (input.state !== undefined) data.state = input.state;
    if (input.countryCode !== undefined) data.countryCode = input.countryCode;
    if (input.addressType !== undefined) data.addressType = input.addressType;

    const address = await prisma.address.update({
      where: { id },
      data
    });

    return mapAddress(address);
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.address.update({
      where: { id },
      data: { deletedAt }
    });
  }

  public async setDefault(id: string, userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      }),
      prisma.address.update({
        where: { id },
        data: { isDefault: true }
      })
    ]);
  }
}
