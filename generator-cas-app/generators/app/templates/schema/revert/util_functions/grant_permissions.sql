-- Revert <%= projectName %>:util_functions/grant_permissions from pg

begin;

drop function <%= schemaName %>_private.grant_permissions(text, text, text, text);
drop function <%= schemaName %>_private.grant_permissions(text, text, text, text[], text);

commit;
