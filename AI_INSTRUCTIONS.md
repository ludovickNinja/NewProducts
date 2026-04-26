# AI Instructions

This file is for any AI assistant (or human developer) touching this
repository. Read it before making changes.

## What this repo is

A **static, browser-only proof of concept** for a jewelry product development
management tool. There is no backend, no build step, no package manager and
no framework. The site is served as plain files, including from GitHub Pages.

## Hard rules

1. **Static only.** Plain HTML, CSS and JavaScript. Do **not** introduce
   React, Vue, Svelte, Tailwind, npm, Vite, Webpack, or any build tool.
2. **No backend.** Persistence is `localStorage` in the browser. Do **not**
   add a database, a server, an API, or authentication.
3. **No external dependencies.** No CDNs, no fonts, no icon libraries. Only
   files inside this repository.
4. **Keep it modular.** Each module lives in its own folder under
   `/modules/<module-name>/` with its own `index.html` and JS file. Shared
   code lives in `/assets/` and `/shared/`.
5. **Do not restructure folders without being asked.** Existing paths are
   referenced from many places.
6. **Preserve the data model unless explicitly asked to change it.** Field
   names, IDs and module relationships are documented in `DATA_MODEL.md`.
7. **One repository.** Do not split modules into separate repos.
8. **Stay scoped.** Do not invent new modules, costing logic, or workflows
   that are not in the brief. The placeholder cost helper
   (`App.calculateProductCost`) is intentional.

## How a module is wired

A module page is the smallest unit. It contains:

- `modules/<name>/index.html` - markup with `#topbar`, `#list-body`,
  `#search`, `#add-btn`, `#reset-btn`, and a `<dialog id="form-dialog">`
  containing a `<form id="form">` with a `.form-grid` element.
- `modules/<name>/<name>.js` - calls `App.renderNav(...)`, `App.renderFooter()`
  and `App.crudPage(config)` with the schema for that module.

`App.crudPage(config)` (in `assets/app.js`) drives search, filters, add, edit,
delete and the modal form. To add a column, field or filter, edit only the
module's JS file.

## When extending

- Need a new field? Add it to the module's `fields` config and (if it should
  show in the table) the `columns` config. Update sample data and
  `DATA_MODEL.md`.
- Need a new filter? Add it to the module's `filters` config as
  `{ key, label }`. The dropdown options are auto-derived from the live data
  for that field, so no extra wiring is needed.
- Need a new module? Copy an existing module folder, register it in
  `App.MODULES` (in `assets/app.js`), seed it in `shared/sample-data.js`,
  and add a card on the dashboard.
- Need cross-module references? Use ID dropdowns. See
  `modules/products/products.js` and `modules/product-development/product-development.js`.

## When in doubt

Prefer the smallest possible change. This is a prototype.
