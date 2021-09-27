-- Revert <%= projectName %>:trigger_functions/set_user_id from pg

begin;

drop function <%= schemaName %>_private.set_user_id;

commit;
