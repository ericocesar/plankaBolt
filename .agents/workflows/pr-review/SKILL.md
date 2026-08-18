---
name: pr-review
description: Review Taskbolt pull requests against the React/Sails contract, test suite, and fork maintenance constraints.
---

# Revisão de pull request

Leia o objetivo e compare-o com o diff inteiro, incluindo migrações, configuração e arquivos gerados.

- Confirme que mudanças de API atualizam cliente e testes na mesma revisão.
- Verifique autorização no servidor e nenhum segredo em arquivos, logs ou documentação.
- Valide alterações em `docker-compose*.yml`, Helm ou env vars para não quebrar implantação existente.
- Execute ou confirme `npm run lint` e os testes relevantes.
- Cheque se uma mudança copiada do upstream preserva as customizações Bolt e se a versão declarada continua correta.

Registre achados com caminho, comportamento e impacto. Diferencie bloqueadores de sugestões para que a correção seja objetiva.
