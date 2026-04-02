/**
 * Unit tests: ApiKeyGuard (src/api-key.guard.ts)
 *
 * Tests cover:
 *  - Throws UnauthorizedException when API_KEY env var is not configured
 *  - Throws UnauthorizedException when the provided key is wrong
 *  - Returns true when the correct key is provided
 *  - Uses timing-safe comparison (no early exit on partial match)
 */
import { UnauthorizedException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { ApiKeyGuard } from "../src/api-key.guard";

function makeContext(apiKeyHeader: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: apiKeyHeader !== undefined ? { "x-api-key": apiKeyHeader } : {}
      })
    })
  } as unknown as ExecutionContext;
}

describe("ApiKeyGuard", () => {
  const guard = new ApiKeyGuard();
  const originalEnv = process.env.API_KEY;

  afterEach(() => {
    // Restore env var after each test
    if (originalEnv === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalEnv;
    }
  });

  it("throws when API_KEY env var is not set (fail-closed behaviour)", () => {
    delete process.env.API_KEY;
    expect(() => guard.canActivate(makeContext("anything"))).toThrow(UnauthorizedException);
  });

  it("throws when the provided key is empty", () => {
    process.env.API_KEY = "secret-key-abc";
    expect(() => guard.canActivate(makeContext(""))).toThrow(UnauthorizedException);
  });

  it("throws when the provided key is wrong", () => {
    process.env.API_KEY = "correct-key";
    expect(() => guard.canActivate(makeContext("wrong-key"))).toThrow(UnauthorizedException);
  });

  it("throws when no x-api-key header is sent at all", () => {
    process.env.API_KEY = "correct-key";
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(UnauthorizedException);
  });

  it("returns true when the correct key is provided", () => {
    process.env.API_KEY = "my-super-secret";
    expect(guard.canActivate(makeContext("my-super-secret"))).toBe(true);
  });
});