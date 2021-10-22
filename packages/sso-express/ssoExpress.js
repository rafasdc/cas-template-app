const express = require('express')
const Keycloak = require('keycloak-connect');
const {getSessionRemainingTime} = require('./helpers');

// Options:
const defaultOptions = {
  applicationHost: "localhost",
  applicationDomain: ".gov.bc.ca",
  sessionStore: null,
  getLandingRoute: (_req) => '/',
  bypassAuthentication: {
    login: false,
    sessionIdleRemainingTime: false
  }, // set to false if disabled, true if you want to bypass auth in dev environments, fine-tuning by passing an object with the same keys as the routes (supported so far are 'login' and 'sessionIdleRemainingTime')
  accessDenied: null, //provide an optional implementation for behaviour on keycloak access denied
  routes: {
    login: '/login',
    logout: '/logout',
    register: '/register', // allow true/false to disable the register route. Disabled by default, set to true or a string to enable,
    sessionIdleRemainingTime: '/session-idle-remaining-time',
    extendSession: '/extend-session'
  }
}

const shouldBypassAuthentication = (bypassConfig, routeKey) => {
  return bypassConfig && // will fail if 'null' (which has the type object)
        (bypassConfig === true || (typeof bypassConfig === 'object' && bypassConfig[routeKey]));
}

function ssoExpress(opts) {
  if(!opts.keycloakConfig)
    throw new Error('sso-express: keycloakConfig key not provided in options');

  const options = {
    ...defaultOptions,
    ...opts
  }

  const loginRoute = options.routes.login || '/login';
  const logoutRoute = options.routes.logout || '/logout';
  const storeConfig = options.sessionStore ? {store: options.sessionStore} : {};

  if(options.accessDenied)
    Keycloak.prototype.accessDenied = (req, res) => options.accessDenied(req, res);

  const keycloak = new Keycloak(storeConfig, options.keycloakConfig);

  const kcRegistrationUrl = `${options.keycloakConfig['auth-server-url']}/realms/${
    options.keycloakConfig.realm
  }/protocol/openid-connect/registrations?client_id=${
    options.keycloakConfig.resource
  }&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(
    `${options.applicationHost}/${loginRoute}?auth_callback=1`
  )}`;

  // Creating a router middleware on which we'll add all the specific routes and additional middlewares.
  const middleware = express.Router()

  // Clear the siteminder session token on logout if we can
  // This will be ignored by the user agent unless we're
  // currently deployed to a subdomain of gov.bc.ca
  middleware.post(logoutRoute, (_req, res, next) => {
    res.clearCookie('SMSESSION', {domain: options.applicationDomain, secure: true});
    next();
  });

  middleware.use(
    keycloak.middleware({
      logout: logoutRoute,
      admin: '/'
    })
  );

  // Session Idle Remaining Time
  // Returns, in seconds, the amount of time left in the keycloak session
  if(options.routes.sessionIdleRemainingTime)
    middleware.get(options.routes.sessionIdleRemainingTime, async (req, res) => {
      if (shouldBypassAuthentication(options.bypassAuthentication, 'sessionIdleRemainingTime')) {
        return res.json(3600);
      }

      if (!req.kauth || !req.kauth.grant) {
        return res.json(null);
      }

      return res.json(await getSessionRemainingTime(keycloak, req, res));
    });

  // For any request (other than getting the remaining idle time), refresh the grant
  // if needed. If the access token is expired (defaults to 5min in keycloak),
  // the refresh token will be used to get a new access token, and the refresh token expiry will be updated.
  middleware.use(async (req, res, next) => {
    if (req.kauth && req.kauth.grant) {
      try {
        const grant = await keycloak.getGrant(req, res);
        await keycloak.grantManager.ensureFreshness(grant);
      } catch (error) {
        return next(error);
      }
    }
    next();
  });

  // This ensures grant freshness with the previous directive - we just return a success response code.
  if(options.routes.extendSession)
    middleware.get(options.routes.extendSession, async (req, res) => {
      return res.json(await getSessionRemainingTime(keycloak, req, res));
    });


  // Login route (POST and GET)
  if (shouldBypassAuthentication(options.bypassAuthentication, 'login'))
    middleware.post(loginRoute, (req, res) => res.redirect(302, options.getLandingRoute(req)));
  else
    middleware.post(loginRoute, keycloak.protect(), (req, res) =>
      // This request handler gets called on a POST to /login if the user is already authenticated
      res.redirect(302, options.getLandingRoute(req))
    );

  middleware.get(loginRoute, (req, res) => res.redirect(302, options.getLandingRoute(req)));

  // Register Route
  if(options.routes.register)
    middleware.get(options.routes.register, ({res}) => res.redirect(302, kcRegistrationUrl));


  this.keycloak = keycloak;
  this.ssoMiddleware = middleware;
}

module.exports = ssoExpress;
