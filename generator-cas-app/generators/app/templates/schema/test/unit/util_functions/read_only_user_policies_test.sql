begin;

select plan(5);

select has_function('<%- schemaName %>_private', 'read_only_user_policies', 'function <%- schemaName %>_private.read_only_user_policies exists');
create role test_role;

select <%- schemaName %>_private.read_only_user_policies('test_role');

select is(
  (select <%- schemaName %>_private.verify_policy('select', 'test_role_select_<%- userTable %>', '<%- userTable %>', 'test_role')),
  true,
  'test_role_select_<%- userTable %> policy is created'
);

select throws_like(
  $$select <%- schemaName %>_private.verify_policy('insert', 'test_role_insert_<%- userTable %>', '<%- userTable %>', 'test_role')$$,
  'Policy % does not exist',
  'test_role_insert_<%- userTable %> policy is not created'
);

select throws_like(
  $$select <%- schemaName %>_private.verify_policy('update', 'test_role_update_<%- userTable %>', '<%- userTable %>', 'test_role')$$,
  'Policy % does not exist',
  'test_role_update_<%- userTable %> policy is not created'
);

select throws_like(
  $$select <%- schemaName %>_private.verify_policy('delete', 'test_delete_select_<%- userTable %>', '<%- userTable %>', 'test_role')$$,
  'Policy % does not exist',
  'test_role_delete_<%- userTable %> policy is not created'
);

rollback;
