begin;
select plan(2);

select has_table(
  '<%- schemaName %>_private', 'connect_session',
  '<%- schemaName %>_private.connect_session should exist, and be a table'
);

select has_index(
  '<%- schemaName %>_private',
  'connect_session',
  '<%- schemaName %>_private_idx_session_expire',
  'connect session has index: <%- schemaName %>_private_idx_session_expire' );

select finish();
rollback;
