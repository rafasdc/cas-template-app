import ssoExpress from "../src/index";
import type { Router } from "express";
import { Issuer } from "openid-client";
import { mocked } from "ts-jest/utils";
jest.mock("openid-client");

const mockedIssuer = mocked(Issuer, true);

beforeEach(() => {
  // Forcing re-import of modules for each test,
  // since we mock dependencies.
  jest.resetModules();
});

const oidcIssuer = "https://example.com/auth/realms/myRealm";

describe("The ssoExpress middleware", () => {
  let clientConstructor: jest.Mock;
  let middleware: Router;

  beforeEach(async () => {
    clientConstructor = jest.fn();
    // @ts-ignore
    mockedIssuer.discover.mockImplementation(async (issuer: string) => ({
      Client: class {
        constructor(metadata) {
          clientConstructor(metadata);
        }
      },
    }));

    middleware = await ssoExpress({
      oidcConfig: {
        baseUrl: "https://example.com",
        clientId: "myClient",
        oidcIssuer,
      },
      routes: {
        login: "/testloginroute",
        logout: "/testlogout",
        sessionIdleRemainingTime: "/testremaining",
      },
    });
  });

  it("throws an error if there is no oidc config provided", () => {
    expect(
      // @ts-ignore
      ssoExpress({
        // no oidcConfig key
      })
    ).rejects.toThrow("sso-express: oidcConfig key not provided in options");
  });

  it("instantiates the openid client", async () => {
    expect(mockedIssuer.discover).toHaveBeenCalledWith(oidcIssuer);
    expect(clientConstructor).toHaveBeenCalledWith({
      client_id: "myClient",
      post_logout_redirect_uris: ["https://example.com"],
      redirect_uris: ["https://example.com/auth-callback"],
      token_endpoint_auth_method: "none",
    });
  });

  it("Configures the middleware with the right routes", async () => {
    // 4 configured routes, and 1 anonymous middleware routes (parsing and refreshing the session tokens)
    expect(middleware.stack.length).toBe(5);

    const configuredRouteObjects = middleware.stack
      .map((s) => s.route)
      .filter((r) => r)
      .map((r) => {
        return {
          path: r.path,
          method: Object.keys(r.methods)[0],
        };
      });

    expect(configuredRouteObjects).toStrictEqual([
      { path: "/testlogout", method: "post" },
      { path: "/testremaining", method: "get" },
      { path: "/testloginroute", method: "post" },
      { path: "/auth-callback", method: "get" },
    ]);
  });
});
