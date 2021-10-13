begin;
select plan(<%- 18 + nonAdminRoles.length * 6 + 4%>);

select has_table('<%- schemaName %>', '<%- userTable %>', 'table <%- schemaName %>.<%- userTable %> exists');
select has_column('<%- schemaName %>', '<%- userTable %>', 'id', 'table <%- schemaName %>.<%- userTable %> has id column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'first_name', 'table <%- schemaName %>.<%- userTable %> has first_name column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'last_name', 'table <%- schemaName %>.<%- userTable %> has last_name column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'email_address', 'table <%- schemaName %>.<%- userTable %> has email_address column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'uuid', 'table <%- schemaName %>.<%- userTable %> has uuid column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'created_at', 'table <%- schemaName %>.<%- userTable %> has created_at column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'updated_at', 'table <%- schemaName %>.<%- userTable %> has updated_at column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'deleted_at', 'table <%- schemaName %>.<%- userTable %> has deleted_at column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'created_by', 'table <%- schemaName %>.<%- userTable %> has created_by column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'updated_by', 'table <%- schemaName %>.<%- userTable %> has updated_by column');
select has_column('<%- schemaName %>', '<%- userTable %>', 'deleted_by', 'table <%- schemaName %>.<%- userTable %> has deleted_by column');


insert into <%- schemaName %>.<%- userTable %>
  (first_name, last_name, email_address, uuid) values
  ('foo1', 'bar', 'foo1@bar.com', '11111111-1111-1111-1111-111111111112'),
  ('foo2', 'bar', 'foo2@bar.com', '11111111-1111-1111-1111-111111111113'),
  ('foo3', 'bar', 'foo3@bar.com', '11111111-1111-1111-1111-111111111114');

-- Row level security tests --

-- Test setup
set jwt.claims.sub to '11111111-1111-1111-1111-111111111111';

-- <%- adminRole %>
set role <%- adminRole %>;
select concat('current user is: ', (select current_user));

select lives_ok(
  $$
    select * from <%- schemaName %>.<%- userTable %>
  $$,
    '<%- adminRole %> can view all data in <%- userTable %> table'
);

select lives_ok(
  $$
    insert into <%- schemaName %>.<%- userTable %> (uuid, first_name, last_name) values ('11111111-1111-1111-1111-111111111111'::uuid, 'test', 'testerson');
  $$,
    '<%- adminRole %> can insert data in <%- userTable %> table'
);

select lives_ok(
  $$
    update <%- schemaName %>.<%- userTable %> set first_name = 'changed by admin' where uuid='11111111-1111-1111-1111-111111111111'::uuid;
  $$,
    '<%- adminRole %> can change data in <%- userTable %> table'
);

select results_eq(
  $$
    select count(uuid) from <%- schemaName %>.<%- userTable %> where first_name = 'changed by admin'
  $$,
    ARRAY[1::bigint],
    'Data was changed by <%- adminRole %>'
);

select throws_like(
  $$
    update <%- schemaName %>.<%- userTable %> set uuid = 'ca716545-a8d3-4034-819c-5e45b0e775c9' where uuid = '11111111-1111-1111-1111-111111111111'::uuid;
  $$,
    'permission denied%',
    '<%- adminRole %> can not change data in the uuid column in <%- userTable %> table'
);

select throws_like(
  $$
    delete from <%- schemaName %>.<%- userTable %> where id=1
  $$,
  'permission denied%',
    'Administrator cannot delete rows from table <%- userTable %>'
);

<% nonAdminRoles.forEach(function(role) { %>
-- <%- role %>
set role <%- role %>;
select concat('current user is: ', (select current_user));

select results_eq(
  $$
    select count(*) from <%- schemaName %>.<%- userTable %>
  $$,
  ARRAY['4'::bigint],
    '<%- role %> can view all data from <%- userTable %>'
);

select lives_ok(
  $$
    update <%- schemaName %>.<%- userTable %> set first_name = 'doood' where uuid=(select sub from <%- schemaName %>.session())
  $$,
    '<%- role %> can update data if their uuid matches the uuid of the row'
);

select results_eq(
  $$
    select first_name from <%- schemaName %>.<%- userTable %> where uuid=(select sub from <%- schemaName %>.session())
  $$,
  ARRAY['doood'::varchar(1000)],
    'Data was changed by <%- role %>'
);

select throws_like(
  $$
    update <%- schemaName %>.<%- userTable %> set uuid = 'ca716545-a8d3-4034-819c-5e45b0e775c9' where uuid!=(select sub from <%- schemaName %>.session())
  $$,
  'permission denied%',
    '<%- role %> cannot update their uuid'
);

select throws_like(
  $$
    delete from <%- schemaName %>.<%- userTable %> where id=1
  $$,
  'permission denied%',
    '<%- role %> cannot delete rows from table_<%- userTable %>'
);

-- Try to update user data where uuid does not match
update <%- schemaName %>.<%- userTable %> set first_name = 'buddy' where uuid!=(select sub from <%- schemaName %>.session());

select is_empty(
  $$
    select * from <%- schemaName %>.<%- userTable %> where first_name='buddy'
  $$,
    '<%- role %> cannot update data if their uuid does not match the uuid of the row'
);
<% }); %>

-- <%- guestRole %>
set role <%- guestRole %>;
select concat('current user is: ', (select current_user));

select results_eq(
  $$
    select uuid from <%- schemaName %>.<%- userTable %>
  $$,
  ARRAY['11111111-1111-1111-1111-111111111111'::uuid],
    '<%- guestRole %> can only select their own user'
);

select throws_like(
  $$
    update <%- schemaName %>.<%- userTable %> set uuid = 'ca716545-a8d3-4034-819c-5e45b0e775c9' where uuid!=(select sub from <%- schemaName %>.session())
  $$,
  'permission denied%',
    '<%- guestRole %> cannot update their uuid'
);

select throws_like(
  $$
    insert into <%- schemaName %>.<%- userTable %> (uuid, first_name, last_name) values ('21111111-1111-1111-1111-111111111111'::uuid, 'test', 'testerson');
  $$,
  'permission denied%',
  '<%- guestRole %> cannot insert'
);

select throws_like(
  $$
    delete from <%- schemaName %>.<%- userTable %> where id=1
  $$,
  'permission denied%',
    '<%- guestRole %> cannot delete rows from table_<%- userTable %>'
);

select finish();
rollback;
