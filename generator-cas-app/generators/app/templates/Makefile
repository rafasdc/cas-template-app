SHELL := /usr/bin/env bash
PERL=perl
PERL_VERSION=${shell ${PERL} -e 'print substr($$^V, 1)'}
PERL_MIN_VERSION=5.10
PSQL=psql -h localhost
CPAN=cpan
CPANM=cpanm --notest
SQITCH=sqitch --chdir schema
SQITCH_VERSION=${word 3,${shell ${SQITCH} --version}}
SQITCH_MIN_VERSION=1.0.0
DB_NAME=<%= dbName %>

help: ## Show this help.
	@sed -ne '/@sed/!s/## //p' $(MAKEFILE_LIST)

.PHONY: install_asdf_tools
install_asdf_tools: ## install languages runtimes and tools specified in .tool-versions
install_asdf_tools:
	@cat .tool-versions | cut -f 1 -d ' ' | xargs -n 1 asdf plugin-add || true
	@asdf plugin-update --all
	@bash ~/.asdf/plugins/nodejs/bin/import-release-team-keyring
	@#MAKELEVEL=0 is required because of https://www.postgresql.org/message-id/1118.1538056039%40sss.pgh.pa.us
	@MAKELEVEL=0 POSTGRES_EXTRA_CONFIGURE_OPTIONS='--with-libxml' asdf install
	@asdf reshim
	@pip install -r requirements.txt
	@asdf reshim

.PHONY: install_pgtap
install_pgtap: ## install pgTAP extension into postgres
install_pgtap: start_pg
install_pgtap:
	@git clone https://github.com/theory/pgtap.git && \
		cd pgtap && \
		git checkout v1.1.0;
	@$(MAKE) -C pgtap
	@$(MAKE) -C pgtap install
	@$(MAKE) -C pgtap installcheck
	@rm -rf pgtap

.PHONY: install_cpanm
install_cpanm: ## install the cpanm tool
install_cpanm:
ifeq ($(shell which $(word 1,$(CPANM))),)
	# install cpanm
	@$(CPAN) App::cpanminus
endif

.PHONY: install_cpandeps
install_cpandeps: ## install Perl dependencies from cpanfile
install_cpandeps:
	$(CPANM) --installdeps .

.PHONY: postinstall_check
postinstall_check: ## check that the installation was successful and that the correct sqitch version is available in the PATH
postinstall_check:
	@printf '%s\n%s\n' "${SQITCH_MIN_VERSION}" "${SQITCH_VERSION}" | sort -CV ||\
 	(echo "FATAL: sqitch version should be at least ${SQITCH_MIN_VERSION}. Make sure the sqitch executable installed by cpanminus is available has the highest priority in the PATH" && exit 1);

.PHONY: install_perl_tools
install_perl_tools: ## install cpanm and sqitch
install_perl_tools: install_cpanm install_cpandeps postinstall_check

.PHONY: install_dev_tools
install_dev_tools: ## install development tools
install_dev_tools: stop_pg install_asdf_tools install_perl_tools install_pgtap

.PHONY: start_pg
start_pg: ## start the database server if it is not running
start_pg:
	@pg_ctl status || pg_ctl start

.PHONY: stop_pg
stop_pg: ## stop the database server. Always exits with 0
stop_pg:
	@pg_ctl stop; true

.PHONY: create_db
create_db: ## Ensure that the $(DB_NAME) database exists
create_db:
	@$(PSQL) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)'" | \
		grep -q 1 || \
		$(PSQL) -c "CREATE DATABASE $(DB_NAME)";

.PHONY: drop_db
drop_db: ## Drop the $(DB_NAME) database if it exists
drop_db:
	@$(PSQL) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)'" | \
		grep -q 0 || \
		$(PSQL) -c "DROP DATABASE $(DB_NAME)";

.PHONY: create_test_db
create_test_db: ## Ensure that the $(DB_NAME)_test database exists
create_test_db:
	@$(PSQL) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)_test'" | \
		grep -q 1 || \
		$(PSQL) -c "CREATE DATABASE $(DB_NAME)_test";

.PHONY: drop_test_db
drop_test_db: ## Drop the $(DB_NAME)_test database if it exists
drop_test_db:
	@$(PSQL) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)_test'" | \
		grep -q 0 || \
		$(PSQL) -c "DROP DATABASE $(DB_NAME)_test";

.PHONY: deploy_db_migrations
deploy_db_migrations: ## deploy the database migrations with sqitch
deploy_db_migrations: start_pg create_db
deploy_db_migrations:
	@$(SQITCH) deploy

.PHONY: revert_db_migrations
revert_db_migrations: ## revert the database migrations with sqitch
revert_db_migrations: start_pg
revert_db_migrations:
	@$(SQITCH) revert

.PHONY: verify_db_migrations
verify_db_migrations: ## verify the database migrations with sqitch
verify_db_migrations: start_pg
verify_db_migrations:
	@$(SQITCH) verify
