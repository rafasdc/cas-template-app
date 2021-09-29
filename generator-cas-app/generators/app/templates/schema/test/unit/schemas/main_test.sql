begin;
select plan(2);

select has_schema('<%= schemaName %>');
select matches(obj_description('<%= schemaName %>'::regnamespace, 'pg_namespace'), '.+', 'Schema <%= schemaName %> has a description');

select finish();
rollback;
