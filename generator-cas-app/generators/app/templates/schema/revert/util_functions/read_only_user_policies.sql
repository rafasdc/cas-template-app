-- Revert <%= projectName %>:util_functions/read_only_user_policies from pg

begin;

drop function <%= schemaName %>_private.read_only_user_policies(text, text);

commit;
