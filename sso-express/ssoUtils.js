const express = require('express')
const Keycloak = require('keycloak-connect');
const {getSessionRemainingTime} = require('./helpers');

// Options:
const defaultOptions = {
  // options here
  applicationHost: "localhost",
  sessionStore: null,
  keycloakConfig:{
    realm: 'pisrwwhx',
    'auth-server-url': `https://${kcNamespace}oidc.gov.bc.ca/auth`,
    'ssl-required': 'external',
    resource: 'cas-ciip-portal',
    'public-client': true,
    'confidential-port': 0
  },
  getLandingRoute: (req) => {}, // .... ,
  bypassAuthentication: {
    login: false,
    sessionIdleRemainingTime: false
  }, // set to false if disabled, true if you want to bypass auth in dev environments, fine-tuning by passing an object with the same keys as the routes (supported so far are 'login' and 'sessionIdleRemainingTime')
  accessDenied: (req, res) => { res.redirect('/403'); }, //provide an optional implementation for behaviour on keycloak access denied
  routes: {
    login: '/login',
    logout: '/logout',
    register: '/register', // allow true/false to disable the register route. Disabled by default, set to true or a string to enable,
    sessionIdleRemainingTime: '/session-idle-remaining-time',//
    extendSession: '/extend-session'//
  }
}

const shouldBypassAuthentication = (bypassConfig, routeKey) => {
  return bypassConfig && // will fail if 'null' (which has the type object)
        (bypassConfig === true || (typeof bypassConfig === 'object' && bypassConfig[routeKey]));
}

function ssoUtils(opts) {
  const options = {
    defaultOptions,
    ...opts
  }

  Keycloak.prototype.accessDenied = ({req, res}) => options.accessDenied(req, res);

  const keycloak = new Keycloak({store: options.sessionStore}, options.keycloakConfig);


  const kcRegistrationUrl = `${options.keycloakConfig['auth-server-url']}/realms/${
    options.keycloakConfig.realm
  }/protocol/openid-connect/registrations?client_id=${
    options.keycloakConfig.resource
  }&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(
    `${options.applicationHost}/${options.routes.login}?auth_callback=1`
  )}`;

  // Creating a router middleware on which we'll add all the specific routes and additional middlewares.
  const middleware = express.Router()

  // Clear the siteminder session token on logout if we can
  // This will be ignored by the user agent unless we're
  // currently deployed to a subdomain of gov.bc.ca
  middleware.post(options.routes.logout, (_req, res, next) => {
    res.clearCookie('SMSESSION', {domain: '.gov.bc.ca', secure: true});
    next();
  });

  middleware.use(
    keycloak.middleware({
      logout: options.routes.logout,
      admin: '/'
    })
  );

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
  middleware.get('/extend-session', async (req, res) => {
    return res.json(await getSessionRemainingTime(keycloak, req, res));
  });

  if (shouldBypassAuthentication(options.bypassAuthentication, 'login'))
    middleware.post('/login', (req, res) => res.redirect(302, getRedirectURL(req)));
  else
    middleware.post('/login', keycloak.protect(), (req, res) =>
      // This request handler gets called on a POST to /login if the user is already authenticated
      res.redirect(302, getRedirectURL(req))
    );

  middleware.get('/login', (req, res) => res.redirect(302, getRedirectURL(req)));

  middleware.get('/register', ({res}) => res.redirect(302, kcRegistrationUrl));


  this.keycloak = keycloak;
  this.ssoMiddleware = middleware;
}

module.exports = ssoUtils;