begin;

select plan(1);

insert into <%= schemaName %>.<%= userTable %>
  (first_name, last_name, email_address, uuid) values
  ('foo1', 'bar', 'foo1@bar.com', '11111111-1111-1111-1111-111111111112'),
  ('foo2', 'bar', 'foo2@bar.com', '11111111-1111-1111-1111-111111111113'),
  ('foo3', 'bar', 'foo3@bar.com', '11111111-1111-1111-1111-111111111114');

create table <%- schemaName %>.some_table (
  id int primary key generated always as identity,
  user_id int references <%= schemaName %>.<%= userTable %>(id),
  some_column varchar(1000)
);

create trigger _set_user_id
  before update on <%= schemaName %>.some_table
  for each row execute procedure <%= schemaName %>_private.set_user_id();

set jwt.claims.sub to '11111111-1111-1111-1111-111111111112';

insert into <%= schemaName %>.some_table (some_column) values ('foo');

select is(
  (select user_id from <%= schemaName %>.some_table where id = 1),
  (select id from <%= schemaName %>.<%= userTable %> where uuid = '11111111-1111-1111-1111-111111111112')
);

select finish();

rollback;
