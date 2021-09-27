-- Deploy <%= projectName %>:schema/<%= schemaName %> to pg

begin;

create schema <%= schemaName %>;
grant usage on schema <%= schemaName %> to <%= roles %>;
comment on schema <%= schemaName %> is 'The main schema for the <%= projectName %> application.';

commit;
