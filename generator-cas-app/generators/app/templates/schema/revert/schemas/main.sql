-- Revert <%- projectName %>:schema/<%- schemaName %> from pg

begin;

drop schema <%- schemaName %>;

commit;
