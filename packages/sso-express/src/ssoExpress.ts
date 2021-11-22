import { Request, Router } from "express";
import { Issuer, generators, TokenSet } from "openid-client";
import { getSessionRemainingTime, isAuthenticated } from "./helpers";
export { getSessionRemainingTime, isAuthenticated };
import type { IdTokenClaims, TokenSetParameters } from "openid-client";

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
  },
};

const shouldBypassAuthentication = (bypassConfig, routeKey) => {
  return (
    bypassConfig && // will fail if 'null' (which has the type object)
    (bypassConfig === true ||
      (typeof bypassConfig === "object" && bypassConfig[routeKey]))
  );
};

interface SSOExpressOptions {
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
  };
}

async function ssoExpress(opts: SSOExpressOptions) {
  if (!opts.oidcConfig)
    throw new Error("sso-express: oidcConfig key not provided in options");

  const options: SSOExpressOptions = {
    ...defaultOptions,
    ...opts,
  };

  const { clientId, baseUrl, oidcIssuer } = options.oidcConfig;

  const loginRoute = options.routes.login || "/login";
  const logoutRoute = options.routes.logout || "/logout";

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

  // Clear the siteminder session token on logout if we can
  // This will be ignored by the user agent unless we're
  // currently deployed to a subdomain of gov.bc.ca
  middleware.post(logoutRoute, (req, res) => {
    res.clearCookie("SMSESSION", {
      domain: options.applicationDomain,
      secure: true,
    });

    if (!isAuthenticated(req)) {
      return res.redirect(client.metadata.post_logout_redirect_uris[0]);
    }

    const tokenSet = new TokenSet(req.session.tokenSet);
    delete req.session.tokenSet;

    res.redirect(
      client.endSessionUrl({
        id_token_hint: tokenSet,
      })
    );
  });

  middleware.use(async (req, res, next) => {
    if (req.session && req.session.tokenSet) {
      let tokenSet = new TokenSet(req.session.tokenSet);
      // Check if the access token is expired
      if (tokenSet.expired()) {
        // If so, use the refresh token to get a new access token
        try {
          tokenSet = await client.refresh(tokenSet);
        } catch (err) {
          console.error("sso-express could not refresh the access token.");
          console.error(err);
          req.session = {};
          res.redirect(logoutRoute);
        }
        req.session.tokenSet = tokenSet;
      }
      req.claims = tokenSet.claims();
    }
    next();
  });

  // Session Idle Remaining Time
  // Returns, in seconds, the amount of time left in the keycloak session - and extends it if the access token has expired.
  if (options.routes.sessionIdleRemainingTime)
    middleware.get(options.routes.sessionIdleRemainingTime, (req, res) => {
      if (
        shouldBypassAuthentication(
          options.bypassAuthentication,
          "sessionIdleRemainingTime"
        )
      ) {
        return res.json(3600);
      }

      return res.json(getSessionRemainingTime(req));
    });

  // Login route (POST and GET)
  if (shouldBypassAuthentication(options.bypassAuthentication, "login"))
    middleware.post(loginRoute, (req, res) =>
      res.redirect(302, options.getLandingRoute(req))
    );
  else
    middleware.post(loginRoute, (req, res) => {
      if (req.session.tokenSet) {
        res.redirect(302, options.getLandingRoute(req));
        return;
      }

      const state = generators.random(32);
      req.session.oidcState = state;
      const authUrl = client.authorizationUrl({
        state,
      });
      res.redirect(authUrl);
    });

  middleware.get("/auth-callback", async (req, res) => {
    const state = req.query.state as string;
    const cachedState = req.session.oidcState;
    delete req.session.oidcState;
    if (state !== cachedState) {
      console.log("Invalid OIDC state", state, cachedState);
      return res.redirect(logoutRoute);
    }
    const callbackParams = client.callbackParams(req);

    try {
      const tokenSet = await client.callback(
        client.metadata.redirect_uris[0],
        callbackParams,
        {
          state,
        }
      );
      req.session.tokenSet = tokenSet;
      req.claims = tokenSet.claims();
    } catch (err) {
      console.error("sso-express could not get the access token.");
      console.error(err);

      res.redirect(logoutRoute);
    }

    res.redirect(options.getLandingRoute(req));
  });

  middleware.get(loginRoute, (req, res) =>
    res.redirect(302, options.getLandingRoute(req))
  );

  return middleware;
}

export default ssoExpress;
