# sso-express

A node module exposing a developer-friendly sso/keycloak middleware for express servers

## Usage

This package exposes:

- An express middleware
- The underlying keycloak object, should the developer need access to the underlying grants and tokens, or add protection to additional routes.

### Example usage

```
const ssoUtils = require('@bcgov-cas/sso-express');

const {ssoMiddleware, keycloak} = new ssoUtils({
  applicationHost: 'example.gov.bc.ca',
  keycloakConfig: {
    realm: 'kcrealm',
    ...
  },
  ...
});

server.use(ssoMiddleware);

server.get('/my-protected-route', keycloak.protect());
```

## Configuration

the constructor expects a single configuration object, with required and optional keys

#### Required configuration

Only the keycloak configuration key `keycloakConfig` is mandatory
More details on the available configuration can be found here: https://github.com/keycloak/keycloak-nodejs-connect

Example:

```
const configOptions = {
  keycloakConfig:{
    realm: 'keycloakrealm',
    'auth-server-url': `https://example.gov.bc.ca/auth`,
    'ssl-required': 'external',
    resource: 'myappresource',
    'public-client': true,
    'confidential-port': 0
  }
}
```

#### Optional configuration

In addition, all these configuration keys are accepted:

| Key               | Description                                                                         | Default value    |
| :---------------- | :---------------------------------------------------------------------------------- | :--------------- |
| `applicationHost` | Base URL of the protected application, used to build the redirect to the login page | http://localhost |
| `sessionStore`    | Extra session store to persist the session. If null, the memory store will be used  | null             |
| `getLandingRoute` | Function `(req) => string` used to redirect the user after login.                   | `() => '/'`      |
