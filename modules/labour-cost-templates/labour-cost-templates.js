/* Labour Cost Templates module - factory + metal labour rate sets. */
(function () {
  "use strict";

  App.renderNav("labour-cost-templates");
  App.renderFooter();

  function totalCost(row) {
    var sum = (Number(row.baseLabourCost) || 0) +
      (Number(row.stoneSettingCost) || 0) +
      (Number(row.finishingCost) || 0);
    return App.money(sum, row.currency);
  }

  App.crudPage({
    storeKey: "labourCostTemplates",
    idField: "id",
    itemLabel: "Labour Template",
    searchKeys: ["id", "templateName", "factory", "metalType", "labourSteps"],
    columns: [
      { key: "templateName" },
      { key: "factory", dim: true },
      { key: "metalType", dim: true },
      {
        key: "baseLabourCost",
        render: function (val, row) { return App.money(val, row.currency); }
      },
      {
        key: "stoneSettingCost",
        render: function (val, row) { return App.money(val, row.currency); }
      },
      {
        key: "finishingCost",
        render: function (val, row) { return App.money(val, row.currency); }
      },
      { key: "_total", render: function (_, row) { return totalCost(row); } }
    ],
    fields: [
      { key: "id", label: "Template ID", type: "text", required: true },
      { key: "templateName", label: "Template name", type: "text", required: true, full: true },
      { key: "factory", label: "Factory", type: "text" },
      { key: "metalType", label: "Metal type", type: "text" },
      { key: "labourSteps", label: "Labour steps", type: "textarea", full: true },
      { key: "baseLabourCost", label: "Base labour cost", type: "number", step: "0.01" },
      { key: "stoneSettingCost", label: "Stone setting cost", type: "number", step: "0.01" },
      { key: "finishingCost", label: "Finishing cost", type: "number", step: "0.01" },
      {
        key: "currency", label: "Currency", type: "select",
        options: ["USD", "EUR", "INR", "THB", "GBP"]
      },
      { key: "notes", label: "Notes", type: "textarea", full: true }
    ]
  });
})();
