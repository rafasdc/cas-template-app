<% const userTable = projectName + '_user' %>
-- Deploy <%= projectName %>:tables/<%= userTable %> to pg

begin;
create table <%= schemaName %>.<%= userTable %>
(
  id integer primary key generated always as identity,
  uuid uuid not null,
  first_name varchar(1000),
  last_name varchar(1000),
  email_address varchar(1000)
);

select <%= schemaName %>_private.upsert_timestamp_columns('<%= schemaName %>', '<%= userTable %>');

create unique index <%= userTable %>_uuid on <%= schemaName %>.<%= userTable %>(uuid);

do
$grant$
begin
<% authenticatedRoles.forEach(function(role) { %>
-- Grant <%= role %> permissions
perform <%= schemaName %>_private.grant_permissions('select', '<%= userTable %>', '<%= role %>');
perform <%= schemaName %>_private.grant_permissions('insert', '<%= userTable %>', '<%= role %>');
perform <%= schemaName %>_private.grant_permissions('update', '<%= userTable %>', '<%= role %>',
  ARRAY['first_name', 'last_name', 'email_address', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by']);
<% }); %>

-- Grant <%= guestRole %> permissions
perform <%= schemaName %>_private.grant_permissions('select', '<%= userTable %>', '<%= guestRole %>');

end
$grant$;

-- Enable row-level security
alter table <%= schemaName %>.<%= userTable %> enable row level security;

do
$policy$
begin
-- <%= adminRole %> RLS
perform <%= schemaName %>_private.upsert_policy('<%= adminRole %>_select_<%= userTable %>', '<%= userTable %>', 'select', '<%= adminRole %>', 'true');
perform <%= schemaName %>_private.upsert_policy('<%= adminRole %>_insert_<%= userTable %>', '<%= userTable %>', 'insert', '<%= adminRole %>', 'true');
perform <%= schemaName %>_private.upsert_policy('<%= adminRole %>_update_<%= userTable %>', '<%= userTable %>', 'update', '<%= adminRole %>', 'true');


<% nonAdminRoles.forEach(function(role) { %>
-- <%= role %> RLS: can see all users, but can only modify its own record
perform <%= schemaName %>_private.upsert_policy('<%= role %>_select_<%= userTable %>', '<%= userTable %>', 'select', '<%= role %>', 'true');
perform <%= schemaName %>_private.upsert_policy('<%= role %>_insert_<%= userTable %>', '<%= userTable %>', 'insert', '<%= role %>', 'uuid=(select sub from <%= schemaName %>.session())');
perform <%= schemaName %>_private.upsert_policy('<%= role %>_update_<%= userTable %>', '<%= userTable %>', 'update', '<%= role %>', 'uuid=(select sub from <%= schemaName %>.session())');
<% }); %>

-- <%= guestRole %> RLS: can only see its own (empty) record
perform <%= schemaName %>_private.upsert_policy('<%= guestRole %>_select_<%= userTable %>', '<%= userTable %>', 'select', '<%= guestRole %>', 'uuid=(select sub from <%= schemaName %>.session())');

end
$policy$;

comment on table <%= schemaName %>.<%= userTable %> is 'Table containing information about the application''s users ';
comment on column <%= schemaName %>.<%= userTable %>.id is 'Unique ID for the user';
comment on column <%= schemaName %>.<%= userTable %>.uuid is 'Universally Unique ID for the user, defined by the single sign-on provider';
comment on column <%= schemaName %>.<%= userTable %>.first_name is 'User''s first name';
comment on column <%= schemaName %>.<%= userTable %>.last_name is 'User''s last name';
comment on column <%= schemaName %>.<%= userTable %>.email_address is 'User''s email address';

commit;
