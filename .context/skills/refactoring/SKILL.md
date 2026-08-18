---
type: skill
name: Refactoring
description: Refactor Taskbolt safely while preserving the public API, authorization rules, and observable UI behavior.
skillSlug: refactoring
phases: [P, E, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Refatoração segura

Defina o comportamento que deve permanecer e proteja-o com os testes existentes ou um teste de caracterização. Refatore em commits pequenos e reversíveis.

Mantenha controllers focados em transporte e helpers no domínio; no cliente, mantenha efeitos em sagas e acesso ao estado em selectors. Não altere payloads, nomes de rota ou esquema de banco como efeito colateral de limpeza interna.

Depois de cada etapa, rode lint e os testes do pacote afetado. Prefira mudanças que diminuam o delta contra o upstream quando a estrutura resultante continuar clara para as customizações Bolt.
