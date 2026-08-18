---
name: documentation
description: Update Taskbolt technical documentation when code, API, configuration, tests, or deployment behavior changes.
---

# Documentação técnica

Documente apenas comportamento confirmado em código e configuração. Atualize `.context/docs/` quando uma alteração afetar arquitetura, fluxo de dados, comandos, testes, segurança ou operação.

- Referencie arquivos e scripts reais, como `client/vite.config.js`, `server/config/routes.js` e `docker-compose-dev.yml`.
- Descreva a porta pública 3000 e a API 1337 somente no contexto de desenvolvimento configurado.
- Documente novas variáveis de ambiente sem registrar valores secretos.
- Registre decisões que alterem a estratégia de atualização do fork em relação ao Planka upstream.

Mantenha o texto conciso, com exemplos executáveis e links para documentos relacionados. Não alegue cobertura de teste, compatibilidade ou requisitos operacionais que não tenham sido verificados.
