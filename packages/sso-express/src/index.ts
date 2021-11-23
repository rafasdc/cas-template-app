import { Request, Router } from "express";
import { Issuer } from "openid-client";
import { getSessionRemainingTime, isAuthenticated } from "./helpers";
export { getSessionRemainingTime, isAuthenticated };
import type { IdTokenClaims, TokenSetParameters } from "openid-client";
import {
  authCallbackController,
  logoutController,
  sessionIdleRemainingTimeController,
  tokenSetController,
} from "./controllers";

declare global {
  namespace Express {
    export interface Request {
      session?: {
        oidcState?: string;
        tokenSet?: TokenSetParameters;
      };
      claims?: IdTokenClaims;
    }
  }
}
// Options:
const defaultOptions: Partial<SSOExpressOptions> = {
  applicationDomain: ".gov.bc.ca",
  getLandingRoute: (_req) => "/",
  bypassAuthentication: {
    login: false,
    sessionIdleRemainingTime: false,
  }, // set to false if disabled, true if you want to bypass auth in dev environments, fine-tuning by passing an object with the same keys as the routes (supported so far are 'login' and 'sessionIdleRemainingTime')
  routes: {
    login: "/login",
    logout: "/logout",
    // register: "/register", // allow true/false to disable the register route. Disabled by default, set to true or a string to enable,
    sessionIdleRemainingTime: "/session-idle-remaining-time",
    authCallback: "/auth-callback",
  },
};

export interface SSOExpressOptions {
  oidcConfig: {
    /**
     * If using keycloak this should be the realm url, e.g. https://oidc.gov.bc.ca/auth/realms/myrealm
     */
    oidcIssuer: string;
    clientId: string;
    /**
     * The url of the application, accessible from the user's browser e.g. https://myapp.gov.bc.ca,
     * or http://localhost:3000 when doing local development
     */
    baseUrl: string;
  };
  applicationDomain?: string;
  getLandingRoute?: (req: Request) => string;
  bypassAuthentication?: {
    login?: boolean;
    sessionIdleRemainingTime?: boolean;
  };
  routes?: {
    login?: string;
    logout?: string;
    sessionIdleRemainingTime?: string;
    authCallback?: string;
  };
}

async function ssoExpress(opts: SSOExpressOptions) {
  if (!opts.oidcConfig)
    throw new Error("sso-express: oidcConfig key not provided in options");

  const options: SSOExpressOptions = {
    ...defaultOptions,
    ...opts,
    routes: {
      ...defaultOptions.routes,
      ...opts.routes,
    },
  };

  const { clientId, baseUrl, oidcIssuer } = options.oidcConfig;
  const { authCallback, login, logout, sessionIdleRemainingTime } =
    options.routes;

  const issuer = await Issuer.discover(oidcIssuer);
  const { Client } = issuer;
  const client = new Client({
    client_id: clientId,
    redirect_uris: [`${baseUrl}/auth-callback`],
    post_logout_redirect_uris: [baseUrl],
    token_endpoint_auth_method: "none", // only support public clients
  });

  // Creating a router middleware on which we'll add all the specific routes and additional middlewares.
  const middleware = Router();

  middleware.post(logout, logoutController(client, options));

  middleware.use(tokenSetController(client, options));

  // Session Idle Remaining Time
  // Returns, in seconds, the amount of time left in the keycloak session - and extends it if the access token has expired.
  if (sessionIdleRemainingTime)
    middleware.get(
      sessionIdleRemainingTime,
      sessionIdleRemainingTimeController(client, options)
    );

  middleware.post(login, logoutController(client, options));
  middleware.get(authCallback, authCallbackController(client, options));

  return middleware;
}

export default ssoExpress;
