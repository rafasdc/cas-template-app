-- Verify <%= projectName %>:util_functions/verify_function_not_present on pg

begin;

select pg_get_functiondef('<%= schemaName %>_private.verify_function_not_present(text)'::regprocedure);

rollback;
