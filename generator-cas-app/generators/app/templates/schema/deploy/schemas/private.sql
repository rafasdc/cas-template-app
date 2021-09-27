-- Deploy <%= projectName %>:schema/<%= schemaName %>_private to pg

begin;

create schema <%= schemaName %>_private;
-- If you have a "guest" role, you may not want to grant access to the private schema to it.
grant usage on schema <%= schemaName %>_private to <%= roles %>;
comment on schema <%= schemaName %>_private is 'The private schema for the <%= projectName %> application. It contains utility functions which should not be available directly through the API.';

commit;
