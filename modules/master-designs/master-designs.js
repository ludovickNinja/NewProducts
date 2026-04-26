/* Master Designs module */
(function () {
  "use strict";

  App.renderNav("master-designs");
  App.renderFooter();

  var OPTIONS = {
    status: ["Draft", "In Review", "Approved", "Active", "Retired"],
    yesNo: ["Yes", "No"],
    centerLabel: ["Center Stone 1", "Center Stone 2", "Main Stone", "Secondary Center Stone", "Custom"],
    centerShape: ["Round", "Oval", "Cushion", "Emerald", "Pear", "Marquise", "Princess", "Radiant", "Baguette", "Trillion", "Heart", "Asscher", "Custom"],
    centerSizeLogic: ["Fixed Size", "Size Range", "Custom Per Order"],
    centerSettingStyle: ["Prong", "Bezel", "Basket", "Cathedral", "Peg Head", "Semi-Bezel", "Tension-Style", "Flush", "Custom"],
    prongCount: ["0", "2", "3", "4", "5", "6", "8", "Other"],
    stoneCategory: ["Diamond", "Lab Diamond", "Gemstone", "Moissanite", "Other"],
    stoneShape: ["Round", "Oval", "Cushion", "Emerald", "Pear", "Marquise", "Princess", "Radiant", "Baguette", "Tapered Baguette", "Trillion", "Custom"],
    stoneSettingStyle: ["Pavé", "Shared Prong", "Channel", "Bezel", "Burnish", "Fishtail", "Flush", "Prong", "Custom"],
    stoneCountLogic: ["Fixed Count", "Count by Finger Size Range", "Count by Length/Dimension", "Custom / Manual"],
    sizingRule: ["Standard Sizing", "Limited Sizing", "Not Sizable", "Size Affects Stone Count"],
    productionMethod: ["Casting", "CNC", "Hand Fabrication", "Hybrid"],
    masterAvailability: ["Internal Only", "Selected Factories", "All Approved Factories"],
    complexityLevel: ["Simple", "Standard", "Complex", "High Risk"],
    metalWeightBasis: ["Estimated Weight", "Confirmed Weight", "Formula-Based"],
    costingStatus: ["Missing", "Estimated", "Confirmed", "Needs Review"],
    changeType: ["CAD Update", "Stone Update", "Factory Update", "Approval Update", "Costing Update", "Specification Update"]
  };

  var STORE_KEY = "masterDesigns";
  var UI_KEY = "newproducts:masterDesignsUi";
  var ID_FIELD = "masterId";
  var esc = App.escapeHtml;

  function nowIso() { return new Date().toISOString(); }
  function todayIso() { return new Date().toISOString().slice(0, 10); }

  function blankCenterStoneEntry(idx) {
    return {
      label: "Center Stone " + (idx + 1),
      customLabel: "",
      shape: "",
      sizeLogic: "",
      carat: "",
      millimeter: "",
      settingStyle: "",
      prongCount: "",
      notes: ""
    };
  }

  function blankStoneRange() {
    return { fromSize: "", toSize: "", stoneCount: "", notes: "" };
  }

  function blankStoneGroup() {
    return {
      groupName: "",
      stoneCategory: "",
      shape: "",
      sizeMm: "",
      caratWeight: "",
      qualityDefault: "",
      settingStyle: "",
      required: "No",
      countLogic: "Fixed Count",
      fixedCount: "",
      sizeRanges: [],
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
        required: true,
        count: 1,
        stones: [blankCenterStoneEntry(0)]
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

  function arrToStr(arr) { return Array.isArray(arr) ? arr.filter(Boolean).join(", ") : (arr || ""); }

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
      var s = (v === undefined || v === null) ? "" : String(v).trim();
      if (!s || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out.sort();
  }

  function migrateCenterStone(input) {
    if (!input || typeof input !== "object") {
      return { required: false, count: 1, stones: [blankCenterStoneEntry(0)] };
    }
    if (Array.isArray(input.stones)) {
      var count = Number(input.count) === 2 ? 2 : 1;
      var stones = input.stones.slice(0, 2).map(function (s, idx) {
        return Object.assign(blankCenterStoneEntry(idx), s || {});
      });
      while (stones.length < count) stones.push(blankCenterStoneEntry(stones.length));
      return { required: input.required !== false, count: count, stones: stones };
    }
    var oldRequired = input.hasCenterStone ? input.hasCenterStone !== "No" : true;
    var legacyStone = {
      label: "Center Stone 1",
      customLabel: "",
      shape: input.shape || "",
      sizeLogic: input.sizeLogic || "",
      carat: input.carat === undefined || input.carat === null ? "" : String(input.carat),
      millimeter: input.millimeter || input.millimeterSize || "",
      settingStyle: input.settingStyle || "",
      prongCount: input.prongCount || input.numberOfProngs || "",
      notes: input.notes || ""
    };
    return { required: oldRequired, count: 1, stones: [Object.assign(blankCenterStoneEntry(0), legacyStone)] };
  }

  function migrateStoneGroup(g) {
    var out = Object.assign(blankStoneGroup(), g || {});
    if (!out.countLogic) out.countLogic = "Fixed Count";
    if (out.quantity !== undefined && out.quantity !== null && out.quantity !== "" && (out.fixedCount === "" || out.fixedCount === undefined)) {
      out.fixedCount = out.quantity;
    }
    if (!Array.isArray(out.sizeRanges)) out.sizeRanges = [];
    out.sizeRanges = out.sizeRanges.map(function (r) {
      return Object.assign(blankStoneRange(), r || {});
    });
    delete out.quantity;
    delete out.spacingRule;
    return out;
  }

  function migrateRecord(rec) {
    var base = blankRecord();
    var out = Object.assign(base, rec || {});
    out.tags = Array.isArray(out.tags) ? out.tags : (out.tags ? String(out.tags).split(",").map(function (s) { return s.trim(); }).filter(Boolean) : []);
    out.centerStone = migrateCenterStone(out.centerStone);
    out.stoneGroups = Array.isArray(out.stoneGroups) ? out.stoneGroups.map(migrateStoneGroup) : [];
    out.designSpecs = Object.assign(base.designSpecs, out.designSpecs || {});
    out.manufacturing = Object.assign(base.manufacturing, out.manufacturing || {});
    out.costingLinks = Object.assign(base.costingLinks, out.costingLinks || {});
    out.files = Object.assign(base.files, out.files || {});
    out.changeLog = Array.isArray(out.changeLog) ? out.changeLog : [];
    delete out.metalRules;
    return out;
  }

  function loadAll() {
    var list = Storage.load(STORE_KEY);
    if (!Array.isArray(list)) list = [];
    var changed = false;
    var migrated = list.map(function (r) {
      var m = migrateRecord(r);
      if (JSON.stringify(r) !== JSON.stringify(m)) changed = true;
      return m;
    });
    if (changed) Storage.save(STORE_KEY, migrated);
    return migrated;
  }

  function findById(id) {
    return loadAll().find(function (r) { return r[ID_FIELD] === id; }) || null;
  }

  function nextMasterId() {
    var maxN = 1000;
    loadAll().forEach(function (r) {
      var m = /^MD-(\d+)$/.exec(String(r.masterId || ""));
      if (m) maxN = Math.max(maxN, Number(m[1]));
    });
    return "MD-" + (maxN + 1);
  }

  function linkedProductCount(masterId) {
    var products = Storage.load("products");
    if (!Array.isArray(products)) return 0;
    return products.filter(function (p) { return p.relatedMasterId === masterId; }).length;
  }

  function centerStoneSummaryText(row) {
    var c = migrateCenterStone(row.centerStone);
    if (c.required === false) return "None";
    var stones = c.stones.slice(0, c.count || 1);
    if ((c.count || 1) === 2) {
      var labels = stones.map(function (s) {
        var shape = s.shape || "Unknown";
        var wt = s.carat ? (s.carat + "ct") : (s.millimeter ? (s.millimeter + "mm") : "");
        return (shape + (wt ? (" " + wt) : "")).trim();
      });
      return "2 stones · " + labels.join(" + ");
    }
    var s0 = stones[0] || {};
    var bits = [];
    if (s0.shape) bits.push(s0.shape);
    if (s0.carat) bits.push(s0.carat + "ct");
    if (s0.millimeter) bits.push(s0.millimeter + "mm");
    return bits.length ? bits.join(" · ") : "None";
  }

  function stoneGroupCountSummary(g) {
    if (g.countLogic === "Fixed Count") return g.fixedCount ? (g.fixedCount + " stones") : "fixed count";
    if (g.countLogic === "Count by Finger Size Range") return "count by finger size";
    if (g.countLogic === "Count by Length/Dimension") return "count by length/dimension";
    return "manual count";
  }

  function stoneGroupsCardSummary(row) {
    var groups = Array.isArray(row.stoneGroups) ? row.stoneGroups : [];
    if (!groups.length) return ["None"];
    var lines = groups.slice(0, 2).map(function (g) {
      return [
        (g.groupName || "Group") + ":",
        (g.shape || "Shape"),
        (g.sizeMm ? (g.sizeMm + "mm") : ""),
        stoneGroupCountSummary(g)
      ].filter(Boolean).join(" ").replace(" :", ":");
    });
    if (groups.length > 2) lines.push("+ " + (groups.length - 2) + " more groups");
    return lines;
  }

  function inputFieldHtml(name, value, opts) {
    opts = opts || {};
    var type = opts.type || "text";
    var step = opts.step ? ' step="' + opts.step + '"' : "";
    return '<input class="input" type="' + type + '"' + step + ' name="' + name + '" value="' + esc(value === undefined || value === null ? "" : value) + '" />';
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
    return '<textarea class="textarea" name="' + name + '">' + esc(value || "") + "</textarea>";
  }

  function tagInputHtml(name, value) {
    var tags = Array.isArray(value) ? value : [];
    var chips = tags.map(function (t) {
      return '<span class="chip">' + esc(t) + ' <button type="button" data-remove-tag="' + esc(t) + '">×</button></span>';
    }).join("");
    return '<div class="tag-input" data-tag-name="' + name + '">' + chips + '<input type="text" data-tag-input="1" placeholder="Add tag, press Enter" /></div>';
  }

  function field(label, control, opts) {
    opts = opts || {};
    return '<div class="' + (opts.full ? "full" : "") + '"><label>' + esc(label) + '</label>' + control + "</div>";
  }

  function section(title, body, subtitle) {
    return '<div class="form-section"><div class="form-section-header"><h3>' + esc(title) + '</h3>' + (subtitle ? ('<p>' + esc(subtitle) + '</p>') : "") + '</div><div class="form-section-body">' + body + "</div></div>";
  }

  var listEl = document.getElementById("list-body");
  var cardWrapEl = document.getElementById("card-view-wrap");
  var tableWrapEl = document.getElementById("table-view-wrap");
  var emptyEl = document.getElementById("list-empty");
  var searchEl = document.getElementById("search");
  var viewTableBtn = document.getElementById("view-table");
  var viewCardBtn = document.getElementById("view-card");
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

  function loadUiState() {
    try {
      var raw = localStorage.getItem(UI_KEY);
      if (!raw) return { viewMode: "table", filter: { search: "", status: "", collection: "", category: "", type: "", centerShape: "" } };
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("bad state");
      if (parsed.viewMode !== "card" && parsed.viewMode !== "table") parsed.viewMode = "table";
      parsed.filter = Object.assign({ search: "", status: "", collection: "", category: "", type: "", centerShape: "" }, parsed.filter || {});
      return parsed;
    } catch (e) {
      return { viewMode: "table", filter: { search: "", status: "", collection: "", category: "", type: "", centerShape: "" } };
    }
  }

  var ui = loadUiState();

  var state = {
    all: [],
    filter: ui.filter,
    viewMode: ui.viewMode,
    editingId: null,
    draft: null,
    openMenuId: null
  };

  function saveUiState() {
    localStorage.setItem(UI_KEY, JSON.stringify({ viewMode: state.viewMode, filter: state.filter }));
  }

  function populateFilterSelect(el, values, currentValue) {
    var opts = ['<option value="">All</option>'].concat(values.map(function (v) {
      return '<option value="' + esc(v) + '"' + (v === currentValue ? " selected" : "") + ">" + esc(v) + "</option>";
    }));
    el.innerHTML = opts.join("");
  }

  function refreshFilterOptions() {
    populateFilterSelect(filterCollection, unique(state.all.map(function (r) { return r.collection; })), state.filter.collection);
    populateFilterSelect(filterCategory, unique(state.all.map(function (r) { return r.category; })), state.filter.category);
    populateFilterSelect(filterType, unique(state.all.map(function (r) { return r.type; })), state.filter.type);
    populateFilterSelect(filterCenterShape, OPTIONS.centerShape, state.filter.centerShape);
  }

  function rowMatches(row) {
    var f = state.filter;
    var q = (f.search || "").trim().toLowerCase();
    if (q) {
      var haystack = [row.masterId, row.styleCode, row.designName, row.collection, row.category, row.type]
        .map(function (v) { return v ? String(v).toLowerCase() : ""; }).join(" ");
      if (haystack.indexOf(q) === -1) return false;
    }
    if (f.status && row.status !== f.status) return false;
    if (f.collection && row.collection !== f.collection) return false;
    if (f.category && row.category !== f.category) return false;
    if (f.type && row.type !== f.type) return false;
    if (f.centerShape) {
      var c = migrateCenterStone(row.centerStone);
      var firstShape = c.stones[0] && c.stones[0].shape;
      if (firstShape !== f.centerShape) return false;
    }
    return true;
  }

  function actionMenuHtml(row) {
    var id = esc(row.masterId);
    var open = state.openMenuId === row.masterId ? " open" : "";
    var canDelete = linkedProductCount(row.masterId) === 0;
    var deleteAttrs = canDelete ? "" : ' disabled title="Cannot delete: products are linked to this master"';
    return '<div class="action-menu">' +
      '<button class="btn btn-sm" data-action="edit" data-id="' + id + '">Open/Edit</button> ' +
      '<button class="btn btn-sm" data-action="toggle-menu" data-id="' + id + '">More ▾</button>' +
      '<div class="action-menu-pop' + open + '">' +
      '<button type="button" data-action="duplicate" data-id="' + id + '">Duplicate</button>' +
      '<button type="button" data-action="retire" data-id="' + id + '">Retire</button>' +
      '<hr/><button type="button" data-action="delete" data-id="' + id + '" class="danger"' + deleteAttrs + '>Delete</button>' +
      '</div></div>';
  }

  function renderViewToggle() {
    viewTableBtn.classList.toggle("btn-primary", state.viewMode === "table");
    viewCardBtn.classList.toggle("btn-primary", state.viewMode === "card");
    viewTableBtn.classList.toggle("btn-ghost", state.viewMode !== "table");
    viewCardBtn.classList.toggle("btn-ghost", state.viewMode !== "card");
  }

  function render(rows) {
    state.all = loadAll();
    refreshFilterOptions();
    renderViewToggle();

    if (!rows) rows = state.all.filter(rowMatches);

    if (!rows.length) {
      tableWrapEl.style.display = state.viewMode === "table" ? "block" : "none";
      cardWrapEl.style.display = state.viewMode === "card" ? "grid" : "none";
      listEl.innerHTML = "";
      cardWrapEl.innerHTML = "";
      emptyEl.style.display = "block";
      emptyEl.textContent = state.all.length ? "No matches for the current filters." : "No master designs yet. Click “Add Master Design” to create one.";
      return;
    }

    emptyEl.style.display = "none";
    tableWrapEl.style.display = state.viewMode === "table" ? "block" : "none";
    cardWrapEl.style.display = state.viewMode === "card" ? "grid" : "none";

    listEl.innerHTML = rows.map(function (row) {
      return "<tr>" +
        "<td>" + esc(row.masterId) + "</td>" +
        '<td class="cell-dim">' + esc(row.styleCode || "") + "</td>" +
        "<td>" + esc(row.designName || "") + "</td>" +
        '<td class="cell-dim">' + esc(row.collection || "") + "</td>" +
        '<td class="cell-dim">' + esc(row.category || "") + "</td>" +
        '<td class="cell-dim">' + esc(row.type || "") + "</td>" +
        "<td>" + esc(centerStoneSummaryText(row)) + "</td>" +
        "<td>" + App.badge(row.status) + "</td>" +
        '<td class="cell-dim">' + esc(formatLastUpdated(row.lastUpdated)) + "</td>" +
        '<td class="actions-cell">' + actionMenuHtml(row) + "</td>" +
        "</tr>";
    }).join("");

    cardWrapEl.innerHTML = rows.map(function (row) {
      var sg = stoneGroupsCardSummary(row).map(function (line) { return "<li>" + esc(line) + "</li>"; }).join("");
      return '<article class="master-card">' +
        '<div class="master-card-top"><div><div class="master-card-id">' + esc(row.masterId) + '</div><h3>' + esc(row.designName || "") + '</h3><p>' + esc(row.styleCode || "") + '</p></div>' + App.badge(row.status) + '</div>' +
        '<div class="master-card-meta">' +
          '<p><strong>Collection:</strong> ' + esc(row.collection || "") + '</p>' +
          '<p><strong>Category:</strong> ' + esc(row.category || "") + '</p>' +
          '<p><strong>Type:</strong> ' + esc(row.type || "") + '</p>' +
          '<p><strong>Center Stone:</strong> ' + esc(centerStoneSummaryText(row)) + '</p>' +
          '<div><strong>Stone Groups:</strong><ul>' + sg + '</ul></div>' +
          '<p><strong>Last Updated:</strong> ' + esc(formatLastUpdated(row.lastUpdated)) + '</p>' +
        '</div>' +
        '<div class="master-card-actions">' +
          '<button class="btn btn-sm" data-action="edit" data-id="' + esc(row.masterId) + '">Open/Edit</button>' +
          '<button class="btn btn-sm" data-action="duplicate" data-id="' + esc(row.masterId) + '">Duplicate</button>' +
          '<button class="btn btn-sm btn-danger" data-action="retire" data-id="' + esc(row.masterId) + '">Retire/Delete</button>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function renderCenterStoneEditor(c) {
    var html = field("Has Center Stone", selectFieldHtml("centerStone.required", c.required === false ? "No" : "Yes", OPTIONS.yesNo, false));
    if (c.required === false) return html;

    html += field("Number of Center Stones", selectFieldHtml("centerStone.count", String(c.count || 1), [{ value: "1", label: "1" }, { value: "2", label: "2" }], false));
    for (var i = 0; i < (c.count || 1); i++) {
      var s = c.stones[i] || blankCenterStoneEntry(i);
      html += '<div class="full nested-block">' +
        '<h4>Center Stone ' + (i + 1) + '</h4>' +
        '<div class="repeater-fields">' +
        field("Center Stone Label", selectFieldHtml("centerStone.stones." + i + ".label", s.label, OPTIONS.centerLabel, false)) +
        field("Custom Label", inputFieldHtml("centerStone.stones." + i + ".customLabel", s.customLabel)) +
        field("Shape", selectFieldHtml("centerStone.stones." + i + ".shape", s.shape, OPTIONS.centerShape, true)) +
        field("Size Logic", selectFieldHtml("centerStone.stones." + i + ".sizeLogic", s.sizeLogic, OPTIONS.centerSizeLogic, true)) +
        field("Carat Weight", inputFieldHtml("centerStone.stones." + i + ".carat", s.carat)) +
        field("Millimeter Size", inputFieldHtml("centerStone.stones." + i + ".millimeter", s.millimeter)) +
        field("Setting Style", selectFieldHtml("centerStone.stones." + i + ".settingStyle", s.settingStyle, OPTIONS.centerSettingStyle, true)) +
        field("Number of Prongs", selectFieldHtml("centerStone.stones." + i + ".prongCount", s.prongCount, OPTIONS.prongCount, true)) +
        field("Notes", textareaFieldHtml("centerStone.stones." + i + ".notes", s.notes), { full: true }) +
        '</div></div>';
    }
    return html;
  }

  function renderStoneGroups() {
    var groups = state.draft.stoneGroups || [];
    var items = groups.map(function (g, i) {
      var ranges = (g.sizeRanges || []).map(function (r, j) {
        return '<div class="size-range-row">' +
          inputFieldHtml("stoneGroups." + i + ".sizeRanges." + j + ".fromSize", r.fromSize) +
          inputFieldHtml("stoneGroups." + i + ".sizeRanges." + j + ".toSize", r.toSize) +
          inputFieldHtml("stoneGroups." + i + ".sizeRanges." + j + ".stoneCount", r.stoneCount, { type: "number", step: "1" }) +
          inputFieldHtml("stoneGroups." + i + ".sizeRanges." + j + ".notes", r.notes) +
          '<button type="button" class="btn btn-sm" data-action="range-up" data-group="' + i + '" data-index="' + j + '">↑</button>' +
          '<button type="button" class="btn btn-sm" data-action="range-down" data-group="' + i + '" data-index="' + j + '">↓</button>' +
          '<button type="button" class="btn btn-sm btn-danger" data-action="remove-range" data-group="' + i + '" data-index="' + j + '">Delete</button>' +
        '</div>';
      }).join("");

      return '<div class="repeater-item" data-index="' + i + '">' +
        '<div class="repeater-item-header"><h4>Stone Group ' + (i + 1) + '</h4><div>' +
        '<button type="button" class="btn btn-sm" data-action="group-up" data-index="' + i + '">↑</button> ' +
        '<button type="button" class="btn btn-sm" data-action="group-down" data-index="' + i + '">↓</button> ' +
        '<button type="button" class="btn btn-sm btn-danger" data-action="remove-stone-group" data-index="' + i + '">Remove</button></div></div>' +
        '<div class="repeater-fields">' +
          field("Group Name", inputFieldHtml("stoneGroups." + i + ".groupName", g.groupName)) +
          field("Stone Category", selectFieldHtml("stoneGroups." + i + ".stoneCategory", g.stoneCategory, OPTIONS.stoneCategory, true)) +
          field("Shape", selectFieldHtml("stoneGroups." + i + ".shape", g.shape, OPTIONS.stoneShape, true)) +
          field("Stone Size MM", inputFieldHtml("stoneGroups." + i + ".sizeMm", g.sizeMm)) +
          field("Carat Weight", inputFieldHtml("stoneGroups." + i + ".caratWeight", g.caratWeight)) +
          field("Quality Default", inputFieldHtml("stoneGroups." + i + ".qualityDefault", g.qualityDefault)) +
          field("Setting Style", selectFieldHtml("stoneGroups." + i + ".settingStyle", g.settingStyle, OPTIONS.stoneSettingStyle, true)) +
          field("Required", selectFieldHtml("stoneGroups." + i + ".required", g.required || "No", OPTIONS.yesNo, false)) +
          field("Count Logic", selectFieldHtml("stoneGroups." + i + ".countLogic", g.countLogic || "Fixed Count", OPTIONS.stoneCountLogic, false)) +
          ((g.countLogic || "Fixed Count") === "Fixed Count" ? field("Fixed Stone Count", inputFieldHtml("stoneGroups." + i + ".fixedCount", g.fixedCount, { type: "number", step: "1" })) : "") +
          ((g.countLogic || "") === "Count by Finger Size Range" ? '<div class="full"><label>Size Ranges (From, To, Count, Notes)</label><div class="size-ranges">' + ranges + '</div><button type="button" class="btn btn-sm" data-action="add-range" data-group="' + i + '">+ Add Range</button></div>' : "") +
          field("Notes", textareaFieldHtml("stoneGroups." + i + ".notes", g.notes), { full: true }) +
        '</div></div>';
    }).join("");

    return '<div class="repeater">' + items + '<button type="button" class="btn btn-sm repeater-add" data-action="add-stone-group">+ Add stone group</button></div>';
  }

  function renderChangeLog() {
    var entries = state.draft.changeLog || [];
    var items = entries.map(function (e, i) {
      return '<div class="repeater-item"><div class="repeater-item-header"><h4>Entry ' + (i + 1) + '</h4><button type="button" class="btn btn-sm btn-danger" data-action="remove-change-log" data-index="' + i + '">Remove</button></div><div class="repeater-fields">' +
        field("Change Date", inputFieldHtml("changeLog." + i + ".changeDate", e.changeDate, { type: "date" })) +
        field("Changed By", inputFieldHtml("changeLog." + i + ".changedBy", e.changedBy)) +
        field("Change Type", selectFieldHtml("changeLog." + i + ".changeType", e.changeType, OPTIONS.changeType, true)) +
        field("Description", textareaFieldHtml("changeLog." + i + ".changeDescription", e.changeDescription), { full: true }) +
        field("Previous Value", inputFieldHtml("changeLog." + i + ".previousValue", e.previousValue)) +
        field("New Value", inputFieldHtml("changeLog." + i + ".newValue", e.newValue)) +
      '</div></div>';
    }).join("");
    return '<div class="repeater">' + items + '<button type="button" class="btn btn-sm repeater-add" data-action="add-change-log">+ Add change log entry</button></div>';
  }

  function buildForm() {
    var d = state.draft;
    var sp = d.designSpecs || {};
    var mn = d.manufacturing || {};
    var cl = d.costingLinks || {};
    var fi = d.files || {};
    var html = "";

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

    html += section("2. Status and Approval",
      field("Status", selectFieldHtml("status", d.status, OPTIONS.status, false)) +
      field("Approval Required", selectFieldHtml("approvalRequired", d.approvalRequired, OPTIONS.yesNo, false)) +
      field("Approved By", inputFieldHtml("approvedBy", d.approvedBy)) +
      field("Approval Date", inputFieldHtml("approvalDate", d.approvalDate, { type: "date" })) +
      field("Review Notes", textareaFieldHtml("reviewNotes", d.reviewNotes), { full: true }) +
      field("Exception Notes", textareaFieldHtml("exceptionNotes", d.exceptionNotes), { full: true })
    );

    html += section("3. Center Stone Rules", renderCenterStoneEditor(d.centerStone));
    html += section("4. Stone Groups", renderStoneGroups(), "Each group supports fixed count or finger-size ranges.");

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

    html += section("6. Manufacturing Rules",
      field("Production Method", selectFieldHtml("manufacturing.productionMethod", mn.productionMethod, OPTIONS.productionMethod, true)) +
      field("Approved Factories", inputFieldHtml("manufacturing.approvedFactories", mn.approvedFactories), { full: true }) +
      field("Factory Restrictions", textareaFieldHtml("manufacturing.factoryRestrictions", mn.factoryRestrictions), { full: true }) +
      field("Master Availability", selectFieldHtml("manufacturing.masterAvailability", mn.masterAvailability, OPTIONS.masterAvailability, true)) +
      field("Complexity Level", selectFieldHtml("manufacturing.complexityLevel", mn.complexityLevel, OPTIONS.complexityLevel, true)) +
      field("Production Notes", textareaFieldHtml("manufacturing.productionNotes", mn.productionNotes), { full: true })
    );

    var labourTemplates = (Storage.load("labourCostTemplates") || []).map(function (t) { return { value: t.id, label: t.id + " - " + (t.templateName || "") }; });
    html += section("7. Costing Links",
      field("Labour Cost Template ID", labourTemplates.length ? selectFieldHtml("costingLinks.labourCostTemplateId", cl.labourCostTemplateId, labourTemplates, true) : inputFieldHtml("costingLinks.labourCostTemplateId", cl.labourCostTemplateId)) +
      field("Stone Cost Rule ID", inputFieldHtml("costingLinks.stoneCostRuleId", cl.stoneCostRuleId)) +
      field("Metal Weight Basis", selectFieldHtml("costingLinks.metalWeightBasis", cl.metalWeightBasis, OPTIONS.metalWeightBasis, true)) +
      field("Estimated Base Weight", inputFieldHtml("costingLinks.estimatedBaseWeight", cl.estimatedBaseWeight, { type: "number", step: "0.01" })) +
      field("Costing Status", selectFieldHtml("costingLinks.costingStatus", cl.costingStatus, OPTIONS.costingStatus, true)) +
      field("Weight Notes", textareaFieldHtml("costingLinks.weightNotes", cl.weightNotes), { full: true })
    );

    html += section("8. Files and Media",
      field("Thumbnail Image URL", inputFieldHtml("files.thumbnailUrl", fi.thumbnailUrl), { full: true }) +
      field("CAD File URL", inputFieldHtml("files.cadFileUrl", fi.cadFileUrl), { full: true }) +
      field("STL/3DM File URL", inputFieldHtml("files.stl3dmFileUrl", fi.stl3dmFileUrl), { full: true }) +
      field("Render Image URL", inputFieldHtml("files.renderImageUrl", fi.renderImageUrl), { full: true }) +
      field("Wax Photo URL", inputFieldHtml("files.waxPhotoUrl", fi.waxPhotoUrl), { full: true }) +
      field("Production Sample Photo URL", inputFieldHtml("files.productionSamplePhotoUrl", fi.productionSamplePhotoUrl), { full: true }) +
      field("Spec Sheet URL", inputFieldHtml("files.specSheetUrl", fi.specSheetUrl), { full: true })
    );

    html += section("9. Change Log", renderChangeLog());
    sectionsHolder.innerHTML = html;
  }

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
    var data = JSON.parse(JSON.stringify(state.draft));
    var inputs = sectionsHolder.querySelectorAll("input[name], select[name], textarea[name]");
    inputs.forEach(function (el) {
      var name = el.getAttribute("name");
      if (!name) return;
      setByPath(data, name, el.value);
    });

    var tagBoxes = sectionsHolder.querySelectorAll(".tag-input[data-tag-name]");
    tagBoxes.forEach(function (box) {
      var name = box.getAttribute("data-tag-name");
      var chips = box.querySelectorAll(".chip");
      var values = Array.prototype.map.call(chips, function (c) {
        return c.firstChild ? String(c.firstChild.textContent || "").trim() : "";
      }).filter(Boolean);
      setByPath(data, name, values);
    });

    data = migrateRecord(data);
    data.centerStone.required = data.centerStone.required !== false && data.centerStone.required !== "No";
    data.centerStone.count = Number(data.centerStone.count) === 2 ? 2 : 1;
    while (data.centerStone.stones.length < data.centerStone.count) data.centerStone.stones.push(blankCenterStoneEntry(data.centerStone.stones.length));
    data.centerStone.stones = data.centerStone.stones.slice(0, 2);

    return data;
  }

  function validateRecord(data) {
    if (!data.masterId || !String(data.masterId).trim()) data.masterId = nextMasterId();
    var requiredFields = ["designName", "collection", "category", "type"];
    for (var i = 0; i < requiredFields.length; i++) {
      var key = requiredFields[i];
      if (!data[key] || !String(data[key]).trim()) return key + " is required.";
    }

    if (data.centerStone.required) {
      var stones = data.centerStone.stones.slice(0, data.centerStone.count || 1);
      if (!stones.some(function (s) { return s.shape && String(s.shape).trim(); })) {
        return "If Has Center Stone is Yes, at least one center stone must have a shape.";
      }
    }

    for (var g = 0; g < data.stoneGroups.length; g++) {
      var group = data.stoneGroups[g];
      if (group.countLogic === "Fixed Count") {
        if (group.fixedCount === "" || group.fixedCount === null || group.fixedCount === undefined) return "Stone Group " + (g + 1) + ": Fixed Stone Count is required.";
      }
      if (group.countLogic === "Count by Finger Size Range") {
        if (!Array.isArray(group.sizeRanges) || !group.sizeRanges.length) return "Stone Group " + (g + 1) + ": at least one size range is required.";
        for (var r = 0; r < group.sizeRanges.length; r++) {
          var range = group.sizeRanges[r];
          if (range.fromSize === "" || range.toSize === "" || range.stoneCount === "") return "Stone Group " + (g + 1) + ", Range " + (r + 1) + ": From Size, To Size, and Stone Count are required.";
          if (Number(range.fromSize) >= Number(range.toSize)) return "Stone Group " + (g + 1) + ", Range " + (r + 1) + ": From Size must be smaller than To Size.";
        }
      }
    }
    return "";
  }

  function saveRecord(record) {
    record.lastUpdated = nowIso();
    if (state.editingId) Storage.update(STORE_KEY, ID_FIELD, state.editingId, record);
    else Storage.add(STORE_KEY, record);
  }

  function openDialog(mode, record) {
    state.editingId = record ? record[ID_FIELD] : null;
    state.draft = record ? migrateRecord(JSON.parse(JSON.stringify(record))) : blankRecord();
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

  function duplicateRecord(record) {
    var copy = JSON.parse(JSON.stringify(record));
    copy.masterId = nextMasterId();
    copy.styleCode = (copy.styleCode || "") + "-COPY";
    copy.designName = (copy.designName || "") + " (Copy)";
    copy.status = "Draft";
    copy.lastUpdated = nowIso();
    Storage.add(STORE_KEY, copy);
    return copy;
  }

  function deleteRecord(record) {
    if (linkedProductCount(record.masterId) > 0) {
      alert("Cannot delete: products reference this master design.");
      return;
    }
    if (confirm("Delete master design " + record.masterId + "?")) {
      Storage.remove(STORE_KEY, ID_FIELD, record.masterId);
      render();
    }
  }

  function handleAction(action, id) {
    var record = findById(id);
    if (action === "toggle-menu") {
      state.openMenuId = state.openMenuId === id ? null : id;
      render();
      return;
    }
    if (!record) return;
    state.openMenuId = null;

    if (action === "edit") openDialog("edit", record);
    else if (action === "duplicate") {
      var copy = duplicateRecord(record);
      render();
      alert("Duplicated as " + copy.masterId + ".");
    } else if (action === "retire") {
      if (confirm("Retire this master? Click Cancel to delete instead.")) {
        record.status = "Retired";
        record.lastUpdated = nowIso();
        Storage.update(STORE_KEY, ID_FIELD, record.masterId, record);
        render();
      } else {
        deleteRecord(record);
      }
    } else if (action === "delete") deleteRecord(record);
  }

  addBtn.addEventListener("click", function () { openDialog("add", null); });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset Master Designs back to sample data?")) {
        Storage.reset(STORE_KEY);
        render();
      }
    });
  }

  [
    [filterStatus, "status"],
    [filterCollection, "collection"],
    [filterCategory, "category"],
    [filterType, "type"],
    [filterCenterShape, "centerShape"]
  ].forEach(function (pair) {
    pair[0].addEventListener("change", function () {
      state.filter[pair[1]] = pair[0].value;
      saveUiState();
      render();
    });
  });

  searchEl.addEventListener("input", App.debounce(function () {
    state.filter.search = searchEl.value;
    saveUiState();
    render();
  }, 80));

  viewTableBtn.addEventListener("click", function () { state.viewMode = "table"; saveUiState(); render(); });
  viewCardBtn.addEventListener("click", function () { state.viewMode = "card"; saveUiState(); render(); });

  clearFiltersBtn.addEventListener("click", function () {
    state.filter = { search: "", status: "", collection: "", category: "", type: "", centerShape: "" };
    searchEl.value = "";
    filterStatus.value = "";
    saveUiState();
    render();
  });

  cancelBtn.addEventListener("click", function () { closeDialog(); });

  [listEl, cardWrapEl].forEach(function (el) {
    el.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn) return;
      handleAction(btn.getAttribute("data-action"), btn.getAttribute("data-id"));
    });
  });

  document.addEventListener("click", function (e) {
    if (!state.openMenuId || e.target.closest(".action-menu")) return;
    state.openMenuId = null;
    render();
  });

  sectionsHolder.addEventListener("change", function (e) {
    var t = e.target;
    if (!t.name) return;
    if (t.name === "centerStone.required" || t.name === "centerStone.count" || /stoneGroups\.\d+\.countLogic/.test(t.name)) {
      state.draft = readForm();
      buildForm();
    }
  });

  sectionsHolder.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (btn) {
      state.draft = readForm();
      var action = btn.getAttribute("data-action");
      var idx = Number(btn.getAttribute("data-index"));
      var groupIdx = Number(btn.getAttribute("data-group"));
      if (action === "add-stone-group") state.draft.stoneGroups.push(blankStoneGroup());
      else if (action === "remove-stone-group") state.draft.stoneGroups.splice(idx, 1);
      else if (action === "group-up" && idx > 0) {
        var g = state.draft.stoneGroups.splice(idx, 1)[0];
        state.draft.stoneGroups.splice(idx - 1, 0, g);
      } else if (action === "group-down" && idx < state.draft.stoneGroups.length - 1) {
        var g2 = state.draft.stoneGroups.splice(idx, 1)[0];
        state.draft.stoneGroups.splice(idx + 1, 0, g2);
      } else if (action === "add-range") {
        state.draft.stoneGroups[groupIdx].sizeRanges.push(blankStoneRange());
      } else if (action === "remove-range") {
        state.draft.stoneGroups[groupIdx].sizeRanges.splice(idx, 1);
      } else if (action === "range-up" && idx > 0) {
        var ranges = state.draft.stoneGroups[groupIdx].sizeRanges;
        var r = ranges.splice(idx, 1)[0];
        ranges.splice(idx - 1, 0, r);
      } else if (action === "range-down") {
        var ranges2 = state.draft.stoneGroups[groupIdx].sizeRanges;
        if (idx < ranges2.length - 1) {
          var r2 = ranges2.splice(idx, 1)[0];
          ranges2.splice(idx + 1, 0, r2);
        }
      } else if (action === "add-change-log") state.draft.changeLog.push(blankChangeLogEntry());
      else if (action === "remove-change-log") state.draft.changeLog.splice(idx, 1);
      buildForm();
      return;
    }

    var rmTag = e.target.closest("button[data-remove-tag]");
    if (rmTag) {
      var chip = rmTag.closest(".chip");
      if (chip) chip.remove();
    }
  });

  sectionsHolder.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var input = e.target;
    if (!input.matches || !input.matches(".tag-input input[data-tag-input]")) return;
    e.preventDefault();
    var v = input.value.trim();
    if (!v) return;
    var box = input.parentNode;
    var existing = Array.prototype.map.call(box.querySelectorAll(".chip"), function (c) {
      return c.firstChild ? String(c.firstChild.textContent || "").trim() : "";
    });
    if (existing.indexOf(v) === -1) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.appendChild(document.createTextNode(v + " "));
      var rm = document.createElement("button");
      rm.type = "button";
      rm.setAttribute("data-remove-tag", v);
      rm.textContent = "×";
      chip.appendChild(rm);
      box.insertBefore(chip, input);
    }
    input.value = "";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = readForm();
    var err = validateRecord(data);
    if (err) {
      alert(err);
      return;
    }
    saveRecord(data);
    closeDialog();
    render();
  });

  searchEl.value = state.filter.search || "";
  filterStatus.value = state.filter.status || "";
  render();
})();
