-- Revert <%- projectName %>:tables/connect_session on pg

begin;

drop table <%- schemaName %>_private.connect_session;

commit;
