/**
 * Unit tests: GlobalErrorFilter (src/global-error.filter.ts)
 *
 * Tests cover:
 *  - HttpException: status and message forwarded to client
 *  - Generic Error in development: real message exposed
 *  - Generic Error in production: generic "Internal server error" returned
 *  - Non-Error throw in production: generic message returned
 */
import { HttpException, HttpStatus } from "@nestjs/common";
import { ArgumentsHost } from "@nestjs/common";
import { GlobalErrorFilter } from "../src/global-error.filter";

function makeHost(json: jest.Mock) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: (code: number) => ({ json })
      })
    })
  } as unknown as ArgumentsHost;
}

describe("GlobalErrorFilter", () => {
  const filter = new GlobalErrorFilter();
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("exposes HttpException message and status regardless of environment", () => {
    const json = jest.fn();
    const host = makeHost(json);
    process.env.NODE_ENV = "production";

    filter.catch(new HttpException("Not found", HttpStatus.NOT_FOUND), host);

    expect(json).toHaveBeenCalledWith({
      error: { message: "Not found", status: 404 }
    });
  });

  it("exposes raw Error message in development", () => {
    const json = jest.fn();
    const host = makeHost(json);
    process.env.NODE_ENV = "development";

    filter.catch(new Error("DB connection refused"), host);

    expect(json).toHaveBeenCalledWith({
      error: { message: "DB connection refused", status: 500 }
    });
  });

  it("hides raw Error message in production", () => {
    const json = jest.fn();
    const host = makeHost(json);
    process.env.NODE_ENV = "production";

    filter.catch(new Error("secret DB password in error"), host);

    const call = json.mock.calls[0][0] as { error: { message: string } };
    expect(call.error.message).toBe("Internal server error");
    expect(call.error.message).not.toContain("password");
  });

  it("handles non-Error throws gracefully in production", () => {
    const json = jest.fn();
    const host = makeHost(json);
    process.env.NODE_ENV = "production";

    filter.catch("some random string thrown", host);

    const call = json.mock.calls[0][0] as { error: { message: string; status: number } };
    expect(call.error.status).toBe(500);
    expect(call.error.message).toBe("Internal server error");
  });
});