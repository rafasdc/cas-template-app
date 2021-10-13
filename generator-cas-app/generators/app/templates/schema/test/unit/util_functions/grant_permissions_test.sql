begin;
select plan(11);

-- Test setup
create table <%- schemaName %>.test_table
(
  id integer primary key generated always as identity
);

create table <%- schemaName %>.test_table_specific_column_grants
(
  id integer primary key generated always as identity,
  allowed text,
  denied text
);

select has_function(
  '<%- schemaName %>_private', 'grant_permissions',
  'Function grant_permissions should exist'
);

select throws_ok(
  $$
    select <%- schemaName %>_private.grant_permissions('badoperation', 'test_table', '<%- adminRole %>');
  $$,
  'P0001',
  'invalid operation variable. Must be one of [select, insert, update, delete]',
  'Function grant_permissions throws an exception if the operation variable is not in (select, insert, update, delete)'
);

select table_privs_are (
  '<%- schemaName %>',
  'test_table',
  '<%- adminRole %>',
  ARRAY[]::text[],
  'role <%- adminRole %> has not yet been granted any privileges on <%- schemaName %>.test_table'
);

select lives_ok(
  $$
    select <%- schemaName %>_private.grant_permissions('select', 'test_table', '<%- adminRole %>');
  $$,
  'Function grants select'
);

select lives_ok(
  $$
    select <%- schemaName %>_private.grant_permissions('insert', 'test_table', '<%- adminRole %>');
  $$,
  'Function grants insert'
);

select lives_ok(
  $$
    select <%- schemaName %>_private.grant_permissions('update', 'test_table', '<%- adminRole %>');
  $$,
  'Function grants update'
);

select lives_ok(
  $$
    select <%- schemaName %>_private.grant_permissions('delete', 'test_table', '<%- adminRole %>');
  $$,
  'Function grants delete'
);

select table_privs_are (
  '<%- schemaName %>',
  'test_table',
  '<%- adminRole %>',
  ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'role <%- adminRole %> has been granted select, insert, update, delete on <%- schemaName %>.test_table'
);

select any_column_privs_are (
  '<%- schemaName %>',
  'test_table_specific_column_grants',
  '<%- adminRole %>',
  ARRAY[]::text[],
  'role <%- adminRole %> has not yet been granted any privileges on columns in <%- schemaName %>.test_table_specific_column_grants'
);

select lives_ok(
  $$
    select <%- schemaName %>_private.grant_permissions('select', 'test_table_specific_column_grants', '<%- adminRole %>', ARRAY['allowed']);
  $$,
  'Function grants select when specific columns are specified'
);

select column_privs_are (
  '<%- schemaName %>',
  'test_table_specific_column_grants',
  'allowed',
  '<%- adminRole %>',
  ARRAY['SELECT'],
  '<%- adminRole %> has privilege SELECT only on column `allowed` in test_table_specific_column_grants'
);

select finish();
rollback;
