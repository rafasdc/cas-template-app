begin;
select plan(2);

select has_schema('<%= schemaName %>_private');
select matches(obj_description('<%= schemaName %>_private'::regnamespace, 'pg_namespace'), '.+', 'Schema <%= schemaName %>_private has a description');

select finish();
rollback;
