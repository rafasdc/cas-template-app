begin;

select plan(2);

insert into <%- schemaName %>.<%- userTable %>
  (first_name, last_name, email_address, uuid) values
  ('foo1', 'bar', 'foo1@bar.com', '11111111-1111-1111-1111-111111111112'),
  ('foo2', 'bar', 'foo2@bar.com', '11111111-1111-1111-1111-111111111113'),
  ('foo3', 'bar', 'foo3@bar.com', '11111111-1111-1111-1111-111111111114');

create table <%- schemaName %>.some_table (
  id int primary key,
  user_id int references <%- schemaName %>.<%- userTable %>(id),
  some_column varchar(1000)
);

create trigger _set_user_id
  before insert or update on <%- schemaName %>.some_table
  for each row execute procedure <%- schemaName %>_private.set_user_id();

set jwt.claims.sub to '11111111-1111-1111-1111-111111111112';

insert into <%- schemaName %>.some_table (id, some_column) values (1, 'foo');

select is(
  (select user_id from <%- schemaName %>.some_table where id = 1),
  (select id from <%- schemaName %>.<%- userTable %> where uuid = '11111111-1111-1111-1111-111111111112'),
  'The set_user_id trigger sets the user id on insert'
);

-- attemp to update the user_id to a different user
update <%- schemaName %>.some_table set user_id = (select id from <%- schemaName %>.<%- userTable %> where uuid = '11111111-1111-1111-1111-111111111113');

select is(
  (select user_id from <%- schemaName %>.some_table where id = 1),
  (select id from <%- schemaName %>.<%- userTable %> where uuid = '11111111-1111-1111-1111-111111111112'),
  'The set_user_id trigger sets the user id on update'
);

select finish();

rollback;
