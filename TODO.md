# TODO / Future improvements

This is a static prototype. The following are likely follow-ups, in rough
order of how often they come up in conversation. Nothing here is committed
to the prototype itself - keep this file as a parking lot.

## Data and persistence
- Move from `localStorage` to a real database (Postgres, SQLite, Firestore).
- Add a backend API; remove direct storage access from module pages.
- Audit log: who changed what, when.
- Soft delete + restore.

## Users and permissions
- User accounts and login.
- Roles: designer, costing, factory liaison, admin.
- Factory access control - some factories see only their own work.

## Workflows
- Approval workflows for Master Designs and Product Development stages.
- Notifications when a project moves to the next status.
- Stage-gated fields (e.g. lock pricing once `Approved`).

## Costing
- Real cost calculation formulas combining:
  - metal weight x current metal rate,
  - stone counts x stone cost table,
  - labour template totals.
- Currency conversion with effective dates.
- Margin / wholesale / retail tiers.
- Versioned cost history per SKU.

## Import / export
- Import master designs and products from Excel / CSV.
- Export current state as Excel / CSV / JSON.
- Bulk edit.

## Rules engine
- Validate that a Product's metal / karat / quality matches the linked
  Specification.
- Validate that a Product's factory is in the Master Design's
  `approvedFactories`.
- Block save when validations fail.

## UX
- Detail pages per record with linked records inline.
- Image attachments per Master Design and Product.
- Saved filters and column selection.
- Keyboard shortcuts for power users.

## Engineering
- Unit tests for the storage layer and validation.
- Versioned data migrations.
- Internationalization.
