-- Revert <%- projectName %>:util_functions/upsert_policy from pg

begin;

drop function <%- schemaName %>_private.upsert_policy(text, text, text, text, text, text);
drop function <%- schemaName %>_private.upsert_policy(text, text, text, text, text, text, text);

commit;
