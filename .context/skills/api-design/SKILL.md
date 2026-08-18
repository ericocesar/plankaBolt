---
type: skill
name: Api Design
description: Design RESTful endpoints for the Taskbolt Sails API when adding or restructuring a server resource.
skillSlug: api-design
phases: [P, R]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# API design

1. Start from the domain model in `server/api/models/` and existing routes in `server/config/routes.js`.
2. Add a controller in `server/api/controllers/` only for transport concerns; place reusable domain behavior in `server/api/helpers/`.
3. Apply the existing policy and membership rules before loading or mutating project, board, list or card data.
4. Validate request values and return the repository's response format consistently.
5. Update `client/src/api/`, actions and sagas with the exact contract; do not make the client infer server state.
6. Cover success, validation and authorization with a server integration test.

Keep route names and payloads compatible with existing Planka-style endpoints. Treat a breaking endpoint change as a coordinated server-and-client migration, not an isolated controller edit.
