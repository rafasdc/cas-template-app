-- Revert <%- projectName %>:trigger_functions/update_timestamps from pg

begin;

drop function <%- schemaName %>_private.update_timestamps();

commit;
