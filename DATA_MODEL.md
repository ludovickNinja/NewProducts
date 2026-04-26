# Data Model

All data is held client-side in `localStorage`, one key per module. Sample
data lives in `shared/sample-data.js`. Records are plain JSON objects with
the fields below.

## Modules

### 1. Master Designs (`masterDesigns`)

The library of approved jewelry designs.

| Field                    | Type   | Notes                                    |
| ------------------------ | ------ | ---------------------------------------- |
| `masterId`               | string | **Primary key**, e.g. `MD-1001`.         |
| `styleCode`              | string | Internal style code.                     |
| `designName`             | string | Human-readable name.                     |
| `collection`             | string | Free text.                               |
| `category`               | string | Ring, Earring, Pendant, etc.             |
| `centerStoneShape`       | string |                                          |
| `centerStoneSize`        | string | e.g. `1.00ct`.                           |
| `sideStoneConfiguration` | string |                                          |
| `approvedFactories`      | string | Comma-separated factory names.           |
| `allowedMetals`          | string | Comma-separated metal types.             |
| `status`                 | string | `Draft` \| `Approved` \| `Retired`.      |
| `notes`                  | string | Free text.                               |

### 2. Stone Cost Tables (`stoneCostTables`)

Reference costs for diamonds and gemstones.

| Field           | Type   | Notes                                |
| --------------- | ------ | ------------------------------------ |
| `id`            | string | **Primary key**, e.g. `SC-001`.      |
| `stoneType`     | string | Diamond, Sapphire, Ruby...           |
| `shape`         | string | Round, Cushion, Oval...              |
| `size`          | string | e.g. `1.00ct`.                       |
| `quality`       | string | e.g. `G/VS1`.                        |
| `cost`          | number | Per stone in `currency`.             |
| `currency`      | string | `USD`, `EUR`, `INR`, `THB`, `GBP`.   |
| `supplier`      | string |                                      |
| `effectiveDate` | string | ISO date `YYYY-MM-DD`.               |

### 3. Labour Cost Templates (`labourCostTemplates`)

Reusable labour rate sets per factory and metal.

| Field              | Type   | Notes                                |
| ------------------ | ------ | ------------------------------------ |
| `id`               | string | **Primary key**, e.g. `LB-001`.      |
| `templateName`     | string |                                      |
| `factory`          | string |                                      |
| `metalType`        | string |                                      |
| `labourSteps`      | string | Comma-separated steps.               |
| `baseLabourCost`   | number |                                      |
| `stoneSettingCost` | number |                                      |
| `finishingCost`    | number |                                      |
| `currency`         | string |                                      |
| `notes`            | string |                                      |

### 4. Product Development (`productDevelopment`)

Lifecycle tracking from idea to launch.

| Field                  | Type   | Notes                                                   |
| ---------------------- | ------ | ------------------------------------------------------- |
| `projectId`            | string | **Primary key**, e.g. `PD-2001`.                        |
| `productName`          | string |                                                         |
| `relatedMasterId`      | string | FK -> `masterDesigns.masterId`.                         |
| `status`               | string | `Idea` \| `CAD` \| `Prototype` \| `Costing` \| `Approved` \| `Launched`. |
| `assignedFactory`      | string |                                                         |
| `targetLaunchDate`     | string | ISO date.                                               |
| `linkedSpecifications` | string | Comma-separated `specifications.specId` values.         |
| `linkedProducts`       | string | Comma-separated `products.sku` values.                  |
| `notes`                | string |                                                         |

### 5. Specifications (`specifications`)

Reusable rule-sets that Products adopt.

| Field                 | Type   | Notes                                |
| --------------------- | ------ | ------------------------------------ |
| `specId`              | string | **Primary key**, e.g. `SP-001`.      |
| `specName`            | string |                                      |
| `metal`               | string | Gold, Platinum, Silver, Palladium.   |
| `color`               | string | Yellow, White, Rose, Two-tone.       |
| `karat`               | string | 10K, 14K, 18K, 22K, PT950, PT900.    |
| `stoneQuality`        | string |                                      |
| `finish`              | string |                                      |
| `engravingAllowed`    | string | `Yes` \| `No`.                       |
| `sizingRules`         | string |                                      |
| `factoryRestrictions` | string |                                      |
| `notes`               | string |                                      |

### 6. Products (`products`)

Final SKUs linked to a master design.

| Field             | Type   | Notes                                |
| ----------------- | ------ | ------------------------------------ |
| `sku`             | string | **Primary key**, e.g. `SKU-RING-0001`. |
| `relatedMasterId` | string | FK -> `masterDesigns.masterId`.      |
| `productName`     | string |                                      |
| `metal`           | string |                                      |
| `color`           | string |                                      |
| `karat`           | string |                                      |
| `centerStoneSize` | string |                                      |
| `stoneQuality`    | string |                                      |
| `estimatedWeight` | number | Grams.                               |
| `calculatedCost`  | number | Currently a stored value; future cost engine will compute it from inputs. |
| `status`          | string | `Draft` \| `Active` \| `Archived`.   |
| `notes`           | string |                                      |

## Relationships

```
Master Designs (1) ---< (N) Products              (relatedMasterId)
Master Designs (1) ---< (N) Product Development   (relatedMasterId)
Specifications (N) >--< (N) Product Development   (linkedSpecifications)
Products       (N) >--< (N) Product Development   (linkedProducts)
Specifications (N) >--< (N) Products              (planned, not yet enforced)
Stone Cost Tables and Labour Cost Templates feed the future cost engine.
```

Many-to-many links are stored as comma-separated ID strings to keep the
prototype simple. A real implementation would model them as join tables.

## Adding fields

When adding a field:

1. Add it to the matching `fields` config in `modules/<name>/<name>.js`.
2. Optionally add it to `columns` to show it in the table.
3. Add a sensible default to every record in `shared/sample-data.js`.
4. Update the table in this document.
