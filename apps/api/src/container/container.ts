export type ServiceToken<TValue> = symbol & { __type?: TValue };

export class Container {
  private readonly services = new Map<symbol, unknown>();

  public register<TValue>(token: ServiceToken<TValue>, service: TValue): void {
    this.services.set(token, service);
  }

  public resolve<TValue>(token: ServiceToken<TValue>): TValue {
    const service = this.services.get(token);

    if (!service) {
      throw new Error(`Dependency not registered for token ${token.toString()}.`);
    }

    return service as TValue;
  }
}
