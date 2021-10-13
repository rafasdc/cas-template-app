-- Deploy mocks:schemas/main to pg

begin;

create schema mocks;
grant usage on schema mocks to <%- roles.join(", ") %>;

comment on schema mocks is 'A schema for mock functions that can be used for either tests or dev/test environments';

commit;
