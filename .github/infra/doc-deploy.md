# Deploy
./scripts/deployportainer.sh {AMBIENTE}

# Exempos
./scripts/deployportainer.sh prod
./scripts/deployportainer.sh dev

A tag mais recente gerada pelo build é lida automaticamente de
`docs/historico/latest-tag`.

pnpm deploy:stack dev
pnpm deploy:stack prod
