-- Deploy <%= projectName %>:create_roles to pg

begin;

-- The create roles affects the database globally. Cannot drop the roles once created.
do
$do$
begin
  <% roles.split(',').forEach(function(role) { %>
  if not exists (
    select true
    from   pg_catalog.pg_roles
    where  rolname = '<%= role %>') then

    create role <%= role %>;
  end if;
  <% }); %>

end
$do$;

commit;
