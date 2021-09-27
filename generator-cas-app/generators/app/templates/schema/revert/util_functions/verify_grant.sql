-- Revert <%= projectName %>:util_functions/verify_grant from pg

begin;

drop function <%= schemaName %>_private.verify_grant(text, text, text, text);
drop function <%= schemaName %>_private.verify_grant(text, text, text, text[], text);

commit;
