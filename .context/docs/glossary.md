---
type: doc
name: glossary
description: Project terminology, type definitions, domain entities, and business rules
category: glossary
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Glossário

| Termo | Significado |
| --- | --- |
| **Projeto** | Contêiner de alto nível que reúne quadros e participantes. |
| **Quadro (board)** | Área de trabalho de um projeto; pode ter preferências, membros e atividades. |
| **Lista** | Coluna ou agrupamento dentro de um quadro. |
| **Cartão** | Unidade de trabalho movida entre listas; pode ter descrição, prazo, membros, rótulos, tarefas e anexos. |
| **Formulário público** | Fluxo externo que cria ou encaminha solicitações sem exigir acesso ao quadro. |
| **Campo personalizado** | Atributo definido pelo usuário e associado a cartões por meio de grupos de campos. |
| **Membership** | Relação de permissão entre usuário e projeto ou quadro. |
| **Helper** | Módulo do servidor que centraliza uma operação de domínio reutilizável. |
| **Policy** | Regra Sails aplicada antes de um controlador para autenticação, escopo ou autorização. |
| **Fork Bolt** | Repositório `origin`, com customizações próprias sobre o Planka (`upstream`). |

Os modelos do servidor ficam em `server/api/models/`; os equivalentes normalizados do cliente ficam em `client/src/models/`.
