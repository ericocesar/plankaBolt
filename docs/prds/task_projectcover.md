# Project cover task – next steps

1. Identify all references to the “Sobre o aplicativo” modal/menu (e.g., `client/src/components/common/AboutModal`, navigation config, associated routes/policies) and remove them so the menu is gone.
2. Extend the project settings screen (likely under `client/src/components/projects/ProjectSettings.jsx` or a similar component) with a cover-image upload field, reusing the existing upload helpers from the file manager hook to keep the experience consistent.
3. Adjust the dashboard project list view (`client/src/components/dashboard/ProjectsList.jsx` or equivalent) so each project card can show the new cover image, defaulting to the current background when no image is provided.
4. On the server, add a `coverImage` attribute to the `Project` model (or equivalent), include it in any necessary migrations/validations, and reuse the existing upload logic/capabilities (S3 hook) so files are stored safely.
5. Update the APIs consumed by the project settings form to accept and persist the cover-image payload, exposing the saved URL in the response so the frontend dashboard can render it.
6. Clean up any routes/policies/navigation entries tied to the removed modal so nothing still points to the deleted pages.
