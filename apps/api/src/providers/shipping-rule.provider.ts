import type {
  ShippingMethodRecord,
  ShippingRuleRecord,
  IShippingRuleProvider
} from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";

const mapShippingMethod = (method: {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ShippingMethodRecord => ({
  id: method.id,
  code: method.code,
  name: method.name,
  type: method.type as ShippingMethodRecord["type"],
  isActive: method.isActive,
  sortOrder: method.sortOrder,
  createdAt: method.createdAt,
  updatedAt: method.updatedAt,
  deletedAt: method.deletedAt
});

const mapShippingRule = (rule: {
  id: string;
  shippingMethodId: string;
  postalCodeStart: string;
  postalCodeEnd: string;
  priceCents: number;
  currencyCode: string;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  minimumOrderAmountCents: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}): ShippingRuleRecord => ({
  id: rule.id,
  shippingMethodId: rule.shippingMethodId,
  postalCodeStart: rule.postalCodeStart,
  postalCodeEnd: rule.postalCodeEnd,
  priceCents: rule.priceCents,
  currencyCode: rule.currencyCode,
  estimatedMinDays: rule.estimatedMinDays,
  estimatedMaxDays: rule.estimatedMaxDays,
  minimumOrderAmountCents: rule.minimumOrderAmountCents,
  isActive: rule.isActive,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
  deletedAt: rule.deletedAt,
  createdByUserId: rule.createdByUserId,
  updatedByUserId: rule.updatedByUserId
});

export class PrismaShippingRuleProvider implements IShippingRuleProvider {
  public async findMethods(): Promise<ShippingMethodRecord[]> {
    const methods = await prisma.shippingMethod.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: "asc" }
    });
    return methods.map(mapShippingMethod);
  }

  public async findActiveRules(shippingMethodId: string): Promise<ShippingRuleRecord[]> {
    const rules = await prisma.shippingRule.findMany({
      where: { shippingMethodId, isActive: true, deletedAt: null },
      orderBy: { priceCents: "asc" }
    });
    return rules.map(mapShippingRule);
  }

  public async calculateShipping(input: {
    postalCode: string;
    subtotalCents: number;
  }): Promise<Array<{ method: ShippingMethodRecord; rule: ShippingRuleRecord }>> {
    const methods = await prisma.shippingMethod.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: "asc" }
    });

    const results: Array<{ method: ShippingMethodRecord; rule: ShippingRuleRecord }> = [];

    for (const method of methods) {
      const rule = await prisma.shippingRule.findFirst({
        where: {
          shippingMethodId: method.id,
          isActive: true,
          deletedAt: null,
          postalCodeStart: { lte: input.postalCode },
          postalCodeEnd: { gte: input.postalCode },
          OR: [
            { minimumOrderAmountCents: null },
            { minimumOrderAmountCents: { lte: input.subtotalCents } }
          ]
        },
        orderBy: { priceCents: "asc" }
      });

      if (rule) {
        results.push({
          method: mapShippingMethod(method),
          rule: mapShippingRule(rule)
        });
      }
    }

    return results;
  }
}
