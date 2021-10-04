begin;
select plan(3);

select has_type('<%- schemaName %>', 'keycloak_jwt', 'Type keycloak_jwt should exist');
select has_column('<%- schemaName %>', 'keycloak_jwt', 'sub', 'Type keycloak_jwt should have a sub column');
select col_type_is('<%- schemaName %>', 'keycloak_jwt', 'sub', 'uuid', 'Type keycloak_jwt should have a sub column with type uuid');

select finish();

rollback;
