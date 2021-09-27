-- Verify <%= projectName %>:database_functions/verify_policy on pg

begin;

select pg_get_functiondef('<%= schemaName %>_private.verify_policy(text,text,text,text,text)'::regprocedure);

rollback;
