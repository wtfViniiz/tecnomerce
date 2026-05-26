import type {
  ShippingMethodRecord,
  ShippingRuleRecord,
  IShippingRuleProvider
} from "@/providers/contracts-fase4.js";
import type { IAuditProvider } from "@/providers/contracts.js";
import type { CalculateShippingInput } from "@/modules/shipping/schemas/shipping.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class ShippingService {
  public constructor(
    private readonly shippingRuleProvider: IShippingRuleProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async calculate(
    input: CalculateShippingInput
  ): Promise<Array<{ method: ShippingMethodRecord; rule: ShippingRuleRecord }>> {
    const postalCode = input.postalCode.replace("-", "");
    return this.shippingRuleProvider.calculateShipping({
      postalCode,
      subtotalCents: input.subtotalCents
    });
  }

  public async listMethods(): Promise<ShippingMethodRecord[]> {
    return this.shippingRuleProvider.findMethods();
  }

  public async listRules(shippingMethodId: string): Promise<ShippingRuleRecord[]> {
    return this.shippingRuleProvider.findActiveRules(shippingMethodId);
  }
}
