import { BaseClient } from "openid-client";
import { mocked } from "ts-jest/utils";
import { SSOExpressOptions } from "../src";
import { logoutController } from "../src/controllers";
import { isAuthenticated } from "../src/helpers";
jest.mock("../src/helpers");

const oidcIssuer = "https://example.com/auth/realms/myRealm";
const middlewareOptions: SSOExpressOptions = {
  applicationDomain: ".gov.bc.ca",
  oidcConfig: {
    baseUrl: "https://example.com",
    clientId: "myClient",
    oidcIssuer,
  },
};

const client = {
  metadata: {
    post_logout_redirect_uris: ["https://example.com/"],
  },
  endSessionUrl: () => "https://oidc-endpoint/logout",
} as BaseClient;

describe("the postLogout controller", () => {
  it("clears the SMSESSION cookie", async () => {
    const res = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    const handler = logoutController(client, middlewareOptions);

    const req = {};
    await handler(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith("SMSESSION", {
      domain: ".gov.bc.ca",
      secure: true,
    });
  });

  it("redirects to the base url if the user is already logged out", async () => {
    const res = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    const handler = logoutController(client, middlewareOptions);

    const req = {};
    await handler(req, res);
    expect(res.redirect).toHaveBeenCalledWith("https://example.com/");
  });

  it("redirects to the provider's logout endpoint if the user is authenticated", async () => {
    const res = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    const handler = logoutController(client, middlewareOptions);

    const req = {
      session: { tokenSet: {} },
    };
    mocked(isAuthenticated).mockReturnValue(true);
    await handler(req, res);
    expect(res.redirect).toHaveBeenCalledWith("https://oidc-endpoint/logout");
  });

  it("removes the tokenset from the session", async () => {
    const res = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    const handler = logoutController(client, middlewareOptions);

    const req = {
      session: { tokenSet: {} },
    };
    mocked(isAuthenticated).mockReturnValue(true);
    await handler(req, res);
    expect(req.session).toEqual({});
  });
});

describe("the tokenSet controller", () => {
  it.todo("tries to refresh the access token if it is expired");
  it.todo("adds the claims to the request");
  it.todo("calls the next middleware in the stack");
});

describe("the sessionIdleRemainingTimeController", () => {
  it.todo("returns the remaining time");
  it.todo("returns a mocked time if authentication is bypassed");
});

describe("the loginController", () => {
  it.todo("redirects to the landing route if the user is already logged in");
  it.todo("redirects to the landing route if authentication is bypassed");
  it.todo("adds a randomly-generated OpenID state to the session");
  it.todo("redirects the user to the provider's auth URL");
});

describe("the authCallbackController", () => {
  it.todo("check if the OpenID state of the request matches the session's");
  it.todo("fetches the tokenSet");
  it.todo("redirects to the landing route");
  it.todo("redirects to the base URL if it cannot fetch the tokenSet");
});
