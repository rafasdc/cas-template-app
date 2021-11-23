import { BaseClient, generators, TokenSet } from "openid-client";
import { getSessionRemainingTime, isAuthenticated } from "./helpers";
import { SSOExpressOptions } from "./index";

const shouldBypassAuthentication = (bypassConfig, routeKey) => {
  return (
    bypassConfig && // will fail if 'null' (which has the type object)
    (bypassConfig === true ||
      (typeof bypassConfig === "object" && bypassConfig[routeKey]))
  );
};

export const logoutController =
  (client: BaseClient, options: SSOExpressOptions) => (req, res) => {
    // Clear the siteminder session token on logout if we can
    // This will be ignored by the user agent unless we're
    // currently deployed to a subdomain of gov.bc.ca
    res.clearCookie("SMSESSION", {
      domain: options.applicationDomain,
      secure: true,
    });

    if (!isAuthenticated(req)) {
      res.redirect(client.metadata.post_logout_redirect_uris[0]);
      return;
    }

    const tokenSet = new TokenSet(req.session.tokenSet);
    delete req.session.tokenSet;

    res.redirect(
      client.endSessionUrl({
        id_token_hint: tokenSet,
      })
    );
  };

export const tokenSetController =
  (client: BaseClient, options: SSOExpressOptions) =>
  async (req, res, next) => {
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
          res.redirect(options.oidcConfig.baseUrl);
        }
        req.session.tokenSet = tokenSet;
      }
      req.claims = tokenSet.claims();
    }
    next();
  };

export const sessionIdleRemainingTimeController =
  (_client: BaseClient, options: SSOExpressOptions) => (req, res) => {
    if (
      shouldBypassAuthentication(
        options.bypassAuthentication,
        "sessionIdleRemainingTime"
      )
    ) {
      return res.json(3600);
    }

    return res.json(getSessionRemainingTime(req));
  };

export const loginController =
  (client: BaseClient, options: SSOExpressOptions) => (req, res) => {
    if (
      req.session.tokenSet ||
      shouldBypassAuthentication(options.bypassAuthentication, "login")
    ) {
      res.redirect(302, options.getLandingRoute(req));
      return;
    }

    const state = generators.random(32);
    req.session.oidcState = state;
    const authUrl = client.authorizationUrl({
      state,
    });
    res.redirect(authUrl);
  };

export const authCallbackController =
  (client: BaseClient, options: SSOExpressOptions) => async (req, res) => {
    const state = req.query.state as string;
    const cachedState = req.session.oidcState;
    delete req.session.oidcState;
    if (state !== cachedState) {
      console.log("Invalid OIDC state", state, cachedState);
      return res.redirect(options.oidcConfig.baseUrl);
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
      res.redirect(options.getLandingRoute(req));
    } catch (err) {
      console.error("sso-express could not get the access token.");
      console.error(err);
      res.redirect(options.oidcConfig.baseUrl);
    }
  };
