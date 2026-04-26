/* Master Designs module
 *
 * Source-of-truth library for parent jewelry design templates. A Master
 * Design is not a final SKU; Products reference a Master Design via
 * `relatedMasterId`.
 *
 * Records are stored in localStorage under "masterDesigns" with a nested
 * structure (centerStone, designSpecs, metalRules, manufacturing,
 * costingLinks, files, plus stoneGroups[] and changeLog[] arrays). The
 * shape is deliberately backend-friendly so it can be migrated later.
 *
 * Dropdown values are inlined here for now; long term they should come from
 * the Specifications module.
 */
(function () {
  "use strict";

  App.renderNav("master-designs");
  App.renderFooter();

  /* ---------- Option sets (placeholders for Specifications) ---------- */
  var OPTIONS = {
    status: ["Draft", "In Review", "Approved", "Active", "Retired"],
    yesNo: ["Yes", "No"],
    centerShape: ["Round", "Oval", "Cushion", "Emerald", "Pear", "Marquise", "Princess", "Radiant", "None"],
    centerSizeLogic: ["Fixed Size", "Size Range", "Collection-Based", "Custom Per Order"],
    centerSettingStyle: ["Prong", "Bezel", "Basket", "Cathedral", "Peg Head", "Semi-Bezel", "Tension-Style"],
    prongCount: ["4", "6", "8", "Other"],
    stoneCategory: ["Diamond", "Gemstone", "Moissanite", "Lab Diamond"],
    stoneShape: ["Round", "Oval", "Cushion", "Emerald", "Pear", "Marquise", "Princess", "Radiant", "Baguette", "Other"],
    sizingRule: ["Standard Sizing", "Limited Sizing", "Not Sizable", "Size Affects Stone Count"],
    karats: ["10K", "14K", "18K", "Platinum", "Silver"],
    colors: ["Yellow", "White", "Rose", "Platinum", "Two-Tone"],
    finishes: ["High Polish", "Rhodium", "Sandblast", "Brushed", "Plated"],
    productionMethod: ["Casting", "CNC", "Hand Fabrication", "Hybrid"],
    masterAvailability: ["Internal Only", "Selected Factories", "All Approved Factories"],
    complexityLevel: ["Simple", "Standard", "Complex", "High Risk"],
    metalWeightBasis: ["Estimated Weight", "Confirmed Weight", "Formula-Based"],
    costingStatus: ["Missing", "Estimated", "Confirmed", "Needs Review"],
    changeType: ["CAD Update", "Stone Update", "Factory Update", "Approval Update", "Costing Update", "Specification Update"]
  };

  var STORE_KEY = "masterDesigns";
  var ID_FIELD = "masterId";
  var esc = App.escapeHtml;

  /* ---------- Helpers ---------- */
  function loadAll() {
    var list = Storage.load(STORE_KEY);
    return Array.isArray(list) ? list : [];
  }

  function findById(id) {
    return loadAll().find(function (r) { return r[ID_FIELD] === id; }) || null;
  }

  function nextMasterId() {
    var list = loadAll();
    var maxN = 1000;
    list.forEach(function (r) {
      var m = /^MD-(\d+)$/.exec(String(r.masterId || ""));
      if (m) maxN = Math.max(maxN, Number(m[1]));
    });
    return "MD-" + (maxN + 1);
  }

  function nowIso() { return new Date().toISOString(); }

  function todayIso() { return new Date().toISOString().slice(0, 10); }

  function formatLastUpdated(value) {
    if (!value) return "";
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10);
  }

  function unique(values) {
    var seen = {};
    var out = [];
    values.forEach(function (v) {
      if (v === undefined || v === null) return;
      var s = String(v).trim();
      if (!s || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out.sort();
  }

  function arrToStr(arr) {
    return Array.isArray(arr) ? arr.filter(Boolean).join(", ") : (arr || "");
  }

  function linkedProductCount(masterId) {
    var products = Storage.load("products");
    if (!Array.isArray(products)) return 0;
    return products.filter(function (p) { return p.relatedMasterId === masterId; }).length;
  }

  /* ---------- Default record ---------- */
  function blankRecord() {
    return {
      masterId: "",
      styleCode: "",
      designName: "",
      brandProgram: "",
      collection: "",
      category: "",
      type: "",
      internalDescription: "",
      tags: [],

      status: "Draft",
      approvalRequired: "Yes",
      approvedBy: "",
      approvalDate: "",
      reviewNotes: "",
      exceptionNotes: "",

      centerStone: {
        hasCenterStone: "Yes",
        shape: "",
        sizeLogic: "",
        carat: "",
        millimeterSize: "",
        settingStyle: "",
        numberOfProngs: "",
        notes: ""
      },

      stoneGroups: [],

      designSpecs: {
        shankBottomWidth: "",
        shankTopWidth: "",
        shankThickness: "",
        shoulderWidth: "",
        headHeight: "",
        galleryHeight: "",
        minimumFingerSize: "",
        maximumFingerSize: "",
        sizingRule: "",
        toleranceNotes: "",
        cadNotes: "",
        qcNotes: ""
      },

      metalRules: {
        allowedKarats: [],
        allowedColors: [],
        restrictedMetals: "",
        defaultPrototypeMetal: "",
        finishOptions: [],
        notes: ""
      },

      manufacturing: {
        productionMethod: "",
        approvedFactories: "",
        factoryRestrictions: "",
        masterAvailability: "",
        complexityLevel: "",
        productionNotes: ""
      },

      costingLinks: {
        labourCostTemplateId: "",
        stoneCostRuleId: "",
        metalWeightBasis: "",
        estimatedBaseWeight: "",
        costingStatus: "",
        weightNotes: ""
      },

      files: {
        thumbnailUrl: "",
        cadFileUrl: "",
        stl3dmFileUrl: "",
        renderImageUrl: "",
        waxPhotoUrl: "",
        productionSamplePhotoUrl: "",
        specSheetUrl: ""
      },

      changeLog: [],
      lastUpdated: ""
    };
  }

  function blankStoneGroup() {
    return {
      groupName: "",
      stoneCategory: "",
      shape: "",
      quantity: "",
      sizeMm: "",
      caratWeight: "",
      qualityDefault: "",
      settingStyle: "",
      spacingRule: "",
      required: "No",
      notes: ""
    };
  }

  function blankChangeLogEntry() {
    return {
      changeDate: todayIso(),
      changedBy: "",
      changeType: "",
      changeDescription: "",
      previousValue: "",
      newValue: ""
    };
  }

  /* ---------- DOM refs ---------- */
  var listEl = document.getElementById("list-body");
  var emptyEl = document.getElementById("list-empty");
  var searchEl = document.getElementById("search");
  var addBtn = document.getElementById("add-btn");
  var resetBtn = document.getElementById("reset-btn");
  var clearFiltersBtn = document.getElementById("clear-filters");
  var filterStatus = document.getElementById("filter-status");
  var filterCollection = document.getElementById("filter-collection");
  var filterCategory = document.getElementById("filter-category");
  var filterType = document.getElementById("filter-type");
  var filterCenterShape = document.getElementById("filter-center-shape");

  var dialog = document.getElementById("form-dialog");
  var form = document.getElementById("form");
  var sectionsHolder = document.getElementById("form-sections");
  var dialogTitle = document.getElementById("dialog-title");
  var cancelBtn = document.getElementById("form-cancel");

  var state = {
    all: [],
    filter: { search: "", status: "", collection: "", category: "", type: "", centerShape: "" },
    editingId: null,
    draft: null,
    openMenuId: null
  };

  /* ---------- Filter dropdown population ---------- */
  function populateFilterSelect(el, values, currentValue) {
    var opts = ['<option value="">All</option>'].concat(values.map(function (v) {
      var sel = v === currentValue ? " selected" : "";
      return '<option value="' + esc(v) + '"' + sel + ">" + esc(v) + "</option>";
    }));
    el.innerHTML = opts.join("");
  }

  function refreshFilterOptions() {
    populateFilterSelect(filterCollection, unique(state.all.map(function (r) { return r.collection; })), state.filter.collection);
    populateFilterSelect(filterCategory, unique(state.all.map(function (r) { return r.category; })), state.filter.category);
    populateFilterSelect(filterType, unique(state.all.map(function (r) { return r.type; })), state.filter.type);
    populateFilterSelect(filterCenterShape, OPTIONS.centerShape, state.filter.centerShape);
  }

  /* ---------- Filtering ---------- */
  function rowMatches(row) {
    var f = state.filter;
    var q = f.search.trim().toLowerCase();
    if (q) {
      var haystack = [
        row.masterId, row.styleCode, row.designName,
        row.collection, row.category, row.type
      ].map(function (v) { return v ? String(v).toLowerCase() : ""; }).join("  ");
      if (haystack.indexOf(q) === -1) return false;
    }
    if (f.status && row.status !== f.status) return false;
    if (f.collection && row.collection !== f.collection) return false;
    if (f.category && row.category !== f.category) return false;
    if (f.type && row.type !== f.type) return false;
    if (f.centerShape) {
      var shape = row.centerStone && row.centerStone.shape;
      if (shape !== f.centerShape) return false;
    }
    return true;
  }

  /* ---------- Table render ---------- */
  function centerStoneSummary(row) {
    var c = row.centerStone || {};
    if (c.hasCenterStone === "No") return '<span class="cell-dim">None</span>';
    var bits = [];
    if (c.shape) bits.push(c.shape);
    if (c.carat) bits.push(c.carat + "ct");
    else if (c.millimeterSize) bits.push(c.millimeterSize + "mm");
    return bits.length ? esc(bits.join(" · ")) : '<span class="cell-dim">&mdash;</span>';
  }

  function actionMenuHtml(row) {
    var id = esc(row.masterId);
    var open = state.openMenuId === row.masterId ? " open" : "";
    var canDelete = linkedProductCount(row.masterId) === 0;
    var deleteAttrs = canDelete ? "" : ' disabled title="Cannot delete: products are linked to this master"';

    function item(action, label, cls) {
      var c = cls ? ' class="' + cls + '"' : "";
      return '<button type="button" data-action="' + action + '" data-id="' + id + '"' + c + '>' + esc(label) + "</button>";
    }

    return (
      '<div class="action-menu">' +
        '<button class="btn btn-sm" data-action="edit" data-id="' + id + '">Edit</button> ' +
        '<button class="btn btn-sm" data-action="toggle-menu" data-id="' + id + '">More ▾</button>' +
        '<div class="action-menu-pop' + open + '" data-menu-id="' + id + '">' +
          item("duplicate", "Duplicate") +
          item("create-product", "Create Product from Master") +
          "<hr/>" +
          item("send-review", "Send for Review") +
          item("approve", "Approve") +
          item("mark-active", "Mark Active") +
          item("retire", "Retire") +
          "<hr/>" +
          '<button type="button" data-action="delete" data-id="' + id + '" class="danger"' + deleteAttrs + ">Delete</button>" +
        "</div>" +
      "</div>"
    );
  }

  function render() {
    state.all = loadAll();
    refreshFilterOptions();

    var rows = state.all.filter(rowMatches);

    if (rows.length === 0) {
      listEl.innerHTML = "";
      emptyEl.style.display = "block";
      emptyEl.textContent = state.all.length === 0
        ? "No master designs yet. Click “Add Master Design” to create one."
        : "No matches for the current filters.";
      return;
    }
    emptyEl.style.display = "none";

    listEl.innerHTML = rows.map(function (row) {
      return "<tr>" +
        "<td>" + esc(row.masterId) + "</td>" +
        '<td class="cell-dim">' + esc(row.styleCode || "") + "</td>" +
        "<td>" + esc(row.designName || "") + "</td>" +
        '<td class="cell-dim">' + esc(row.collection || "") + "</td>" +
        '<td class="cell-dim">' + esc(row.category || "") + "</td>" +
        '<td class="cell-dim">' + esc(row.type || "") + "</td>" +
        "<td>" + centerStoneSummary(row) + "</td>" +
        "<td>" + App.badge(row.status) + "</td>" +
        '<td class="cell-dim">' + esc(formatLastUpdated(row.lastUpdated)) + "</td>" +
        '<td class="actions-cell">' + actionMenuHtml(row) + "</td>" +
      "</tr>";
    }).join("");
  }

  /* ---------- Form field helpers ---------- */
  function inputFieldHtml(name, value, opts) {
    opts = opts || {};
    var type = opts.type || "text";
    var step = opts.step ? ' step="' + opts.step + '"' : "";
    return '<input class="input" type="' + type + '"' + step +
      ' name="' + name + '" value="' + esc(value === undefined || value === null ? "" : value) + '" />';
  }

  function selectFieldHtml(name, value, options, allowBlank) {
    var blank = allowBlank ? '<option value=""></option>' : "";
    var opts = options.map(function (opt) {
      var o = typeof opt === "string" ? { value: opt, label: opt } : opt;
      var sel = String(o.value) === String(value || "") ? " selected" : "";
      return '<option value="' + esc(o.value) + '"' + sel + ">" + esc(o.label) + "</option>";
    }).join("");
    return '<select class="select" name="' + name + '">' + blank + opts + "</select>";
  }

  function textareaFieldHtml(name, value) {
    return '<textarea class="textarea" name="' + name + '">' +
      esc(value === undefined || value === null ? "" : value) + "</textarea>";
  }

  function checkboxGroupHtml(name, value, options) {
    var current = Array.isArray(value) ? value : [];
    var items = options.map(function (opt) {
      var checked = current.indexOf(opt) !== -1 ? " checked" : "";
      return '<label><input type="checkbox" data-group="' + name + '" value="' +
        esc(opt) + '"' + checked + " /> " + esc(opt) + "</label>";
    }).join("");
    return '<div class="checkbox-group" data-group-name="' + name + '">' + items + "</div>";
  }

  function tagInputHtml(name, value) {
    var tags = Array.isArray(value) ? value : (value ? String(value).split(",").map(function (s) { return s.trim(); }).filter(Boolean) : []);
    var chips = tags.map(function (t) {
      return '<span class="chip">' + esc(t) +
        ' <button type="button" data-remove-tag="' + esc(t) + '" aria-label="Remove">×</button></span>';
    }).join("");
    return '<div class="tag-input" data-tag-name="' + name + '">' + chips +
      '<input type="text" data-tag-input="1" placeholder="Add tag, press Enter" /></div>';
  }

  function field(label, control, opts) {
    opts = opts || {};
    var cls = opts.full ? "full" : "";
    return '<div class="' + cls + '"><label>' + esc(label) + "</label>" + control + "</div>";
  }

  function section(title, body, subtitle) {
    return '<div class="form-section">' +
      '<div class="form-section-header"><h3>' + esc(title) + "</h3>" +
        (subtitle ? "<p>" + esc(subtitle) + "</p>" : "") +
      "</div>" +
      '<div class="form-section-body">' + body + "</div>" +
    "</div>";
  }

  /* ---------- Repeater rendering ---------- */
  function renderStoneGroups() {
    var groups = state.draft.stoneGroups || [];
    var items = groups.map(function (g, i) {
      return '<div class="repeater-item" data-repeater="stoneGroups" data-index="' + i + '">' +
        '<div class="repeater-item-header">' +
          "<h4>Stone Group " + (i + 1) + "</h4>" +
          '<button type="button" class="btn btn-sm btn-danger" data-action="remove-stone-group" data-index="' + i + '">Remove</button>' +
        "</div>" +
        '<div class="repeater-fields">' +
          field("Group Name", inputFieldHtml("stoneGroups." + i + ".groupName", g.groupName)) +
          field("Stone Category", selectFieldHtml("stoneGroups." + i + ".stoneCategory", g.stoneCategory, OPTIONS.stoneCategory, true)) +
          field("Shape", selectFieldHtml("stoneGroups." + i + ".shape", g.shape, OPTIONS.stoneShape, true)) +
          field("Quantity", inputFieldHtml("stoneGroups." + i + ".quantity", g.quantity, { type: "number", step: "1" })) +
          field("Size MM", inputFieldHtml("stoneGroups." + i + ".sizeMm", g.sizeMm)) +
          field("Carat Weight", inputFieldHtml("stoneGroups." + i + ".caratWeight", g.caratWeight, { type: "number", step: "0.001" })) +
          field("Quality Default", inputFieldHtml("stoneGroups." + i + ".qualityDefault", g.qualityDefault)) +
          field("Setting Style", inputFieldHtml("stoneGroups." + i + ".settingStyle", g.settingStyle)) +
          field("Spacing Rule", inputFieldHtml("stoneGroups." + i + ".spacingRule", g.spacingRule)) +
          field("Required", selectFieldHtml("stoneGroups." + i + ".required", g.required, OPTIONS.yesNo, false)) +
          field("Notes", textareaFieldHtml("stoneGroups." + i + ".notes", g.notes), { full: true }) +
        "</div>" +
      "</div>";
    }).join("");

    return '<div class="repeater" data-repeater-name="stoneGroups">' +
      items +
      '<button type="button" class="btn btn-sm repeater-add" data-action="add-stone-group">+ Add stone group</button>' +
    "</div>";
  }

  function renderChangeLog() {
    var entries = state.draft.changeLog || [];
    var items = entries.map(function (e, i) {
      return '<div class="repeater-item" data-repeater="changeLog" data-index="' + i + '">' +
        '<div class="repeater-item-header">' +
          "<h4>Entry " + (i + 1) + "</h4>" +
          '<button type="button" class="btn btn-sm btn-danger" data-action="remove-change-log" data-index="' + i + '">Remove</button>' +
        "</div>" +
        '<div class="repeater-fields">' +
          field("Change Date", inputFieldHtml("changeLog." + i + ".changeDate", e.changeDate, { type: "date" })) +
          field("Changed By", inputFieldHtml("changeLog." + i + ".changedBy", e.changedBy)) +
          field("Change Type", selectFieldHtml("changeLog." + i + ".changeType", e.changeType, OPTIONS.changeType, true)) +
          field("Description", textareaFieldHtml("changeLog." + i + ".changeDescription", e.changeDescription), { full: true }) +
          field("Previous Value", inputFieldHtml("changeLog." + i + ".previousValue", e.previousValue)) +
          field("New Value", inputFieldHtml("changeLog." + i + ".newValue", e.newValue)) +
        "</div>" +
      "</div>";
    }).join("");

    return '<div class="repeater" data-repeater-name="changeLog">' +
      items +
      '<button type="button" class="btn btn-sm repeater-add" data-action="add-change-log">+ Add change log entry</button>' +
    "</div>";
  }

  /* ---------- Build form ---------- */
  function buildForm() {
    var d = state.draft;
    var html = "";

    // 1. Identity
    html += section("1. Identity",
      field("Master ID (auto-generated if blank)", inputFieldHtml("masterId", d.masterId)) +
      field("Style Code", inputFieldHtml("styleCode", d.styleCode)) +
      field("Design Name", inputFieldHtml("designName", d.designName), { full: true }) +
      field("Brand / Program", inputFieldHtml("brandProgram", d.brandProgram)) +
      field("Collection", inputFieldHtml("collection", d.collection)) +
      field("Category", inputFieldHtml("category", d.category)) +
      field("Type", inputFieldHtml("type", d.type)) +
      field("Internal Description", textareaFieldHtml("internalDescription", d.internalDescription), { full: true }) +
      field("Tags", tagInputHtml("tags", d.tags), { full: true })
    );

    // 2. Status and Approval
    html += section("2. Status and Approval",
      field("Status", selectFieldHtml("status", d.status, OPTIONS.status, false)) +
      field("Approval Required", selectFieldHtml("approvalRequired", d.approvalRequired, OPTIONS.yesNo, false)) +
      field("Approved By", inputFieldHtml("approvedBy", d.approvedBy)) +
      field("Approval Date", inputFieldHtml("approvalDate", d.approvalDate, { type: "date" })) +
      field("Review Notes", textareaFieldHtml("reviewNotes", d.reviewNotes), { full: true }) +
      field("Exception Notes", textareaFieldHtml("exceptionNotes", d.exceptionNotes), { full: true })
    );

    // 3. Center Stone Rules
    var c = d.centerStone || {};
    html += section("3. Center Stone Rules",
      field("Has Center Stone", selectFieldHtml("centerStone.hasCenterStone", c.hasCenterStone, OPTIONS.yesNo, false)) +
      field("Center Stone Shape", selectFieldHtml("centerStone.shape", c.shape, OPTIONS.centerShape, true)) +
      field("Center Stone Size Logic", selectFieldHtml("centerStone.sizeLogic", c.sizeLogic, OPTIONS.centerSizeLogic, true)) +
      field("Center Stone Carat", inputFieldHtml("centerStone.carat", c.carat, { type: "number", step: "0.01" })) +
      field("Center Stone Millimeter Size", inputFieldHtml("centerStone.millimeterSize", c.millimeterSize)) +
      field("Center Setting Style", selectFieldHtml("centerStone.settingStyle", c.settingStyle, OPTIONS.centerSettingStyle, true)) +
      field("Number of Prongs", selectFieldHtml("centerStone.numberOfProngs", c.numberOfProngs, OPTIONS.prongCount, true)) +
      field("Center Stone Notes", textareaFieldHtml("centerStone.notes", c.notes), { full: true })
    );

    // 4. Stone Groups (repeater)
    html += section("4. Stone Groups", renderStoneGroups(), "Add one entry per side-stone or accent stone group.");

    // 5. Design Specifications
    var sp = d.designSpecs || {};
    html += section("5. Design Specifications",
      field("Shank Bottom Width", inputFieldHtml("designSpecs.shankBottomWidth", sp.shankBottomWidth)) +
      field("Shank Top Width", inputFieldHtml("designSpecs.shankTopWidth", sp.shankTopWidth)) +
      field("Shank Thickness", inputFieldHtml("designSpecs.shankThickness", sp.shankThickness)) +
      field("Shoulder Width", inputFieldHtml("designSpecs.shoulderWidth", sp.shoulderWidth)) +
      field("Head Height", inputFieldHtml("designSpecs.headHeight", sp.headHeight)) +
      field("Gallery Height", inputFieldHtml("designSpecs.galleryHeight", sp.galleryHeight)) +
      field("Minimum Finger Size", inputFieldHtml("designSpecs.minimumFingerSize", sp.minimumFingerSize)) +
      field("Maximum Finger Size", inputFieldHtml("designSpecs.maximumFingerSize", sp.maximumFingerSize)) +
      field("Sizing Rule", selectFieldHtml("designSpecs.sizingRule", sp.sizingRule, OPTIONS.sizingRule, true), { full: true }) +
      field("Tolerance Notes", textareaFieldHtml("designSpecs.toleranceNotes", sp.toleranceNotes), { full: true }) +
      field("CAD Notes", textareaFieldHtml("designSpecs.cadNotes", sp.cadNotes), { full: true }) +
      field("QC Notes", textareaFieldHtml("designSpecs.qcNotes", sp.qcNotes), { full: true })
    );

    // 6. Metal and Color Rules
    var mr = d.metalRules || {};
    html += section("6. Metal and Color Rules",
      field("Allowed Karats", checkboxGroupHtml("metalRules.allowedKarats", mr.allowedKarats, OPTIONS.karats), { full: true }) +
      field("Allowed Colors", checkboxGroupHtml("metalRules.allowedColors", mr.allowedColors, OPTIONS.colors), { full: true }) +
      field("Restricted Metals", inputFieldHtml("metalRules.restrictedMetals", mr.restrictedMetals)) +
      field("Default Prototype Metal", inputFieldHtml("metalRules.defaultPrototypeMetal", mr.defaultPrototypeMetal)) +
      field("Finish Options", checkboxGroupHtml("metalRules.finishOptions", mr.finishOptions, OPTIONS.finishes), { full: true }) +
      field("Metal Notes", textareaFieldHtml("metalRules.notes", mr.notes), { full: true })
    );

    // 7. Manufacturing Rules
    var mn = d.manufacturing || {};
    html += section("7. Manufacturing Rules",
      field("Production Method", selectFieldHtml("manufacturing.productionMethod", mn.productionMethod, OPTIONS.productionMethod, true)) +
      field("Master Availability", selectFieldHtml("manufacturing.masterAvailability", mn.masterAvailability, OPTIONS.masterAvailability, true)) +
      field("Approved Factories", inputFieldHtml("manufacturing.approvedFactories", mn.approvedFactories), { full: true }) +
      field("Factory Restrictions", textareaFieldHtml("manufacturing.factoryRestrictions", mn.factoryRestrictions), { full: true }) +
      field("Complexity Level", selectFieldHtml("manufacturing.complexityLevel", mn.complexityLevel, OPTIONS.complexityLevel, true)) +
      field("Production Notes", textareaFieldHtml("manufacturing.productionNotes", mn.productionNotes), { full: true })
    );

    // 8. Costing Links
    var cl = d.costingLinks || {};
    var labourTemplates = (Storage.load("labourCostTemplates") || []).map(function (t) {
      return { value: t.id, label: t.id + " - " + (t.templateName || "") };
    });
    html += section("8. Costing Links",
      field("Labour Cost Template ID", labourTemplates.length
        ? selectFieldHtml("costingLinks.labourCostTemplateId", cl.labourCostTemplateId, labourTemplates, true)
        : inputFieldHtml("costingLinks.labourCostTemplateId", cl.labourCostTemplateId)) +
      field("Stone Cost Rule ID", inputFieldHtml("costingLinks.stoneCostRuleId", cl.stoneCostRuleId)) +
      field("Metal Weight Basis", selectFieldHtml("costingLinks.metalWeightBasis", cl.metalWeightBasis, OPTIONS.metalWeightBasis, true)) +
      field("Estimated Base Weight (g)", inputFieldHtml("costingLinks.estimatedBaseWeight", cl.estimatedBaseWeight, { type: "number", step: "0.01" })) +
      field("Costing Status", selectFieldHtml("costingLinks.costingStatus", cl.costingStatus, OPTIONS.costingStatus, true)) +
      field("Weight Notes", textareaFieldHtml("costingLinks.weightNotes", cl.weightNotes), { full: true })
    );

    // 9. Files and Media
    var fi = d.files || {};
    html += section("9. Files and Media",
      field("Thumbnail Image URL", inputFieldHtml("files.thumbnailUrl", fi.thumbnailUrl), { full: true }) +
      field("CAD File URL", inputFieldHtml("files.cadFileUrl", fi.cadFileUrl), { full: true }) +
      field("STL/3DM File URL", inputFieldHtml("files.stl3dmFileUrl", fi.stl3dmFileUrl), { full: true }) +
      field("Render Image URL", inputFieldHtml("files.renderImageUrl", fi.renderImageUrl), { full: true }) +
      field("Wax Photo URL", inputFieldHtml("files.waxPhotoUrl", fi.waxPhotoUrl), { full: true }) +
      field("Production Sample Photo URL", inputFieldHtml("files.productionSamplePhotoUrl", fi.productionSamplePhotoUrl), { full: true }) +
      field("Spec Sheet URL", inputFieldHtml("files.specSheetUrl", fi.specSheetUrl), { full: true })
    );

    // 10. Change Log
    html += section("10. Change Log", renderChangeLog());

    sectionsHolder.innerHTML = html;
  }

  /* ---------- Form -> draft sync ---------- */
  function setByPath(obj, path, value) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var key = parts[i];
      if (!(key in cur) || cur[key] === null || typeof cur[key] !== "object") {
        cur[key] = isNaN(parts[i + 1]) ? {} : [];
      }
      cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function readForm() {
    // Start from the existing draft so repeater arrays survive.
    var data = JSON.parse(JSON.stringify(state.draft));

    // Plain inputs / selects / textareas with name="..."
    var inputs = sectionsHolder.querySelectorAll("input[name], select[name], textarea[name]");
    inputs.forEach(function (el) {
      if (el.type === "checkbox") return; // handled below
      var name = el.getAttribute("name");
      if (!name) return;
      var v = el.value;
      if (el.type === "number") v = v === "" ? "" : Number(v);
      setByPath(data, name, v);
    });

    // Multi-select checkbox groups
    var groups = sectionsHolder.querySelectorAll(".checkbox-group[data-group-name]");
    groups.forEach(function (g) {
      var name = g.getAttribute("data-group-name");
      var checked = g.querySelectorAll("input[type=checkbox]:checked");
      var values = Array.prototype.map.call(checked, function (cb) { return cb.value; });
      setByPath(data, name, values);
    });

    // Tag inputs
    var tagBoxes = sectionsHolder.querySelectorAll(".tag-input[data-tag-name]");
    tagBoxes.forEach(function (box) {
      var name = box.getAttribute("data-tag-name");
      var chips = box.querySelectorAll(".chip");
      var values = Array.prototype.map.call(chips, function (c) {
        return c.firstChild ? String(c.firstChild.textContent || "").trim() : "";
      }).filter(Boolean);
      setByPath(data, name, values);
    });

    return data;
  }

  /* ---------- Workflow actions ---------- */
  function pushChangeLog(record, type, description, prev, next) {
    if (!Array.isArray(record.changeLog)) record.changeLog = [];
    record.changeLog.push({
      changeDate: todayIso(),
      changedBy: "",
      changeType: type,
      changeDescription: description || "",
      previousValue: prev === undefined ? "" : String(prev),
      newValue: next === undefined ? "" : String(next)
    });
  }

  function transitionStatus(record, nextStatus, description) {
    var prev = record.status;
    if (prev === nextStatus) return false;
    record.status = nextStatus;
    pushChangeLog(record, "Approval Update", description || ("Status changed from " + prev + " to " + nextStatus), prev, nextStatus);
    if (nextStatus === "Approved") {
      record.approvalDate = record.approvalDate || todayIso();
    }
    record.lastUpdated = nowIso();
    return true;
  }

  function saveRecord(record) {
    record.lastUpdated = nowIso();
    if (state.editingId) {
      Storage.update(STORE_KEY, ID_FIELD, state.editingId, record);
    } else {
      if (!record[ID_FIELD]) record[ID_FIELD] = nextMasterId();
      Storage.add(STORE_KEY, record);
    }
  }

  function persistInPlace(record) {
    Storage.update(STORE_KEY, ID_FIELD, record[ID_FIELD], record);
  }

  function duplicateRecord(record) {
    var copy = JSON.parse(JSON.stringify(record));
    copy.masterId = nextMasterId();
    copy.styleCode = (copy.styleCode || "") + "-COPY";
    copy.designName = (copy.designName || "") + " (Copy)";
    copy.status = "Draft";
    copy.approvedBy = "";
    copy.approvalDate = "";
    copy.changeLog = [];
    pushChangeLog(copy, "Specification Update", "Duplicated from " + record.masterId, "", copy.masterId);
    copy.lastUpdated = nowIso();
    Storage.add(STORE_KEY, copy);
    return copy;
  }

  function createProductFromMaster(record) {
    var products = Storage.load("products");
    if (!Array.isArray(products)) products = [];
    var n = 1;
    var prefix = "SKU-" + (record.styleCode || record.masterId || "PROD") + "-";
    while (products.some(function (p) { return p.sku === prefix + String(n).padStart(4, "0"); })) n++;
    var allowedKarats = (record.metalRules && record.metalRules.allowedKarats) || [];
    var allowedColors = (record.metalRules && record.metalRules.allowedColors) || [];
    var newProduct = {
      sku: prefix + String(n).padStart(4, "0"),
      relatedMasterId: record.masterId,
      productName: record.designName || record.masterId,
      metal: "",
      color: allowedColors[0] || "",
      karat: allowedKarats[0] || "",
      centerStoneSize: record.centerStone && record.centerStone.carat ? (record.centerStone.carat + "ct") : "",
      stoneQuality: "",
      estimatedWeight: (record.costingLinks && record.costingLinks.estimatedBaseWeight) || "",
      calculatedCost: "",
      status: "Draft",
      notes: "Generated from master " + record.masterId
    };
    Storage.add("products", newProduct);
    return newProduct;
  }

  /* ---------- Dialog ---------- */
  function openDialog(mode, record) {
    state.editingId = record ? record[ID_FIELD] : null;
    state.draft = record
      ? JSON.parse(JSON.stringify(record))
      : blankRecord();
    dialogTitle.textContent = (mode === "edit" ? "Edit " : "Add ") + "Master Design";
    buildForm();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    state.draft = null;
    state.editingId = null;
  }

  /* ---------- Event wiring ---------- */
  addBtn.addEventListener("click", function () { openDialog("add", null); });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset Master Designs back to sample data?")) {
        Storage.reset(STORE_KEY);
        render();
      }
    });
  }

  searchEl.addEventListener("input", App.debounce(function () {
    state.filter.search = searchEl.value;
    render();
  }, 80));

  filterStatus.addEventListener("change", function () {
    state.filter.status = filterStatus.value;
    render();
  });
  filterCollection.addEventListener("change", function () {
    state.filter.collection = filterCollection.value;
    render();
  });
  filterCategory.addEventListener("change", function () {
    state.filter.category = filterCategory.value;
    render();
  });
  filterType.addEventListener("change", function () {
    state.filter.type = filterType.value;
    render();
  });
  filterCenterShape.addEventListener("change", function () {
    state.filter.centerShape = filterCenterShape.value;
    render();
  });

  clearFiltersBtn.addEventListener("click", function () {
    state.filter = { search: "", status: "", collection: "", category: "", type: "", centerShape: "" };
    searchEl.value = "";
    filterStatus.value = "";
    render();
  });

  cancelBtn.addEventListener("click", function () { closeDialog(); });

  /* Row clicks: edit / delete / workflow / menu toggle */
  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    var record = findById(id);

    if (action === "toggle-menu") {
      state.openMenuId = state.openMenuId === id ? null : id;
      render();
      e.stopPropagation();
      return;
    }

    if (!record) return;
    state.openMenuId = null;

    if (action === "edit") {
      openDialog("edit", record);
      return;
    }
    if (action === "delete") {
      if (linkedProductCount(record.masterId) > 0) {
        alert("Cannot delete: products reference this master design.");
        return;
      }
      if (confirm("Delete master design " + record.masterId + "?")) {
        Storage.remove(STORE_KEY, ID_FIELD, record.masterId);
        render();
      }
      return;
    }
    if (action === "duplicate") {
      var copy = duplicateRecord(record);
      render();
      alert("Duplicated as " + copy.masterId + ".");
      return;
    }
    if (action === "create-product") {
      if (record.status !== "Approved" && record.status !== "Active") {
        if (!confirm("Master is not Approved or Active. Create a product anyway?")) return;
      }
      var p = createProductFromMaster(record);
      render();
      alert("Created product " + p.sku + ". Open the Products module to refine it.");
      return;
    }
    if (action === "send-review") {
      if (transitionStatus(record, "In Review")) persistInPlace(record);
      render();
      return;
    }
    if (action === "approve") {
      if (!record.approvedBy) {
        var who = prompt("Approved by:");
        if (who === null) { render(); return; }
        record.approvedBy = who;
      }
      if (transitionStatus(record, "Approved")) persistInPlace(record);
      else persistInPlace(record); // capture approvedBy if status was unchanged
      render();
      return;
    }
    if (action === "mark-active") {
      if (transitionStatus(record, "Active")) persistInPlace(record);
      render();
      return;
    }
    if (action === "retire") {
      if (confirm("Retire master design " + record.masterId + "?")) {
        if (transitionStatus(record, "Retired")) persistInPlace(record);
      }
      render();
      return;
    }
  });

  /* Click outside to close any open action menu */
  document.addEventListener("click", function (e) {
    if (!state.openMenuId) return;
    if (e.target.closest(".action-menu")) return;
    state.openMenuId = null;
    render();
  });

  /* In-form clicks: repeater add/remove + tag chip removal */
  sectionsHolder.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (btn) {
      var action = btn.getAttribute("data-action");
      // Sync current form state into draft before re-rendering.
      state.draft = readForm();
      if (action === "add-stone-group") {
        state.draft.stoneGroups = state.draft.stoneGroups || [];
        state.draft.stoneGroups.push(blankStoneGroup());
        buildForm();
        return;
      }
      if (action === "remove-stone-group") {
        var idx = Number(btn.getAttribute("data-index"));
        state.draft.stoneGroups.splice(idx, 1);
        buildForm();
        return;
      }
      if (action === "add-change-log") {
        state.draft.changeLog = state.draft.changeLog || [];
        state.draft.changeLog.push(blankChangeLogEntry());
        buildForm();
        return;
      }
      if (action === "remove-change-log") {
        var idx2 = Number(btn.getAttribute("data-index"));
        state.draft.changeLog.splice(idx2, 1);
        buildForm();
        return;
      }
    }

    var rmTag = e.target.closest("button[data-remove-tag]");
    if (rmTag) {
      var box = rmTag.closest(".tag-input");
      var chip = rmTag.closest(".chip");
      if (chip && box) chip.parentNode.removeChild(chip);
    }
  });

  /* Tag input: Enter to add */
  sectionsHolder.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var input = e.target;
    if (!input.matches || !input.matches(".tag-input input[data-tag-input]")) return;
    e.preventDefault();
    var value = input.value.trim();
    if (!value) return;
    var box = input.parentNode;
    var existing = Array.prototype.map.call(box.querySelectorAll(".chip"), function (c) {
      return c.firstChild ? String(c.firstChild.textContent || "").trim() : "";
    });
    if (existing.indexOf(value) === -1) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.appendChild(document.createTextNode(value + " "));
      var rm = document.createElement("button");
      rm.type = "button";
      rm.setAttribute("data-remove-tag", value);
      rm.setAttribute("aria-label", "Remove");
      rm.textContent = "×";
      chip.appendChild(rm);
      box.insertBefore(chip, input);
    }
    input.value = "";
  });

  /* Save */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = readForm();
    if (!data.designName || !data.designName.trim()) {
      alert("Design Name is required.");
      return;
    }
    saveRecord(data);
    closeDialog();
    render();
  });

  /* Initial render */
  render();
})();
