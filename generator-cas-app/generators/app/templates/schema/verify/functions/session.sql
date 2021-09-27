-- Verify <%= projectName %>:functions/session on pg

begin;

select pg_get_functiondef('<%= schemaName %>.session()'::regprocedure);

rollback;
