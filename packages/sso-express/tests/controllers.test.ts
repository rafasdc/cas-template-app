import { BaseClient, TokenSet } from "openid-client";
import { mocked } from "ts-jest/utils";
import { SSOExpressOptions } from "../src";
import {
  logoutController,
  sessionIdleRemainingTimeController,
  tokenSetController,
} from "../src/controllers";
import { isAuthenticated, getSessionRemainingTime } from "../src/helpers";
jest.mock("../src/helpers");
jest.mock("openid-client");

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
  refresh: jest.fn(),
} as unknown as BaseClient;

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
  it("tries to refresh the access token if it is expired", async () => {
    mocked(isAuthenticated).mockReturnValue(true);
    const req = {
      session: { tokenSet: {} },
    };
    const res = {};
    const next = jest.fn();

    const expiredTokenSet = {
      expired: () => true,
      claims: jest.fn(),
    } as TokenSet;

    const newTokenSet = {
      expired: () => false,
      claims: jest.fn(),
    } as TokenSet;

    mocked(TokenSet).mockImplementation(() => expiredTokenSet);
    mocked(client.refresh).mockResolvedValue(newTokenSet);

    const handler = tokenSetController(client, middlewareOptions);
    await handler(req, res, next);
    expect(client.refresh).toHaveBeenCalledWith(expiredTokenSet);
    expect(expiredTokenSet.claims).toHaveBeenCalledTimes(0);
    expect(newTokenSet.claims).toHaveBeenCalled();
    expect(req.session.tokenSet).toEqual(newTokenSet);
  });

  it.todo("adds the claims to the request");
  it.todo("calls the next middleware in the stack");
});

describe("the sessionIdleRemainingTimeController", () => {
  it("returns the remaining time", async () => {
    const handler = sessionIdleRemainingTimeController(
      client,
      middlewareOptions
    );
    const req = {};
    const res = {
      json: jest.fn(),
    };
    mocked(getSessionRemainingTime).mockReturnValue(123);
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(123);
  });

  it("returns a mocked time if authentication is bypassed", async () => {
    const handler = sessionIdleRemainingTimeController(client, {
      ...middlewareOptions,
      bypassAuthentication: { sessionIdleRemainingTime: true },
    });
    const req = {};
    const res = {
      json: jest.fn(),
    };
    mocked(getSessionRemainingTime).mockReturnValue(123);
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(3600);
  });
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
