-- Verify <%- projectName %>:function_set_user_id on pg

begin;

select pg_get_functiondef('<%- schemaName %>_private.set_user_id()'::regprocedure);

rollback;
