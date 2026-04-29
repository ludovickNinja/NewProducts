/* Master Designs module
 *
 * Source-of-truth library for parent jewelry design templates. A Master
 * Design is not a final SKU; Products reference a Master Design via
 * `relatedMasterId`.
 *
 * Records are stored in localStorage under "masterDesigns" with a nested
 * structure (centerStone, designSpecs, manufacturing, costingLinks, files,
 * plus stoneGroups[] and changeLog[] arrays). Metal/karat/color/finish
 * rules deliberately do NOT live on a Master Design — they belong to the
 * downstream Product Creation Matrix workflow. Legacy `metalRules` and the
 * flat `centerStone` shape are migrated on read for backward compatibility.
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
    centerStoneCount: ["1", "2"],
    centerStoneLabel: ["Center Stone 1", "Center Stone 2", "Main Stone", "Secondary Center Stone"],
    centerShape: ["Round", "Oval", "Cushion", "Emerald", "Pear", "Marquise", "Princess", "Radiant", "Baguette", "Trillion", "Heart", "Asscher", "Custom"],
    centerSizeLogic: ["Fixed Size", "Size Range", "Custom Per Order"],
    centerSettingStyle: ["Prong", "Bezel", "Basket", "Cathedral", "Peg Head", "Semi-Bezel", "Tension-Style", "Flush", "Custom"],
    prongCount: ["0", "2", "3", "4", "5", "6", "8", "Other"],
    stoneCategory: ["Diamond", "Lab Diamond", "Gemstone", "Moissanite", "Other"],
    stoneShape: ["Round", "Oval", "Cushion", "Emerald", "Pear", "Marquise", "Princess", "Radiant", "Baguette", "Tapered Baguette", "Trillion", "Custom"],
    stoneGroupSettingStyle: ["Pavé", "Shared Prong", "Channel", "Bezel", "Burnish", "Fishtail", "Flush", "Prong", "Custom"],
    countLogic: ["Fixed Count", "Count by Finger Size Range", "Count by Length/Dimension", "Custom / Manual"],
    sizingRule: ["Standard Sizing", "Limited Sizing", "Not Sizable", "Size Affects Stone Count"],
    productionMethod: ["Casting", "CNC", "Hand Fabrication", "Hybrid"],
    masterAvailability: ["Internal Only", "Selected Factories", "All Approved Factories"],
    complexityLevel: ["Simple", "Standard", "Complex", "High Risk"],
    metalWeightBasis: ["Estimated Weight", "Confirmed Weight", "Formula-Based"],
    costingStatus: ["Missing", "Estimated", "Confirmed", "Needs Review"],
    changeType: ["CAD Update", "Stone Update", "Factory Update", "Approval Update", "Costing Update", "Specification Update"]
  };

  var STORE_KEY = "masterDesigns";
  var ID_FIELD = "masterId";
  var VIEW_LS_KEY = "newproducts:masterDesigns:viewMode";
  var FILTER_LS_KEY = "newproducts:masterDesigns:filters";
  var esc = App.escapeHtml;

  /* ---------- Migration helpers ----------
   * Old records may carry a flat centerStone (with hasCenterStone, shape,
   * carat, ...), a metalRules block, or stoneGroups with `quantity`. We
   * normalise them on read so the rest of the module only sees the new shape.
   */
  function migrateCenterStone(cs) {
    if (!cs) return { required: false, count: 1, stones: [] };
    if (Array.isArray(cs.stones)) {
      var count = Number(cs.count) === 2 ? 2 : 1;
      var stones = cs.stones.slice(0, count).map(function (s) {
        return {
          label: s.label || "",
          shape: s.shape || "",
          sizeLogic: s.sizeLogic || "",
          carat: s.carat === undefined || s.carat === null ? "" : s.carat,
          millimeter: s.millimeter || s.millimeterSize || "",
          settingStyle: s.settingStyle || "",
          prongCount: s.prongCount || s.numberOfProngs || "",
          notes: s.notes || ""
        };
      });
      return {
        required: cs.required === false ? false : (cs.required === true || stones.length > 0),
        count: count,
        stones: stones
      };
    }
    if (cs.hasCenterStone === "No") {
      return { required: false, count: 1, stones: [] };
    }
    return {
      required: true,
      count: 1,
      stones: [{
        label: "Center Stone 1",
        shape: cs.shape || "",
        sizeLogic: cs.sizeLogic || "",
        carat: cs.carat === undefined || cs.carat === null ? "" : cs.carat,
        millimeter: cs.millimeterSize || cs.millimeter || "",
        settingStyle: cs.settingStyle || "",
        prongCount: cs.numberOfProngs || cs.prongCount || "",
        notes: cs.notes || ""
      }]
    };
  }

  function migrateStoneGroup(g) {
    if (!g) return blankStoneGroup();
    var isNew = g.countLogic !== undefined || Array.isArray(g.sizeRanges);
    if (isNew) {
      return {
        groupName: g.groupName || "",
        stoneCategory: g.stoneCategory || "",
        shape: g.shape || "",
        sizeMm: g.sizeMm || "",
        caratWeight: g.caratWeight === undefined || g.caratWeight === null ? "" : g.caratWeight,
        qualityDefault: g.qualityDefault || "",
        settingStyle: g.settingStyle || "",
        required: g.required === true || g.required === "Yes",
        countLogic: g.countLogic || "Fixed Count",
        fixedCount: g.fixedCount === undefined || g.fixedCount === null ? "" : g.fixedCount,
        sizeRanges: Array.isArray(g.sizeRanges) ? g.sizeRanges.map(function (r) {
          return {
            fromSize: r.fromSize || "",
            toSize: r.toSize || "",
            stoneCount: r.stoneCount === undefined || r.stoneCount === null ? "" : r.stoneCount,
            notes: r.notes || ""
          };
        }) : [],
        notes: g.notes || ""
      };
    }
    return {
      groupName: g.groupName || "",
      stoneCategory: g.stoneCategory || "",
      shape: g.shape || "",
      sizeMm: g.sizeMm || "",
      caratWeight: g.caratWeight === undefined || g.caratWeight === null ? "" : g.caratWeight,
      qualityDefault: g.qualityDefault || "",
      settingStyle: g.settingStyle || "",
      required: g.required === true || g.required === "Yes",
      countLogic: "Fixed Count",
      fixedCount: g.quantity === undefined || g.quantity === null ? "" : g.quantity,
      sizeRanges: [],
      notes: g.notes || ""
    };
  }

  function migrateRecord(r) {
    if (!r) return r;
    var copy = Object.assign({}, r);
    copy.centerStone = migrateCenterStone(r.centerStone);
    copy.stoneGroups = (Array.isArray(r.stoneGroups) ? r.stoneGroups : []).map(migrateStoneGroup);
    // metalRules is intentionally dropped from the working object. It may
    // still exist in storage on legacy records; we ignore it on render.
    delete copy.metalRules;
    return copy;
  }

  /* ---------- Helpers ---------- */
  function loadAll() {
    var list = Storage.load(STORE_KEY);
    if (!Array.isArray(list)) return [];
    return list.map(migrateRecord);
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
        required: false,
        count: 1,
        stones: []
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

  function blankStoneGroup() {
    return {
      groupName: "",
      stoneCategory: "",
      shape: "",
      sizeMm: "",
      caratWeight: "",
      qualityDefault: "",
      settingStyle: "",
      required: false,
      countLogic: "Fixed Count",
      fixedCount: "",
      sizeRanges: [],
      notes: ""
    };
  }

  function blankSizeRange() {
    return { fromSize: "", toSize: "", stoneCount: "", notes: "" };
  }

  function blankCenterStoneItem(label) {
    return {
      label: label || "Center Stone 1",
      shape: "",
      sizeLogic: "",
      carat: "",
      millimeter: "",
      settingStyle: "",
      prongCount: "",
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
  var cardsEl = document.getElementById("view-cards");
  var cardsEmptyEl = document.getElementById("cards-empty");
  var tableWrap = document.getElementById("view-table");
  var viewToggleBtns = document.querySelectorAll(".view-toggle-btn");
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

  function loadStoredViewMode() {
    try {
      var v = localStorage.getItem(VIEW_LS_KEY);
      return v === "card" ? "card" : "table";
    } catch (e) { return "table"; }
  }
  function saveViewMode(mode) {
    try { localStorage.setItem(VIEW_LS_KEY, mode); } catch (e) {}
  }
  function loadStoredFilters() {
    try {
      var raw = localStorage.getItem(FILTER_LS_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) { return null; }
  }
  function saveFilters(filter) {
    try { localStorage.setItem(FILTER_LS_KEY, JSON.stringify(filter)); } catch (e) {}
  }

  var defaultFilter = { search: "", status: "", collection: "", category: "", type: "", centerShape: "" };
  var storedFilter = loadStoredFilters();

  var state = {
    all: [],
    filter: Object.assign({}, defaultFilter, storedFilter || {}),
    viewMode: loadStoredViewMode(),
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
      var stones = (row.centerStone && Array.isArray(row.centerStone.stones)) ? row.centerStone.stones : [];
      if (!stones.some(function (s) { return s.shape === f.centerShape; })) return false;
    }
    return true;
  }

  /* ---------- Summaries ---------- */
  function formatCenterStoneItem(s) {
    var bits = [];
    if (s.shape) bits.push(s.shape);
    if (s.carat !== "" && s.carat !== undefined && s.carat !== null) bits.push(s.carat + "ct");
    else if (s.millimeter) bits.push(s.millimeter + "mm");
    var setting = "";
    if (s.prongCount && s.prongCount !== "0" && s.prongCount !== "Other") setting = s.prongCount + " Prong";
    if (s.settingStyle) setting = setting ? setting + " " + s.settingStyle : s.settingStyle;
    if (setting) bits.push(setting);
    return bits.join(" · ");
  }

  function centerStoneSummary(row) {
    var c = row.centerStone || {};
    if (!c.required || !Array.isArray(c.stones) || c.stones.length === 0) {
      return '<span class="cell-dim">None</span>';
    }
    if (c.stones.length === 1) {
      var first = formatCenterStoneItem(c.stones[0]);
      return first ? esc(first) : '<span class="cell-dim">&mdash;</span>';
    }
    var simple = c.stones.map(function (s) {
      var parts = [];
      if (s.shape) parts.push(s.shape);
      if (s.carat !== "" && s.carat !== undefined && s.carat !== null) parts.push(s.carat + "ct");
      return parts.join(" ");
    }).filter(Boolean).join(" + ");
    return esc(c.stones.length + " stones · " + simple);
  }

  function stoneGroupShortSummary(g) {
    var detail = [];
    if (g.shape) detail.push(g.shape);
    if (g.sizeMm) detail.push(g.sizeMm + "mm");
    var tail;
    if (g.countLogic === "Count by Finger Size Range") {
      tail = "count by finger size";
    } else if (g.countLogic === "Count by Length/Dimension") {
      tail = "count by dimension";
    } else if (g.countLogic === "Custom / Manual") {
      tail = "custom count";
    } else {
      tail = (g.fixedCount !== "" && g.fixedCount !== undefined && g.fixedCount !== null)
        ? g.fixedCount + " stones"
        : "fixed count";
    }
    var rhs = detail.length ? detail.join(" ") + " · " + tail : tail;
    return (g.groupName || "Group") + ": " + rhs;
  }

  function stoneGroupsSummary(row) {
    var groups = Array.isArray(row.stoneGroups) ? row.stoneGroups : [];
    if (groups.length === 0) return ["None"];
    var shown = groups.slice(0, 2).map(stoneGroupShortSummary);
    if (groups.length > 2) shown.push("+ " + (groups.length - 2) + " more groups");
    return shown;
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

    applyViewMode();

    var emptyMsg = state.all.length === 0
      ? "No master designs yet. Click “Add Master Design” to create one."
      : "No matches for the current filters.";

    if (rows.length === 0) {
      listEl.innerHTML = "";
      cardsEl.innerHTML = "";
      if (state.viewMode === "card") {
        emptyEl.style.display = "none";
        cardsEmptyEl.style.display = "block";
        cardsEmptyEl.textContent = emptyMsg;
      } else {
        cardsEmptyEl.style.display = "none";
        emptyEl.style.display = "block";
        emptyEl.textContent = emptyMsg;
      }
      return;
    }
    emptyEl.style.display = "none";
    cardsEmptyEl.style.display = "none";

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

    cardsEl.innerHTML = rows.map(cardHtml).join("");
  }

  /* ---------- Card view ---------- */
  function cardHtml(row) {
    var c = row.centerStone || {};
    var centerLine;
    if (!c.required || !Array.isArray(c.stones) || c.stones.length === 0) {
      centerLine = '<span class="cell-dim">None</span>';
    } else if (c.stones.length === 1) {
      var first = formatCenterStoneItem(c.stones[0]);
      centerLine = first ? esc(first) : '<span class="cell-dim">&mdash;</span>';
    } else {
      centerLine = c.stones.map(function (s) {
        return esc(formatCenterStoneItem(s) || s.label || "Stone");
      }).join("<br/>");
    }

    var groupLines = stoneGroupsSummary(row);
    var groupHtml = groupLines.map(function (line) {
      return line === "None"
        ? '<span class="cell-dim">None</span>'
        : esc(line);
    }).join("<br/>");

    var canDelete = linkedProductCount(row.masterId) === 0;
    var deleteAttrs = canDelete ? "" : ' disabled title="Cannot delete: products are linked to this master"';
    var idAttr = esc(row.masterId);

    return (
      '<div class="md-card" data-id="' + idAttr + '">' +
        '<div class="md-card-head">' +
          '<span class="md-card-id">' + esc(row.masterId) + "</span>" +
          App.badge(row.status) +
        "</div>" +
        '<h3 class="md-card-name">' + esc(row.designName || "") + "</h3>" +
        (row.styleCode ? '<div class="md-card-style cell-dim">' + esc(row.styleCode) + "</div>" : "") +
        '<dl class="md-card-meta">' +
          '<div><dt>Collection</dt><dd>' + esc(row.collection || "—") + "</dd></div>" +
          '<div><dt>Category</dt><dd>' + esc(row.category || "—") + "</dd></div>" +
          '<div><dt>Type</dt><dd>' + esc(row.type || "—") + "</dd></div>" +
        "</dl>" +
        '<div class="md-card-section"><strong>Center Stone:</strong> ' + centerLine + "</div>" +
        '<div class="md-card-section"><strong>Stone Groups:</strong> ' + groupHtml + "</div>" +
        '<footer class="md-card-foot">' +
          '<span class="cell-dim">Updated ' + esc(formatLastUpdated(row.lastUpdated) || "—") + "</span>" +
          '<div class="md-card-actions">' +
            '<button class="btn btn-sm" data-action="edit" data-id="' + idAttr + '">Edit</button>' +
            '<button class="btn btn-sm" data-action="duplicate" data-id="' + idAttr + '">Duplicate</button>' +
            '<button class="btn btn-sm btn-danger" data-action="retire" data-id="' + idAttr + '">Retire</button>' +
            '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + idAttr + '"' + deleteAttrs + ">Delete</button>" +
          "</div>" +
        "</footer>" +
      "</div>"
    );
  }

  function applyViewMode() {
    var mode = state.viewMode;
    if (tableWrap) tableWrap.style.display = mode === "card" ? "none" : "";
    if (cardsEl) cardsEl.style.display = mode === "card" ? "" : "none";
    Array.prototype.forEach.call(viewToggleBtns, function (btn) {
      var on = btn.getAttribute("data-view") === mode;
      btn.classList.toggle("btn-primary", on);
    });
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

  /* ---------- Center stone rendering ---------- */
  function renderCenterStoneItem(s, i) {
    var prefix = "centerStone.stones." + i + ".";
    return '<div class="repeater-item" data-center-stone="' + i + '">' +
      '<div class="repeater-item-header">' +
        "<h4>Center Stone " + (i + 1) + "</h4>" +
      "</div>" +
      '<div class="repeater-fields">' +
        field("Center Stone Label", inputFieldHtml(prefix + "label", s.label || ("Center Stone " + (i + 1)))) +
        field("Shape", selectFieldHtml(prefix + "shape", s.shape, OPTIONS.centerShape, true)) +
        field("Size Logic", selectFieldHtml(prefix + "sizeLogic", s.sizeLogic, OPTIONS.centerSizeLogic, true)) +
        field("Carat Weight", inputFieldHtml(prefix + "carat", s.carat, { type: "number", step: "0.01" })) +
        field("Millimeter Size", inputFieldHtml(prefix + "millimeter", s.millimeter)) +
        field("Setting Style", selectFieldHtml(prefix + "settingStyle", s.settingStyle, OPTIONS.centerSettingStyle, true)) +
        field("Number of Prongs", selectFieldHtml(prefix + "prongCount", s.prongCount, OPTIONS.prongCount, true)) +
        field("Notes", textareaFieldHtml(prefix + "notes", s.notes), { full: true }) +
      "</div>" +
    "</div>";
  }

  function renderCenterStone() {
    var c = state.draft.centerStone || { required: false, count: 1, stones: [] };
    var hasYesNo = c.required ? "Yes" : "No";
    var html = field("Has Center Stone", selectFieldHtml("centerStone.required", hasYesNo, OPTIONS.yesNo, false));
    if (!c.required) return html;
    html += field("Number of Center Stones", selectFieldHtml("centerStone.count", String(c.count || 1), OPTIONS.centerStoneCount, false));
    var count = Number(c.count) === 2 ? 2 : 1;
    var stones = Array.isArray(c.stones) ? c.stones.slice() : [];
    while (stones.length < count) stones.push(blankCenterStoneItem("Center Stone " + (stones.length + 1)));
    for (var i = 0; i < count; i++) {
      html += '<div class="full">' + renderCenterStoneItem(stones[i], i) + "</div>";
    }
    return html;
  }

  /* ---------- Repeater rendering ---------- */
  function renderSizeRanges(groupIdx, ranges) {
    var rows = (ranges || []).map(function (r, j) {
      var prefix = "stoneGroups." + groupIdx + ".sizeRanges." + j + ".";
      return '<div class="size-range-row" data-group="' + groupIdx + '" data-range="' + j + '">' +
        '<div><label>From Size</label>' + inputFieldHtml(prefix + "fromSize", r.fromSize) + "</div>" +
        '<div><label>To Size</label>' + inputFieldHtml(prefix + "toSize", r.toSize) + "</div>" +
        '<div><label>Stone Count</label>' + inputFieldHtml(prefix + "stoneCount", r.stoneCount, { type: "number", step: "1" }) + "</div>" +
        '<div><label>Notes</label>' + inputFieldHtml(prefix + "notes", r.notes) + "</div>" +
        '<button type="button" class="btn btn-sm btn-danger size-range-remove" data-action="remove-size-range" data-group="' + groupIdx + '" data-range="' + j + '">Remove</button>' +
      "</div>";
    }).join("");
    return '<div class="size-range-table" data-group="' + groupIdx + '">' +
      (rows || '<div class="cell-dim size-range-empty">No size ranges yet.</div>') +
      '<button type="button" class="btn btn-sm" data-action="add-size-range" data-group="' + groupIdx + '">+ Add range</button>' +
    "</div>";
  }

  function stoneGroupCountControlsHtml(g, i) {
    var prefix = "stoneGroups." + i + ".";
    var logic = g.countLogic || "Fixed Count";
    if (logic === "Fixed Count") {
      return field("Fixed Stone Count", inputFieldHtml(prefix + "fixedCount", g.fixedCount, { type: "number", step: "1" }));
    }
    if (logic === "Count by Finger Size Range") {
      return field("Size Ranges", renderSizeRanges(i, g.sizeRanges), { full: true });
    }
    // For Count by Length/Dimension or Custom / Manual we still surface the
    // notes field below; nothing special to render here yet.
    return "";
  }

  function renderStoneGroups() {
    var groups = state.draft.stoneGroups || [];
    var items = groups.map(function (g, i) {
      var prefix = "stoneGroups." + i + ".";
      return '<div class="repeater-item" data-repeater="stoneGroups" data-index="' + i + '">' +
        '<div class="repeater-item-header">' +
          "<h4>Stone Group " + (i + 1) + "</h4>" +
          '<button type="button" class="btn btn-sm btn-danger" data-action="remove-stone-group" data-index="' + i + '">Remove</button>' +
        "</div>" +
        '<div class="repeater-fields">' +
          field("Group Name", inputFieldHtml(prefix + "groupName", g.groupName)) +
          field("Stone Category", selectFieldHtml(prefix + "stoneCategory", g.stoneCategory, OPTIONS.stoneCategory, true)) +
          field("Shape", selectFieldHtml(prefix + "shape", g.shape, OPTIONS.stoneShape, true)) +
          field("Stone Size MM", inputFieldHtml(prefix + "sizeMm", g.sizeMm)) +
          field("Carat Weight", inputFieldHtml(prefix + "caratWeight", g.caratWeight, { type: "number", step: "0.001" })) +
          field("Quality Default", inputFieldHtml(prefix + "qualityDefault", g.qualityDefault)) +
          field("Setting Style", selectFieldHtml(prefix + "settingStyle", g.settingStyle, OPTIONS.stoneGroupSettingStyle, true)) +
          field("Required", selectFieldHtml(prefix + "required", g.required ? "Yes" : "No", OPTIONS.yesNo, false)) +
          field("Count Logic", selectFieldHtml(prefix + "countLogic", g.countLogic || "Fixed Count", OPTIONS.countLogic, false), { full: true }) +
          stoneGroupCountControlsHtml(g, i) +
          field("Notes", textareaFieldHtml(prefix + "notes", g.notes), { full: true }) +
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
    html += section("3. Center Stone Rules", renderCenterStone(),
      "Optional. Toggle off for fashion rings, bands, earrings, bracelets, charms, pendants, and other designs without a traditional center stone.");

    // 4. Stone Groups (repeater)
    html += section("4. Stone Groups", renderStoneGroups(), "Add one entry per halo, side-stone or accent stone group.");

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

    // 6. Manufacturing Rules
    var mn = d.manufacturing || {};
    html += section("6. Manufacturing Rules",
      field("Production Method", selectFieldHtml("manufacturing.productionMethod", mn.productionMethod, OPTIONS.productionMethod, true)) +
      field("Master Availability", selectFieldHtml("manufacturing.masterAvailability", mn.masterAvailability, OPTIONS.masterAvailability, true)) +
      field("Approved Factories", inputFieldHtml("manufacturing.approvedFactories", mn.approvedFactories), { full: true }) +
      field("Factory Restrictions", textareaFieldHtml("manufacturing.factoryRestrictions", mn.factoryRestrictions), { full: true }) +
      field("Complexity Level", selectFieldHtml("manufacturing.complexityLevel", mn.complexityLevel, OPTIONS.complexityLevel, true)) +
      field("Production Notes", textareaFieldHtml("manufacturing.productionNotes", mn.productionNotes), { full: true })
    );

    // 7. Costing Links
    var cl = d.costingLinks || {};
    var labourTemplates = (Storage.load("labourCostTemplates") || []).map(function (t) {
      return { value: t.id, label: t.id + " - " + (t.templateName || "") };
    });
    html += section("7. Costing Links",
      field("Labour Cost Template ID", labourTemplates.length
        ? selectFieldHtml("costingLinks.labourCostTemplateId", cl.labourCostTemplateId, labourTemplates, true)
        : inputFieldHtml("costingLinks.labourCostTemplateId", cl.labourCostTemplateId)) +
      field("Stone Cost Rule ID", inputFieldHtml("costingLinks.stoneCostRuleId", cl.stoneCostRuleId)) +
      field("Metal Weight Basis", selectFieldHtml("costingLinks.metalWeightBasis", cl.metalWeightBasis, OPTIONS.metalWeightBasis, true)) +
      field("Estimated Base Weight (g)", inputFieldHtml("costingLinks.estimatedBaseWeight", cl.estimatedBaseWeight, { type: "number", step: "0.01" })) +
      field("Costing Status", selectFieldHtml("costingLinks.costingStatus", cl.costingStatus, OPTIONS.costingStatus, true)) +
      field("Weight Notes", textareaFieldHtml("costingLinks.weightNotes", cl.weightNotes), { full: true })
    );

    // 8. Files and Media
    var fi = d.files || {};
    html += section("8. Files and Media",
      field("Thumbnail Image URL", inputFieldHtml("files.thumbnailUrl", fi.thumbnailUrl), { full: true }) +
      field("CAD File URL", inputFieldHtml("files.cadFileUrl", fi.cadFileUrl), { full: true }) +
      field("STL/3DM File URL", inputFieldHtml("files.stl3dmFileUrl", fi.stl3dmFileUrl), { full: true }) +
      field("Render Image URL", inputFieldHtml("files.renderImageUrl", fi.renderImageUrl), { full: true }) +
      field("Wax Photo URL", inputFieldHtml("files.waxPhotoUrl", fi.waxPhotoUrl), { full: true }) +
      field("Production Sample Photo URL", inputFieldHtml("files.productionSamplePhotoUrl", fi.productionSamplePhotoUrl), { full: true }) +
      field("Spec Sheet URL", inputFieldHtml("files.specSheetUrl", fi.specSheetUrl), { full: true })
    );

    // 9. Change Log
    html += section("9. Change Log", renderChangeLog());

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

    // Normalise center stone Yes/No -> boolean and clamp count.
    if (!data.centerStone) data.centerStone = { required: false, count: 1, stones: [] };
    var rawRequired = data.centerStone.required;
    data.centerStone.required = rawRequired === true || rawRequired === "Yes";
    var rawCount = Number(data.centerStone.count);
    data.centerStone.count = rawCount === 2 ? 2 : 1;
    if (!Array.isArray(data.centerStone.stones)) data.centerStone.stones = [];
    // Coerce numeric carat back to number when the input was empty/cleared.
    data.centerStone.stones = data.centerStone.stones.map(function (s) {
      return s || blankCenterStoneItem();
    });

    // Stone group required Yes/No -> boolean; coerce numeric counts.
    if (Array.isArray(data.stoneGroups)) {
      data.stoneGroups = data.stoneGroups.map(function (g) {
        if (!g) g = blankStoneGroup();
        g.required = g.required === true || g.required === "Yes";
        if (!Array.isArray(g.sizeRanges)) g.sizeRanges = [];
        g.sizeRanges = g.sizeRanges.map(function (r) {
          var count = r.stoneCount;
          if (count !== "" && count !== null && count !== undefined) {
            var n = Number(count);
            if (!isNaN(n)) count = n;
          }
          return {
            fromSize: r.fromSize || "",
            toSize: r.toSize || "",
            stoneCount: count === undefined ? "" : count,
            notes: r.notes || ""
          };
        });
        return g;
      });
    }

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
    var firstStone = (record.centerStone && Array.isArray(record.centerStone.stones))
      ? record.centerStone.stones[0]
      : null;
    var centerSize = "";
    if (firstStone && firstStone.carat !== "" && firstStone.carat !== undefined && firstStone.carat !== null) {
      centerSize = firstStone.carat + "ct";
    } else if (firstStone && firstStone.millimeter) {
      centerSize = firstStone.millimeter + "mm";
    }
    var newProduct = {
      sku: prefix + String(n).padStart(4, "0"),
      relatedMasterId: record.masterId,
      productName: record.designName || record.masterId,
      metal: "",
      color: "",
      karat: "",
      centerStoneSize: centerSize,
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

  function syncFiltersToInputs() {
    if (searchEl) searchEl.value = state.filter.search || "";
    if (filterStatus) filterStatus.value = state.filter.status || "";
  }

  function commitFilterChange() {
    saveFilters(state.filter);
    render();
  }

  searchEl.addEventListener("input", App.debounce(function () {
    state.filter.search = searchEl.value;
    commitFilterChange();
  }, 80));

  filterStatus.addEventListener("change", function () {
    state.filter.status = filterStatus.value;
    commitFilterChange();
  });
  filterCollection.addEventListener("change", function () {
    state.filter.collection = filterCollection.value;
    commitFilterChange();
  });
  filterCategory.addEventListener("change", function () {
    state.filter.category = filterCategory.value;
    commitFilterChange();
  });
  filterType.addEventListener("change", function () {
    state.filter.type = filterType.value;
    commitFilterChange();
  });
  filterCenterShape.addEventListener("change", function () {
    state.filter.centerShape = filterCenterShape.value;
    commitFilterChange();
  });

  clearFiltersBtn.addEventListener("click", function () {
    state.filter = Object.assign({}, defaultFilter);
    syncFiltersToInputs();
    commitFilterChange();
  });

  /* View toggle */
  Array.prototype.forEach.call(viewToggleBtns, function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-view") === "card" ? "card" : "table";
      if (state.viewMode === mode) return;
      state.viewMode = mode;
      saveViewMode(mode);
      render();
    });
  });

  /* Card click delegation: same actions as the table action menu. */
  cardsEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    handleRowAction(btn.getAttribute("data-action"), btn.getAttribute("data-id"));
  });

  cancelBtn.addEventListener("click", function () { closeDialog(); });

  /* Row clicks: edit / delete / workflow / menu toggle */
  function handleRowAction(action, id) {
    if (!action || !id) return;
    var record = findById(id);

    if (action === "toggle-menu") {
      state.openMenuId = state.openMenuId === id ? null : id;
      render();
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
      else persistInPlace(record);
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
  }

  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    if (action === "toggle-menu") e.stopPropagation();
    handleRowAction(action, btn.getAttribute("data-id"));
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
      if (action === "add-size-range") {
        var gIdx = Number(btn.getAttribute("data-group"));
        var group = state.draft.stoneGroups && state.draft.stoneGroups[gIdx];
        if (group) {
          if (!Array.isArray(group.sizeRanges)) group.sizeRanges = [];
          group.sizeRanges.push(blankSizeRange());
          buildForm();
        }
        return;
      }
      if (action === "remove-size-range") {
        var gIdxR = Number(btn.getAttribute("data-group"));
        var rIdx = Number(btn.getAttribute("data-range"));
        var groupR = state.draft.stoneGroups && state.draft.stoneGroups[gIdxR];
        if (groupR && Array.isArray(groupR.sizeRanges)) {
          groupR.sizeRanges.splice(rIdx, 1);
          buildForm();
        }
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

  /* In-form change: re-render when toggles affect visible fields. */
  sectionsHolder.addEventListener("change", function (e) {
    var el = e.target;
    if (!el || !el.name) return;
    var name = el.name;
    if (name === "centerStone.required" || name === "centerStone.count") {
      state.draft = readForm();
      buildForm();
      return;
    }
    if (/^stoneGroups\.\d+\.countLogic$/.test(name)) {
      state.draft = readForm();
      buildForm();
      return;
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

  function validateDraft(data) {
    var errors = [];

    if (!data.designName || !String(data.designName).trim()) errors.push("Design Name is required.");
    if (!data.collection || !String(data.collection).trim()) errors.push("Collection is required.");
    if (!data.category || !String(data.category).trim()) errors.push("Category is required.");
    if (!data.type || !String(data.type).trim()) errors.push("Type is required.");
    // Master ID may be auto-generated; only enforce when editing an existing
    // record (state.editingId is set) so blank-on-create still works.
    if (state.editingId && (!data.masterId || !String(data.masterId).trim())) {
      errors.push("Master ID is required.");
    }

    var c = data.centerStone || {};
    if (c.required) {
      var stones = Array.isArray(c.stones) ? c.stones.slice(0, c.count || 1) : [];
      var hasShape = stones.some(function (s) { return s && s.shape; });
      if (!hasShape) errors.push("At least one center stone must have a shape.");
    }

    (data.stoneGroups || []).forEach(function (g, i) {
      var label = "Stone Group " + (i + 1) + (g.groupName ? " (" + g.groupName + ")" : "");
      if (g.countLogic === "Fixed Count") {
        if (g.fixedCount === "" || g.fixedCount === null || g.fixedCount === undefined) {
          errors.push(label + ": Fixed Stone Count is required.");
        }
      } else if (g.countLogic === "Count by Finger Size Range") {
        var ranges = Array.isArray(g.sizeRanges) ? g.sizeRanges : [];
        if (ranges.length === 0) {
          errors.push(label + ": at least one size range is required.");
        }
        ranges.forEach(function (r, j) {
          var rl = label + " range " + (j + 1);
          if (r.fromSize === "" || r.fromSize === null || r.fromSize === undefined) errors.push(rl + ": From Size is required.");
          if (r.toSize === "" || r.toSize === null || r.toSize === undefined) errors.push(rl + ": To Size is required.");
          if (r.stoneCount === "" || r.stoneCount === null || r.stoneCount === undefined) errors.push(rl + ": Stone Count is required.");
          var from = Number(r.fromSize), to = Number(r.toSize);
          if (!isNaN(from) && !isNaN(to) && from >= to) errors.push(rl + ": From Size must be smaller than To Size.");
        });
      }
    });

    return errors;
  }

  /* Save */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = readForm();
    var errors = validateDraft(data);
    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }
    saveRecord(data);
    closeDialog();
    render();
  });

  /* Initial render */
  syncFiltersToInputs();
  render();
})();
