---
type: skill
name: Code Review
description: Review Taskbolt changes for behavior, authorization, data integrity, and maintainability before integration.
skillSlug: code-review
phases: [R, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Revisão de código

Revise o diff pelo fluxo completo: componente → action/saga → API → controller/policy/helper/model → resposta e estado do cliente.

- Confirme autorização no servidor, especialmente para projetos, quadros, cartões e arquivos.
- Exija migração para toda alteração de esquema persistido e avalie a compatibilidade de dados existentes.
- Verifique que as sagas e Redux-ORM tratam o payload realmente retornado pelo servidor.
- Procure validação de entrada, tratamento de erro e vazamento de segredo ou caminho de arquivo.
- Rode ou peça lint e os testes relevantes do cliente e servidor.

Priorize bugs funcionais, regressões de segurança, perda de dados e conflitos com a base upstream; deixe nitpicks de estilo para depois da correção do risco.
