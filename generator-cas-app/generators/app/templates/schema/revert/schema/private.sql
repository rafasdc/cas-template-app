-- Revert <%= projectName %>:schema/<%= schemaName %>_private from pg

begin;

drop schema <%= schemaName %>_private;

commit;