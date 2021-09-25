-- Deploy <%= projectName %>-app:tables/<%= projectName %>_user to pg

begin;

create table <%= schemaName %>.<%= projectName %>_user
(
  id integer primary key generated always as identity,
  uuid uuid not null,
  first_name varchar(1000),
  last_name varchar(1000),
  email_address varchar(1000)
);

select <%= schemaName %>_private.upsert_timestamp_columns('<%= schemaName %>', '<%= projectName %>_user');

create unique index <%= projectName %>_user_uuid on <%= schemaName %>.<%= projectName %>_user(uuid);

do
$grant$
begin
-- Grant <%= projectName %>_user permissions
perform <%= schemaName %>_private.grant_permissions('select', '<%= projectName %>_user', '<%= projectName %>_user');
perform <%= schemaName %>_private.grant_permissions('insert', '<%= projectName %>_user', '<%= projectName %>_user');
perform <%= schemaName %>_private.grant_permissions('update', '<%= projectName %>_user', '<%= projectName %>_user',
  ARRAY['first_name', 'last_name', 'email_address', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by']);

-- Grant <%= projectName %>_guest permissions
perform <%= schemaName %>_private.grant_permissions('select', '<%= projectName %>_user', '<%= projectName %>_guest');

end
$grant$;

-- Enable row-level security
alter table <%= schemaName %>.<%= projectName %>_user enable row level security;

do
$policy$
begin
-- <%= projectName %>_user RLS: can see all users, but can only modify its own record
perform <%= schemaName %>_private.upsert_policy('<%= projectName %>_user_select_<%= projectName %>_user', '<%= projectName %>_user', 'select', '<%= projectName %>_user', 'true');
perform <%= schemaName %>_private.upsert_policy('<%= projectName %>_user_insert_<%= projectName %>_user', '<%= projectName %>_user', 'insert', '<%= projectName %>_user', 'uuid=(select sub from <%= schemaName %>.session())');
perform <%= schemaName %>_private.upsert_policy('<%= projectName %>_user_update_<%= projectName %>_user', '<%= projectName %>_user', 'update', '<%= projectName %>_user', 'uuid=(select sub from <%= schemaName %>.session())');

-- <%= projectName %>_guest RLS: can only see its own record
-- perform <%= schemaName %>_private.upsert_policy('<%= projectName %>_guest_select_<%= projectName %>_user', '<%= projectName %>_user', 'select', '<%= projectName %>_guest', 'uuid=(select sub from <%= schemaName %>.session())');

end
$policy$;

comment on table <%= schemaName %>.<%= projectName %>_user is 'Table containing information about the application''s users ';
comment on column <%= schemaName %>.<%= projectName %>_user.id is 'Unique ID for the user';
comment on column <%= schemaName %>.<%= projectName %>_user.uuid is 'Universally Unique ID for the user, defined by the single sign-on provider';
comment on column <%= schemaName %>.<%= projectName %>_user.first_name is 'User''s first name';
comment on column <%= schemaName %>.<%= projectName %>_user.last_name is 'User''s last name';
comment on column <%= schemaName %>.<%= projectName %>_user.email_address is 'User''s email address';
comment on column <%= schemaName %>.<%= projectName %>_user.created_at is 'The date this record was inserted';
comment on column <%= schemaName %>.<%= projectName %>_user.created_by is 'The foreign key to the user id that created this record';
comment on column <%= schemaName %>.<%= projectName %>_user.updated_at is 'The date this record was last updated';
comment on column <%= schemaName %>.<%= projectName %>_user.updated_by is 'The foreign key to the user id that last updated this record';
comment on column <%= schemaName %>.<%= projectName %>_user.deleted_at is 'The date this record was deleted';
comment on column <%= schemaName %>.<%= projectName %>_user.deleted_by is 'The foreign key to the user id that deleted this record';

commit;
