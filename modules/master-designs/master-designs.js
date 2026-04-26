/* Master Designs module - CRUD list of approved jewelry designs. */
(function () {
  "use strict";

  App.renderNav("master-designs");
  App.renderFooter();

  App.crudPage({
    storeKey: "masterDesigns",
    idField: "masterId",
    itemLabel: "Master Design",
    searchKeys: [
      "masterId", "styleCode", "designName", "collection",
      "category", "centerStoneShape", "status"
    ],
    filters: [
      { key: "status", label: "Status" },
      { key: "collection", label: "Collection" },
      { key: "category", label: "Category" }
    ],
    columns: [
      { key: "masterId" },
      { key: "styleCode", dim: true },
      { key: "designName" },
      { key: "collection", dim: true },
      { key: "category", dim: true },
      {
        key: "centerStoneShape",
        render: function (val, row) {
          var size = row.centerStoneSize ? " &middot; " + App.escapeHtml(row.centerStoneSize) : "";
          return App.escapeHtml(val || "") + size;
        }
      },
      { key: "status", badge: true }
    ],
    fields: [
      { key: "masterId", label: "Master ID", type: "text", required: true },
      { key: "styleCode", label: "Style code", type: "text" },
      { key: "designName", label: "Design name", type: "text", required: true, full: true },
      { key: "collection", label: "Collection", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "centerStoneShape", label: "Center stone shape", type: "text" },
      { key: "centerStoneSize", label: "Center stone size", type: "text" },
      { key: "sideStoneConfiguration", label: "Side stone configuration", type: "text", full: true },
      { key: "approvedFactories", label: "Approved factories", type: "text", full: true },
      { key: "allowedMetals", label: "Allowed metals", type: "text", full: true },
      {
        key: "status", label: "Status", type: "select",
        options: ["Draft", "Approved", "Retired"]
      },
      { key: "notes", label: "Notes", type: "textarea", full: true }
    ]
  });
})();
