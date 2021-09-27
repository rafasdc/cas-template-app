-- Verify <%= projectName %>:create_roles on pg

begin;

do
$verify$
begin

<% roles.split(',').forEach(function(role, index) { %>
  <% if (index == 0) { %>if<% } else { %>elsif<% } %>(select not exists(select true from pg_roles where rolname='<%= role %>')) then
    raise exception 'role <%= role %> does not exist.';
<% }); %>
  end if;

end
$verify$;

rollback;
