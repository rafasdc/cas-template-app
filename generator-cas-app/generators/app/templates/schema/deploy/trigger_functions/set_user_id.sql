-- Deploy <%- projectName %>:trigger_functions/set_user_id to pg
-- requires: functions/session
-- requires: table/<%- userTable %>

begin;
create or replace function <%- schemaName %>_private.set_user_id()
  returns trigger as $$

declare
  user_sub uuid;
begin
  user_sub := (select sub from <%- schemaName %>.session());
  new.user_id := (select id from <%- schemaName %>.<%- userTable %> as u where u.uuid = user_sub);
  return new;
end;
$$ language plpgsql volatile;

grant execute on function <%- schemaName %>_private.set_user_id to <%- authenticatedRoles %>;

comment on function <%- schemaName %>_private.set_user_id()
  is $$
  a trigger to set a user_id foreign key column.
  example usage:

  create table some_schema.some_table (
    user_id int references <%- schemaName %>.<%- userTable %>(id)
    ...
  );
  create trigger _set_user_id
    before update of some_column on some_schema.some_table
    for each row
    execute procedure <%- schemaName %>_private.set_user_id();
  $$;

commit;
