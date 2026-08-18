---
type: skill
name: Feature Breakdown
description: Break a Taskbolt feature into independently verifiable client, server, data, and release tasks.
skillSlug: feature-breakdown
phases: [P]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Decomposição de funcionalidades

Comece pelo resultado do usuário e pelos domínios existentes — projetos, quadros, listas, cartões, formulários ou campos personalizados. Divida o trabalho em:

1. Modelo, associação e migração PostgreSQL, se houver dado persistido.
2. Policy, helper, controlador e contrato de API.
3. Modelo Redux-ORM, action, saga, seletor e chamada de API.
4. Componentes, estados de carregamento/erro e sincronização por socket.
5. Testes de servidor, cliente e aceitação proporcionais ao risco.
6. Configuração, documentação e estratégia de rollout, quando aplicável.

Identifique dependências entre as etapas e deixe decisões de compatibilidade com o upstream explícitas. Não crie um plano que presuma acesso de administrador para fluxos comuns.
