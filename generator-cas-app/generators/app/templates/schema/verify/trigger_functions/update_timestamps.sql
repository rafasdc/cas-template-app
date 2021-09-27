-- Verify <%= projectName %>:function_update_timestamps on pg

begin;

select pg_get_functiondef('<%= schemaName %>_private.update_timestamps()'::regprocedure);

rollback;
