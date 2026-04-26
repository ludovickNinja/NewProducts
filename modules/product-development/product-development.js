/* Product Development module - lifecycle tracking from idea to launch.
 *
 * References Master Designs (relatedMasterId) and Products (linkedProducts)
 * via simple ID dropdowns. Multi-link fields (specifications, products) are
 * stored as comma-separated IDs to keep things simple in the prototype.
 */
(function () {
  "use strict";

  App.renderNav("product-development");
  App.renderFooter();

  function masterOptions() {
    return Storage.load("masterDesigns").map(function (m) {
      return { value: m.masterId, label: m.masterId + " - " + m.designName };
    });
  }

  App.crudPage({
    storeKey: "productDevelopment",
    idField: "projectId",
    itemLabel: "Project",
    searchKeys: [
      "projectId", "productName", "relatedMasterId",
      "assignedFactory", "status", "notes"
    ],
    columns: [
      { key: "projectId" },
      { key: "productName" },
      { key: "relatedMasterId", dim: true },
      { key: "assignedFactory", dim: true },
      { key: "targetLaunchDate", dim: true },
      { key: "status", badge: true }
    ],
    fields: [
      { key: "projectId", label: "Project ID", type: "text", required: true },
      { key: "productName", label: "Product name", type: "text", required: true, full: true },
      {
        key: "relatedMasterId", label: "Related master design", type: "select",
        options: masterOptions()
      },
      {
        key: "status", label: "Status", type: "select",
        options: ["Idea", "CAD", "Prototype", "Costing", "Approved", "Launched"]
      },
      { key: "assignedFactory", label: "Assigned factory", type: "text" },
      { key: "targetLaunchDate", label: "Target launch date", type: "date" },
      { key: "linkedSpecifications", label: "Linked specifications (comma-separated IDs)", type: "text", full: true },
      { key: "linkedProducts", label: "Linked products (comma-separated SKUs)", type: "text", full: true },
      { key: "notes", label: "Notes", type: "textarea", full: true }
    ]
  });
})();
