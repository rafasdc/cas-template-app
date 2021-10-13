-- Revert <%- projectName %>:util_functions/verify_policy from pg

begin;

drop function <%- schemaName %>_private.verify_policy(text, text, text, text, text);

commit;
