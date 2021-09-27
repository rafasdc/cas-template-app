-- Deploy <%= projectName %>:schema/<%= schemaName %>_private to pg

begin;

create schema <%= schemaName %>_private;
grant usage on schema <%= schemaName %>_private to <%= authenticatedRoles.join(", ") %>;
comment on schema <%= schemaName %>_private is 'The private schema for the <%= projectName %> application. It contains utility functions which should not be available directly through the API.';

commit;
