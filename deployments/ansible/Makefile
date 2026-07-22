SHELL := /bin/bash
ANSIBLE_CONFIG := $(CURDIR)/ansible.cfg
export ANSIBLE_CONFIG

.PHONY: install prepare preflight deploy ping check provision database site verify
install:
	./scripts/install-ansible-system.sh

prepare:
	./scripts/prepare-production-inventory.sh

preflight:
	./scripts/preflight-local.sh

deploy:
	./scripts/run-production-local.sh

ping:
	ansible lsevin_production -m ping

check:
	ansible-playbook --check --diff playbooks/site.yml

provision:
	ansible-playbook playbooks/provision.yml

database:
	ansible-playbook playbooks/database.yml

site:
	ansible-playbook playbooks/site.yml

verify:
	ansible-playbook playbooks/verify.yml
