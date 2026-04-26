/* Stone Cost Tables module - reference cost lookup by stone/shape/size/quality. */
(function () {
  "use strict";

  App.renderNav("stone-cost-tables");
  App.renderFooter();

  App.crudPage({
    storeKey: "stoneCostTables",
    idField: "id",
    itemLabel: "Stone Cost",
    searchKeys: ["id", "stoneType", "shape", "size", "quality", "supplier"],
    filters: [
      { key: "stoneType", label: "Stone" },
      { key: "shape", label: "Shape" },
      { key: "supplier", label: "Supplier" },
      { key: "currency", label: "Currency" }
    ],
    columns: [
      { key: "stoneType" },
      { key: "shape", dim: true },
      { key: "size", dim: true },
      { key: "quality" },
      {
        key: "cost",
        render: function (val, row) { return App.money(val, row.currency); }
      },
      { key: "supplier", dim: true },
      { key: "effectiveDate", dim: true }
    ],
    fields: [
      { key: "id", label: "Cost ID", type: "text", required: true },
      { key: "stoneType", label: "Stone type", type: "text", required: true },
      { key: "shape", label: "Shape", type: "text" },
      { key: "size", label: "Size", type: "text" },
      { key: "quality", label: "Quality", type: "text" },
      { key: "cost", label: "Cost", type: "number", step: "0.01" },
      {
        key: "currency", label: "Currency", type: "select",
        options: ["USD", "EUR", "INR", "THB", "GBP"]
      },
      { key: "supplier", label: "Supplier", type: "text" },
      { key: "effectiveDate", label: "Effective date", type: "date" }
    ]
  });
})();
