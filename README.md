# NewProducts

A static, browser-only proof of concept for managing jewelry product
development: master designs, costing tables, specifications and SKUs.

No backend. No build step. No frameworks. Just HTML, CSS and JavaScript.

## Run it

Open `index.html` in any modern browser, or serve the folder over any static
file server. It is also deployable as-is to GitHub Pages.

```sh
# Optional: serve locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Structure

```
index.html                      Dashboard linking to every module.
assets/styles.css               Shared dark theme.
assets/app.js                   Shared helpers + the CRUD page driver.
shared/sample-data.js           Seed data for first-time visitors.
shared/storage.js               Thin localStorage wrapper.
modules/master-designs/         Master Designs module (page + JS).
modules/stone-cost-tables/      Stone Cost Tables module.
modules/labour-cost-templates/  Labour Cost Templates module.
modules/product-development/    Product Development module.
modules/specifications/         Specifications module.
modules/products/               Products module.
```

## Documentation

- `PROJECT_SCOPE.md` - what this prototype is for.
- `DATA_MODEL.md` - fields and relationships per module.
- `AI_INSTRUCTIONS.md` - rules for any AI or human extending the repo.
- `TODO.md` - future improvements (parking lot only).

## Persistence

Data is stored in `localStorage` under keys prefixed with `newproducts:`.
Use the **Reset** button on any module page to restore that module's sample
data, or **Reset all sample data** on the dashboard to wipe everything.
