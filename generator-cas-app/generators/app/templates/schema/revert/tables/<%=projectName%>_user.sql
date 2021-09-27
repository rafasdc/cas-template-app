-- Revert <%= projectName %>:tables/<%= projectName %>_user on pg

begin;

drop table <%= schemaName %>.<%= projectName %>_user;

commit;
