# sso-express

A node module exposing a developer-friendly sso/keycloak middleware for express servers

## Prerequisites

- `express` and `openid-client` peer dependencies (see `package.json` for supported versions)
- The `express-session` middleware must be added to the stack before this middleware, as it assumes that `req.session` exists

## Usage

This package exposes an express middleware

> :warning: **When using the exposed middleware, any request to the express server - including to static endpoints - will extend the session.**

### Exposed endpoints

The package configures a middleware with the following configurable endpoints:

| Endpoint               | Default URL                    | can be disabled |
| :--------------------- | :----------------------------- | :-------------- |
| Login                  | `/login`                       | [ ]             |
| Logout                 | `/logout`                      | [ ]             |
| Auth Callback          | `/auth-callback`               | [ ]             |
| Session Remaining Time | `/session-idle-remaining-time` | [x]             |

### Example usage

```javascript
const ssoUtils = require("@bcgov-cas/sso-express").default;

const ssoMiddleware = await ssoUtils({
  applicationDomain: ".gov.bc.ca",
  getLandingRoute: (req) => {
    // Depending on your sso configuration
    return getLanding(req.claims);
  },
  getRedirectUri: (defaultRedirectUri, req) => {
    // can be used to add additional query params to the default redirect uri:
    const redirectUri = new URL(defaultRedirectUri);
    redirectUri.searchParams.set("redirect", "/some/path");
    return redirectUri;
  },
  bypassAuthentication: {
    login: process.env.BYPASS_AUTH_ON_LOCAL,
    sessionIdleRemainingTime: process.env.BYPASS_AUTH_ON_LOCAL,
  },
  oidcConfig: {
    oidcIssuer: `https://oidc.gov.bc.ca/auth/realm/myrealm`,
    clientId: "myappresource",
    clientSecret: "verysecuresecret", // optional
    baseUrl: "http://localhost:3000",
  },
});

server.use(ssoMiddleware);
```

### Authentication data

This middleware adds the following authentication data to the express request (`req`):

- The OpenId TokenSet (see the `openid-client` documentation) is available at `req.session.tokenSet`
- The OpenId claims are available at `req.claims`

## Configuration

The constructor expects a single configuration object, with required and optional keys

#### Required configuration

Only the OpenId configuration key `oidcConfig` is mandatory

Example:

```javascript
const configOptions = {
  oidcConfig: {
    oidcIssuer: `https://oidc.gov.bc.ca/auth/realm/myrealm`,
    clientId: "myappresource",
    baseUrl: "http://localhost:3000",
  },
};
```

#### Optional configuration

In addition, all these configuration keys are accepted:

| Key                    | Description                                                                                                             | Default value |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------ |
| `applicationDomain`    | Restricts clearing the session cookie to this domain.                                                                   | .gov.bc.ca    |
| `getLandingRoute`      | Function `(req) => string` used to redirect the user after login.                                                       | `() => '/'`   |
| `getRedirectUri`       | Function `(defaultRedirectUri: URL, req) => URL` can be used to modify the redirect uri with the request's context.     | `defaultRedirectUri`|
| `bypassAuthentication` | Set to `true`, `false` or `{ login: t/f , sessionIdleRemainingTime: t/f }` to configure.                                | `false`       |
| `routes`               | Overrides the default routes below. Set to `false` or `''` to disable (unavailable for login, logout, and authCallback).| see below     |
| `onAuthCallback`       | Callback function called after the user is authenticated, but before the user is redirected to the landing page.        | `undefined `  |

<br />
Default routes object:

```javascript
  routes: {
    login: '/login',
    logout: '/logout',
    sessionIdleRemainingTime: '/session-idle-remaining-time',
    authCallback: '/auth-callback'
  }
```
