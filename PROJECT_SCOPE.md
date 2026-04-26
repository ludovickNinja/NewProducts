# Project Scope

## Purpose

NewProducts is a **proof of concept** for managing jewelry master designs,
specifications, costing tables, product development, and product SKUs in a
single, lightweight web app.

It exists to test the **shape of the data** and the **flow between modules**
before any decision is made about a real platform, database or framework.

## In scope

- Six modules, each with a list view and add / edit / delete:
  1. **Master Designs** - the source of truth for approved styles.
  2. **Stone Cost Tables** - reference costs by stone, shape, size, quality.
  3. **Labour Cost Templates** - factory + metal labour rate sets.
  4. **Product Development** - lifecycle tracking from idea to launch.
  5. **Specifications** - reusable rule-sets (metal, finish, sizing).
  6. **Products** - final SKUs linked to a master design.
- Shared sample data and a navigation sidebar/header.
- Persistence in the browser via `localStorage` so a user can experiment
  without losing their changes between sessions.
- A minimalist dark UI that works on desktop, iPad and phone.
- A single GitHub repository, deployable to GitHub Pages without any build.

## Out of scope (for now)

- Real cost calculation (only a placeholder `calculateProductCost` exists).
- A real database, sync, multi-user editing, or audit history.
- Authentication, roles, factory-level access control.
- Approval workflows, notifications, email.
- Excel / CSV import-export.
- Integrations with PLM, ERP, CAD, or accounting systems.
- Mobile apps, desktop apps, or native packaging.

See `TODO.md` for the running list of likely next steps.

## Success criteria for the prototype

- Anyone can clone the repo, open `index.html` in a browser, and explore the
  six modules immediately with sample data.
- Add / edit / delete in any module persists across page reloads.
- The data model and module relationships are clear enough to drive a
  conversation about the real product.
