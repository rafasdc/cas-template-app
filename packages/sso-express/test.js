

const request = require('supertest')
const express = require('express')

beforeEach(() => {
  // Forcing re-import of modules for each test,
  // since we mock dependencies.
  jest.resetModules();
})

describe("The test middleware", () => {
  it("Throws an error if there is no keycloak config provided", () => {
    const ssoUtils = require('./ssoUtils');

    expect(() => new ssoUtils({
      // no keycolakConfig key
    })).toThrow('sso-utils: keycloakConfig key not provided in options');
  });

  it("Instantiates keycloak with the right parameters", () => {
    jest.mock('keycloak-connect');

    const kc = require('keycloak-connect');
    kc.mockReturnValue(
      {
        middleware: (...args) => { return (req,res,next) => {} },
        protect: (...args) => { return (req, res, next) => {} }
      }
    );

    const ssoUtils = require('./ssoUtils');

    const moduleUnderTest = new ssoUtils({
      keycloakConfig: {testkey: 'testvalue'},
      sessionStore: {testStore: true}
    });


    expect(kc).toHaveBeenCalledWith({store: {testStore: true}}, {testkey: 'testvalue'});
  });

  it("Configures the middleware with the right routes", () => {
    jest.mock('keycloak-connect');

    const kc = require('keycloak-connect');
    kc.mockReturnValue(
      {
        middleware: (...args) => { return (req,res,next) => {} },
        protect: (...args) => { return (req, res, next) => {} }
      }
    );

    const ssoUtils = require('./ssoUtils');

    const moduleUnderTest = new ssoUtils({
      keycloakConfig: {testkey: 'testvalue'},
      sessionStore: {testStore: true},
      routes:{
        login: '/testloginroute',
        logout: '/testlogout',
        register: '/testregister',
        sessionIdleRemainingTime: '/testremaining',
        extendSession: '/testextend'
      }
    });
    
    // 6 configured routes, and 2 anonymous middleware routes (keycloak + auto session extend)
    expect(moduleUnderTest.ssoMiddleware.stack.length).toBe(8);

    const configuredRouteObjects = moduleUnderTest.ssoMiddleware.stack.map(s => s.route).filter(r => r).map(r => {
      return {
        path: r.path,
        method: Object.keys(r.methods)[0]
      }
    });

    expect(configuredRouteObjects).toStrictEqual([
      {path: '/testlogout', method: 'post'},
      {path: '/testremaining', method: 'get'},
      {path: '/testextend', method: 'get'},
      {path: '/testloginroute', method: 'post'},
      {path: '/testloginroute', method: 'get'},
      {path: '/testregister', method: 'get'},
    ]);

  });
});