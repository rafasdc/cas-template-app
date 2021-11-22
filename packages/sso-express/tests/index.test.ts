import ssoExpress from "../src/ssoExpress";

const express = require("express");

beforeEach(() => {
  // Forcing re-import of modules for each test,
  // since we mock dependencies.
  jest.resetModules();
});

describe("The test middleware", () => {
  it("Throws an error if there is no oidc config provided", () => {
    expect(
      async () =>
        // @ts-ignore
        await ssoExpress({
          // no oidcConfig key
        })
    ).toThrow("sso-express: oidcConfig key not provided in options");
  });

  it("Instantiates keycloak with the right parameters", () => {
    const oidcClient = require("openid-client");
    kc.mockReturnValue({
      middleware: (...args) => {
        return (req, res, next) => {};
      },
      protect: (...args) => {
        return (req, res, next) => {};
      },
    });

    const moduleUnderTest = await ssoExpress({
      oidcConfig: { testkey: "testvalue" },
      sessionStore: { testStore: true },
    });

    expect(kc).toHaveBeenCalledWith(
      { store: { testStore: true } },
      { testkey: "testvalue" }
    );
  });

  it("Configures the middleware with the right routes", () => {
    jest.mock("keycloak-connect");

    const kc = require("keycloak-connect");
    kc.mockReturnValue({
      middleware: (...args) => {
        return (req, res, next) => {};
      },
      protect: (...args) => {
        return (req, res, next) => {};
      },
    });

    const ssoUtils = require("./ssoExpress");

    const moduleUnderTest = new ssoUtils({
      keycloakConfig: { testkey: "testvalue" },
      sessionStore: { testStore: true },
      routes: {
        login: "/testloginroute",
        logout: "/testlogout",
        register: "/testregister",
        sessionIdleRemainingTime: "/testremaining",
      },
    });

    // 6 configured routes, and 2 anonymous middleware routes (keycloak + auto session extend)
    expect(moduleUnderTest.ssoMiddleware.stack.length).toBe(7);

    const configuredRouteObjects = moduleUnderTest.ssoMiddleware.stack
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
      { path: "/testloginroute", method: "get" },
      { path: "/testregister", method: "get" },
    ]);
  });

  it("Sets the accessDenied on the prototype", () => {
    const onAccessDenied = jest.fn();

    jest.mock("keycloak-connect");
    const kc = require("keycloak-connect");
    kc.prototype.middleware = jest.fn().mockReturnValue(jest.fn());
    kc.prototype.protect = jest.fn().mockReturnValue(jest.fn());

    const ssoUtils = require("./ssoExpress");

    const moduleUnderTest = new ssoUtils({
      keycloakConfig: { testkey: "testvalue" },
      sessionStore: { testStore: true },
      accessDenied: onAccessDenied,
    });

    moduleUnderTest.keycloak.accessDenied("request", "response");

    expect(onAccessDenied).toHaveBeenCalledWith("request", "response");
  });
});
