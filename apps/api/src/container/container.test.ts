import { describe, expect, it } from "vitest";

import { Container, type ServiceToken } from "@/container/container.js";

describe("Container", () => {
  it("registers and resolves a service", () => {
    const container = new Container();
    const token = Symbol("testService") as ServiceToken<string>;

    container.register(token, "hello");
    expect(container.resolve(token)).toBe("hello");
  });

  it("throws when resolving an unregistered token", () => {
    const container = new Container();
    const token = Symbol("missing") as ServiceToken<string>;

    expect(() => container.resolve(token)).toThrow(/not registered/i);
  });

  it("overwrites a previously registered service", () => {
    const container = new Container();
    const token = Symbol("overwrite") as ServiceToken<number>;

    container.register(token, 1);
    container.register(token, 2);
    expect(container.resolve(token)).toBe(2);
  });

  it("maintains separate instances for different tokens", () => {
    const container = new Container();
    const tokenA = Symbol("a") as ServiceToken<string>;
    const tokenB = Symbol("b") as ServiceToken<string>;

    container.register(tokenA, "alpha");
    container.register(tokenB, "beta");

    expect(container.resolve(tokenA)).toBe("alpha");
    expect(container.resolve(tokenB)).toBe("beta");
  });
});
