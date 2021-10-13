-- Revert <%- projectName %>:util_functions/verify_type_not_present from pg

begin;

drop function <%- schemaName %>_private.verify_type_not_present(text);

commit;
