-- Revert <%= projectName %>:util_functions/verify_policy_not_present from pg

begin;

drop function <%= schemaName %>_private.verify_policy_not_present(text, text);

commit;
