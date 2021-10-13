-- Revert <%- projectName %>:types/keycloak_jwt from pg

begin;

drop type <%- schemaName %>.keycloak_jwt;

commit;
