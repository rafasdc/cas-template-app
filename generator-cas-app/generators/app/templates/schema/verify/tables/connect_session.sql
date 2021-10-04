-- Verify <%- projectName %>:tables/connect_session on pg

begin;

select pg_catalog.has_table_privilege('<%- schemaName %>_private.connect_session', 'select');

rollback;
