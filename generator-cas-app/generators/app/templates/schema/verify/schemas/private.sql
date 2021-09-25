-- Verify <%= projectName %>:schema/<%= schemaName %>_private on pg

begin;

select pg_catalog.has_schema_privilege('<%= schemaName %>_private', 'usage');

rollback;