-- Revert <%- projectName %>:util_functions/upsert_timestamp_columns from pg

begin;

drop function <%- schemaName %>_private.upsert_timestamp_columns(text,text,boolean,boolean,boolean,text,text);

commit;
