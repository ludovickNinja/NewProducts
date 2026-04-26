# Data Model

All data is held client-side in `localStorage`, one key per module. Sample
data lives in `shared/sample-data.js`. Records are plain JSON objects with
the fields below.

## Modules

### 1. Master Designs (`masterDesigns`)

Source-of-truth library of parent jewelry design templates. A Master Design
is **not** a final SKU; Products reference one via `relatedMasterId`. Records
use a nested structure that is intentionally backend-friendly. Most
enumerations (shapes, karats, finishes, etc.) are inlined in the module today
but should eventually be sourced from the Specifications module.

#### Top-level fields

| Field                | Type     | Notes                                               |
| -------------------- | -------- | --------------------------------------------------- |
| `masterId`           | string   | **Primary key**, e.g. `MD-1001`. Auto-generated when blank. |
| `styleCode`          | string   | Internal style code.                                |
| `designName`         | string   | Human-readable name. Required.                      |
| `brandProgram`       | string   | Brand or program label.                             |
| `collection`         | string   |                                                     |
| `category`           | string   | Ring, Earring, Pendant, etc.                        |
| `type`               | string   | Solitaire, Halo, Three-stone, etc.                  |
| `internalDescription`| string   |                                                     |
| `tags`               | string[] | Free-form tags.                                     |
| `status`             | string   | `Draft` \| `In Review` \| `Approved` \| `Active` \| `Retired`. |
| `approvalRequired`   | string   | `Yes` \| `No`.                                      |
| `approvedBy`         | string   |                                                     |
| `approvalDate`       | string   | ISO date.                                           |
| `reviewNotes`        | string   |                                                     |
| `exceptionNotes`     | string   |                                                     |
| `lastUpdated`        | string   | ISO timestamp, set automatically.                   |

#### Nested objects

`centerStone` — `hasCenterStone`, `shape`, `sizeLogic`, `carat`,
`millimeterSize`, `settingStyle`, `numberOfProngs`, `notes`.

`designSpecs` — `shankBottomWidth`, `shankTopWidth`, `shankThickness`,
`shoulderWidth`, `headHeight`, `galleryHeight`, `minimumFingerSize`,
`maximumFingerSize`, `sizingRule`, `toleranceNotes`, `cadNotes`, `qcNotes`.

`metalRules` — `allowedKarats[]`, `allowedColors[]`, `restrictedMetals`,
`defaultPrototypeMetal`, `finishOptions[]`, `notes`.

`manufacturing` — `productionMethod`, `approvedFactories`,
`factoryRestrictions`, `masterAvailability`, `complexityLevel`,
`productionNotes`.

`costingLinks` — `labourCostTemplateId` (FK → `labourCostTemplates.id`),
`stoneCostRuleId`, `metalWeightBasis`, `estimatedBaseWeight`,
`costingStatus`, `weightNotes`.

`files` — `thumbnailUrl`, `cadFileUrl`, `stl3dmFileUrl`, `renderImageUrl`,
`waxPhotoUrl`, `productionSamplePhotoUrl`, `specSheetUrl`.

#### Arrays

`stoneGroups[]` — each entry: `groupName`, `stoneCategory`, `shape`,
`quantity`, `sizeMm`, `caratWeight`, `qualityDefault`, `settingStyle`,
`spacingRule`, `required`, `notes`.

`changeLog[]` — each entry: `changeDate`, `changedBy`, `changeType`
(`CAD Update` \| `Stone Update` \| `Factory Update` \| `Approval Update` \|
`Costing Update` \| `Specification Update`), `changeDescription`,
`previousValue`, `newValue`. Workflow actions (Send for Review, Approve,
Mark Active, Retire) auto-append entries.

#### Module actions

The module supports: Add, Edit, Duplicate, Create Product from Master, Send
for Review, Approve, Mark Active, Retire, and Delete. Delete is blocked when
any `products` record references the master via `relatedMasterId`.

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
