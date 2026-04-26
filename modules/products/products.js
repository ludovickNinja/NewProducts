/* Products module - final SKUs.
 *
 * Each Product references a Master Design via relatedMasterId. The
 * `calculatedCost` shown is a placeholder backed by App.calculateProductCost
 * and is intentionally naive; a real cost engine will live elsewhere later.
 */
(function () {
  "use strict";

  App.renderNav("products");
  App.renderFooter();

  function masterOptions() {
    return Storage.load("masterDesigns").map(function (m) {
      return { value: m.masterId, label: m.masterId + " - " + m.designName };
    });
  }

  App.crudPage({
    storeKey: "products",
    idField: "sku",
    itemLabel: "Product",
    searchKeys: [
      "sku", "productName", "relatedMasterId",
      "metal", "color", "karat", "status"
    ],
    filters: [
      { key: "status", label: "Status" },
      { key: "metal", label: "Metal" },
      { key: "color", label: "Color" },
      { key: "karat", label: "Karat" },
      { key: "relatedMasterId", label: "Master design" }
    ],
    columns: [
      { key: "sku" },
      { key: "productName" },
      { key: "relatedMasterId", dim: true },
      {
        key: "metal",
        render: function (val, row) {
          var bits = [val, row.color, row.karat].filter(Boolean);
          return App.escapeHtml(bits.join(" / "));
        }
      },
      {
        key: "centerStoneSize",
        render: function (val, row) {
          var bits = [val, row.stoneQuality].filter(Boolean);
          return App.escapeHtml(bits.join(" / "));
        }
      },
      {
        key: "estimatedWeight",
        render: function (val) { return val ? App.escapeHtml(val) + " g" : ""; }
      },
      {
        key: "calculatedCost",
        render: function (val) { return val ? App.money(val, "USD") : '<span class="cell-dim">&mdash;</span>'; }
      },
      { key: "status", badge: true }
    ],
    fields: [
      { key: "sku", label: "SKU", type: "text", required: true },
      { key: "productName", label: "Product name", type: "text", required: true, full: true },
      {
        key: "relatedMasterId", label: "Related master design", type: "select",
        options: masterOptions()
      },
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
      { key: "centerStoneSize", label: "Center stone size", type: "text" },
      { key: "stoneQuality", label: "Stone quality", type: "text" },
      { key: "estimatedWeight", label: "Estimated weight (g)", type: "number", step: "0.01" },
      { key: "calculatedCost", label: "Calculated cost (USD)", type: "number", step: "0.01" },
      {
        key: "status", label: "Status", type: "select",
        options: ["Draft", "Active", "Archived"]
      },
      { key: "notes", label: "Notes", type: "textarea", full: true }
    ]
  });
})();
