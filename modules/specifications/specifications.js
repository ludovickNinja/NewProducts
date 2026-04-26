/* Specifications module - reusable rule-sets that Products can adopt. */
(function () {
  "use strict";

  App.renderNav("specifications");
  App.renderFooter();

  App.crudPage({
    storeKey: "specifications",
    idField: "specId",
    itemLabel: "Specification",
    searchKeys: ["specId", "specName", "metal", "color", "karat", "finish"],
    filters: [
      { key: "metal", label: "Metal" },
      { key: "color", label: "Color" },
      { key: "karat", label: "Karat" }
    ],
    columns: [
      { key: "specId" },
      { key: "specName" },
      { key: "metal", dim: true },
      { key: "color", dim: true },
      { key: "karat", dim: true },
      { key: "stoneQuality", dim: true },
      { key: "finish", dim: true }
    ],
    fields: [
      { key: "specId", label: "Spec ID", type: "text", required: true },
      { key: "specName", label: "Spec name", type: "text", required: true, full: true },
      {
        key: "metal", label: "Metal", type: "select",
        options: ["Gold", "Platinum", "Silver", "Palladium"]
      },
      {
        key: "color", label: "Color", type: "select",
        options: ["Yellow", "White", "Rose", "Two-tone"]
      },
      {
        key: "karat", label: "Karat", type: "select",
        options: ["10K", "14K", "18K", "22K", "PT950", "PT900"]
      },
      { key: "stoneQuality", label: "Stone quality", type: "text" },
      { key: "finish", label: "Finish", type: "text" },
      {
        key: "engravingAllowed", label: "Engraving allowed", type: "select",
        options: ["Yes", "No"]
      },
      { key: "sizingRules", label: "Sizing rules", type: "text", full: true },
      { key: "factoryRestrictions", label: "Factory restrictions", type: "text", full: true },
      { key: "notes", label: "Notes", type: "textarea", full: true }
    ]
  });
})();
