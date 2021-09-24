-- Deploy <%= projectName %>:schema/<%= schemaName %> to pg

begin;

create schema <%= schemaName %>;
comment on schema <%= schemaName %> is 'The main schema for the <%= projectName %> application.';

commit;
