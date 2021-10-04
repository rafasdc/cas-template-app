-- Verify <%- projectName %>:database_functions/verify_grants on pg

begin;

select pg_get_functiondef('<%- schemaName %>_private.verify_grant(text,text,text,text)'::regprocedure);
select pg_get_functiondef('<%- schemaName %>_private.verify_grant(text,text,text,text[],text)'::regprocedure);

rollback;
