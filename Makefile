# AcuPoints Local - development helpers
#
# Run `make help` to list every target.

COMPOSE    ?= docker compose
NPM        ?= npm
PORT       ?= 3000
HEALTH_URL ?= http://localhost:$(PORT)/health
CONTENT    := content/acupoints

.DEFAULT_GOAL := help
.PHONY: help install dev start build up down restart logs ps shell health verify clean

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# --- Local (Node) ---

install: ## Install Node dependencies
	$(NPM) ci || $(NPM) install

dev: ## Run the server with nodemon (reload on change)
	$(NPM) run dev

start: ## Run the server in the foreground
	$(NPM) start

# --- Docker ---

up: ## Build and start the whole stack in the background
	$(COMPOSE) up -d --build

down: ## Stop the stack (volumes are kept)
	$(COMPOSE) down

restart: ## Restart the stack
	$(COMPOSE) restart

build: ## Rebuild the Docker images
	$(COMPOSE) build

logs: ## Follow the container logs
	$(COMPOSE) logs -f

ps: ## Show the status of every service
	$(COMPOSE) ps

shell: ## Open a shell inside the app container
	$(COMPOSE) exec app sh

# --- Checks ---

health: ## Query the API health endpoint
	@curl -fsS $(HEALTH_URL) && echo

verify: ## Check the acupoint content for missing translations
	@echo "Acupoint files: $$(ls $(CONTENT)/*.md | wc -l)"
	@if grep -rl 'See translation\|Translation to be added\|See original page' $(CONTENT)/ 2>/dev/null; then \
		echo "FAIL: untranslated placeholders found"; exit 1; \
	else \
		echo "OK: no untranslated placeholders"; \
	fi

clean: ## Remove node_modules and stop the stack
	$(COMPOSE) down --remove-orphans
	rm -rf node_modules