-- Verify <%- projectName %>:database_functions/grant_permissions on pg

begin;

select pg_get_functiondef('<%- schemaName %>_private.grant_permissions(text,text,text,text)'::regprocedure);
select pg_get_functiondef('<%- schemaName %>_private.grant_permissions(text,text,text,text[],text)'::regprocedure);

rollback;
