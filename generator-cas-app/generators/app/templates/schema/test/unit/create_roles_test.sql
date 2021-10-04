begin;
select plan(<%- roles.length * 2 %>);

<% roles.forEach(function(role) { %>
select has_role( '<%- role %>', 'role <%- role %> exists' );
select isnt_superuser(
    '<%- role %>',
    '<%- role %> should not be a super user'
);
<% }); %>

select finish();
rollback;
