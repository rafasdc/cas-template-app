-- Revert <%= projectName %>:tables/<%= userTable %> on pg

begin;

drop table <%= schemaName %>.<%= userTable %>;

commit;
