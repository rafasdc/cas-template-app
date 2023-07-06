import { Request, Router } from "express";
import { Issuer } from "openid-client";
import { getSessionRemainingTime, isAuthenticated } from "./helpers";
export { getSessionRemainingTime, isAuthenticated };
import type { IdTokenClaims, TokenSetParameters } from "openid-client";
import {
  authCallbackController,
  loginController,
  logoutController,
  sessionIdleRemainingTimeController,
  tokenSetController,
} from "./controllers";
import { URL } from "url";

declare global {
  namespace Express {
    export interface Request {
      session?: {
        oidcState?: string;
        tokenSet?: TokenSetParameters;
        codeVerifier?: string;
        [key: string]: any;
      };
      claims?: IdTokenClaims;
    }
  }
}
// Options:
const defaultOptions: Partial<SSOExpressOptions> = {
  applicationDomain: ".gov.bc.ca",
  getLandingRoute: (_req) => "/",
  getRedirectUri: (defaultRedirectUri) => defaultRedirectUri,
  bypassAuthentication: {
    login: false,
    sessionIdleRemainingTime: false,
  }, // set to false if disabled, true if you want to bypass auth in dev environments, fine-tuning by passing an object with the same keys as the routes (supported so far are 'login' and 'sessionIdleRemainingTime')
  routes: {
    login: "/login",
    logout: "/logout",
    sessionIdleRemainingTime: "/session-idle-remaining-time",
    authCallback: "/auth-callback",
    extendSession: '/extend-session',
  },
  authorizationUrlParams: {},
};

export interface SSOExpressOptions {
  oidcConfig: {
    /**
     * If using keycloak this should be the realm url, e.g. https://oidc.gov.bc.ca/auth/realms/myrealm
     */
    oidcIssuer: string;
    clientId: string;
    clientSecret?: string;
    /**
     * The url of the application, accessible from the user's browser e.g. https://myapp.gov.bc.ca,
     * or http://localhost:3000 when doing local development
     */
    baseUrl: string;
  };
  applicationDomain?: string;
  getLandingRoute?: (req: Request) => string;

  /**
   * Function used to build the redirect uri for the oidc provider.
   * The default implementation uses the {baseUrl}/{route.authCallback} from these options.
   *
   * @param defaultRedirectUri The default redirect uri
   * @param req The request object passed to the middleware, useful for passing and retrieving additional url params
   *
   * @returns The redirect uri to use
   */
  getRedirectUri?: (defaultRedirectUri: URL, req: Request) => URL;
  bypassAuthentication?: {
    login?: boolean;
    sessionIdleRemainingTime?: boolean;
  };
  routes?: {
    login?: string;
    logout?: string;
    sessionIdleRemainingTime?: string;
    authCallback?: string;
    extendSession?: string;
  };
  authorizationUrlParams?:
    | Record<string, string>
    | ((req: Request) => Record<string, string>);

  /**
   * Callback function called after the user is authenticated,
   * but before the user is redirected to the landing page.
   *
   * @param req The request object, containing req.claims and req.session.tokenSet
   */
  onAuthCallback?: (req: Request) => Promise<void> | void;
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

  const { clientId, clientSecret, baseUrl, oidcIssuer } = options.oidcConfig;
  const {
    authCallback,
    login,
    logout,
    sessionIdleRemainingTime,
    extendSession,
  } = options.routes;

  const issuer = await Issuer.discover(oidcIssuer);
  const { Client } = issuer;
  const client = new Client({
    client_id: clientId,
    client_secret: clientSecret, // pragma: allowlist secret
    redirect_uris: [`${baseUrl}${authCallback}`],
    post_logout_redirect_uris: [baseUrl],
    token_endpoint_auth_method: clientSecret ? "client_secret_basic" : "none",
  });

  // Creating a router middleware on which we'll add all the specific routes and additional middlewares.
  const middleware = Router();

  //also create a get logout to be used by the onSessionExpired callbaack
  middleware.get(logout, logoutController(client, options));
  middleware.post(logout, logoutController(client, options));

  middleware.use(tokenSetController(client, options, sessionIdleRemainingTime));

  // Session Idle Remaining Time
  // Returns, in seconds, the amount of time left in the session
  if (sessionIdleRemainingTime)
    middleware.get(
      sessionIdleRemainingTime,
      sessionIdleRemainingTimeController(client, options)
    );

  middleware.post(login, loginController(client, options));
  middleware.get(authCallback, authCallbackController(client, options));
  // create a separate extend-session callback
  middleware.get(
    extendSession,
    sessionIdleRemainingTimeController(client, options)
  );

  return middleware;
}

export default ssoExpress;
