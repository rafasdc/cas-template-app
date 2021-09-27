-- Revert <%= projectName %>:functions/session from pg


begin;

drop function <%= schemaName %>.session();

commit;
