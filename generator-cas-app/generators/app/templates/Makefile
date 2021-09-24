SHELL := /usr/bin/env bash
PERL=perl
PERL_VERSION=${shell ${PERL} -e 'print substr($$^V, 1)'}
PERL_MIN_VERSION=5.10
CPAN=cpan
CPANM=cpanm --notest
SQITCH=sqitch
SQITCH_VERSION=${word 3,${shell ${SQITCH} --version}}
SQITCH_MIN_VERSION=1.0.0

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
install_pgtap: start_db
install_pgtap:
	@@git clone https://github.com/theory/pgtap.git && \
		cd pgtap && \
		git checkout v1.1.0;
	@@$(MAKE) -C pgtap
	@@$(MAKE) -C pgtap install
	@@$(MAKE) -C pgtap installcheck
	@@rm -rf pgtap

.PHONY: install_cpanm
install_cpanm: ## install the cpanm tool
install_cpanm:
ifeq ($(shell which $(word 1,$(CPANM))),)
	# install cpanm
	@@$(CPAN) App::cpanminus
endif

.PHONY: install_cpandeps
install_cpandeps: ## install Perl dependencies from schema/cpanfile
install_cpandeps:
	$(CPANM) --installdeps . --cpanfile schema/cpanfile

.PHONY: postinstall_check
postinstall_check: ## check that the installation was successful and that the correct sqitch version is available in the PATH
postinstall_check:
	@@printf '%s\n%s\n' "${SQITCH_MIN_VERSION}" "${SQITCH_VERSION}" | sort -CV ||\
 	(echo "FATAL: ${SQITCH} version should be at least ${SQITCH_MIN_VERSION}. Make sure the ${SQITCH} executable installed by cpanminus is available has the highest priority in the PATH" && exit 1);

.PHONY: install_perl_tools
install_perl_tools: ## install cpanm and sqitch
install_perl_tools: install_cpanm install_cpandeps postinstall_check

.PHONY: install_dev_tools
install_dev_tools: ## install development tools
install_dev_tools: stop_db install_asdf_tools install_perl_tools install_pgtap

.PHONY: start_db
start_db: ## start the database if it is not running
start_db:
	@@pg_ctl status || pg_ctl start

.PHONY: stop_db
stop_db: ## stop the database. Always exits with 0
stop_db:
	@@pg_ctl stop; true