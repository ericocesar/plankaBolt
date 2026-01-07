# Public Support Forms with Admin Configuration Implementation Plan

This plan outlines the implementation of a configurable public support form system in Planka, allowing administrators to define how tickets are created and routed.

## 1. Backend Implementation (Sails.js)

### 1.1 Database Model (`server/api/models/Form.js`)
Create a new model to store form configurations:
-   `name`: string (Form name)
-   `projectId`: string (Target Project)
-   `boardId`: string (Target Board)
-   `listId`: string (Target List/Column)
-   `assigneeIds`: json (Array of User IDs to assign)
-   `categoryMapping`: json (Map of "Category Name" -> "Label ID")
-   `isActive`: boolean

### 1.2 Controllers
-   **Admin CRUD**: Create `server/api/controllers/forms/` (`create.js`, `update.js`, `delete.js`, `index.js`, `show.js`) to manage form configurations.
-   **Public Submission**: Create `server/api/controllers/public-tickets/create.js`.
    -   **Logic**:
        1.  Find `Form` by ID (provided in URL or body).
        2.  Validate public input (Name, Email, Category, etc.).
        3.  Create Card in `form.listId`.
        4.  **Field Mapping**: Format description with "Name: ... \n Email: ...".
        5.  **Tagging**: Look up Label ID from `form.categoryMapping[category]` and add to Card.
        6.  **Assignment**: Add `form.assigneeIds` to Card Memberships.
        7.  **Due Date**: Set to `now + 1 day`.
        8.  **Attachments**: Process uploads and link to Card.
        9.  **Email**: Send confirmation.

### 1.3 Routes & Policies
-   Admin Routes: `GET/POST/PATCH/DELETE /api/forms` (Restricted to Admins).
-   Public Route: `POST /api/public/tickets/:formId` (Public access).

## 2. Frontend Implementation (React)

### 2.1 Administration UI
-   **Modal Update**: Add "Forms" tab to `AdministrationModal.jsx`.
-   **Forms Pane**: Create `client/src/components/common/AdministrationModal/FormsPane.jsx`.
    -   List existing forms.
    -   **Form Editor**:
        -   Name input.
        -   Project/Board/List Selectors (Cascading).
        -   Member Selector (Multi-select for auto-assignment).
        -   **Category Mapping**: Display fixed categories (Erro, Dúvida, Financeiro, Solicitação) with a Label Selector (fetched from selected Board) for each.

### 2.2 Public Support Page
-   **Route**: `/support/:formId`.
-   **Component**: `client/src/components/Support/Support.jsx`.
    -   Fetch Form details (if needed, e.g., to verify existence or get custom title).
    -   Render fields: Name, Email, Phone, Company, Product, Category, Priority, Subject, Description, Files, Consent.
    -   Submit to `/api/public/tickets/:formId`.

## 3. Verification & Testing
1.  Create a Form in Admin Panel -> Forms.
    -   Select a Project, Board, List.
    -   Map "Erro" to a "Bug" label.
    -   Select an assignee.
2.  Open `/support/<form_id>`.
3.  Submit a ticket with category "Erro" and an attachment.
4.  Verify:
    -   Card created in correct list.
    -   "Bug" label applied.
    -   Member assigned.
    -   Due date is tomorrow.
    -   Description contains Name/Email/Phone.
    -   Attachment is present.
