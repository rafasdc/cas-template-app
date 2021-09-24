-- Verify <%= projectName %>:schema/<%= schemaName %> on pg

begin;

select pg_catalog.has_schema_privilege('<%= schemaName %>', 'usage');

rollback;
