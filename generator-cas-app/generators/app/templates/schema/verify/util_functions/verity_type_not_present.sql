-- Verify <%= projectName %>:database_functions/verify_type_not_present on pg

BEGIN;

select pg_get_functiondef('<%= schemaName %>_private.verify_type_not_present(text)'::regprocedure);

ROLLBACK;
