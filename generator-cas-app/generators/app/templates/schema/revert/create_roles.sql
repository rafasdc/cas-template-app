-- Revert <%= projectName %>:create_roles from pg

begin;

raise NOTICE 'Created roles may be used in other projects, and need to be manually deleted if needed';
select true;

commit;
