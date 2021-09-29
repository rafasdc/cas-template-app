-- Verify <%= projectName %>:tables/<%= userTable %> on pg

begin;

select pg_catalog.has_table_privilege('<%= schemaName %>.<%= userTable %>', 'select');

<% authenticatedRoles.forEach(function(role) { %>
-- <%= adminRole %> Grants
select <%= schemaName %>_private.verify_grant('select', '<%= userTable %>', '<%= role %>');
select <%= schemaName %>_private.verify_grant('insert', '<%= userTable %>', '<%= role %>');
select <%= schemaName %>_private.verify_grant('update', '<%= userTable %>', '<%= role %>',
  ARRAY['first_name', 'last_name', 'email_address', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by']);
<% }); %>

-- <%= guestRole %> grant
select <%= schemaName %>_private.verify_grant('select', '<%= userTable %>', '<%= guestRole %>');

rollback;
