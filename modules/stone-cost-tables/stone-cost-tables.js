(function () {
  "use strict";

  App.renderNav("stone-cost-tables");
  App.renderFooter();

  var state = {
    view: "matrix",
    type: "",
    shape: "",
    search: "",
    purchasableOnly: false,
    status: "",
    logSearch: ""
  };

  function loadStoneSetup() { return Storage.load("stoneSetup") || {}; }
  function saveStoneSetup(v) { Storage.save("stoneSetup", v); }
  function loadStoneCosts() { return Storage.load("stoneCosts") || []; }
  function saveStoneCosts(v) { Storage.save("stoneCosts", v); }
  function loadMarkupProfiles() { return Storage.load("markupProfiles") || {}; }
  function saveMarkupProfiles(v) { Storage.save("markupProfiles", v); }
  function loadStoneChangeLog() { return Storage.load("stoneChangeLog") || []; }
  function saveStoneChangeLog(v) { Storage.save("stoneChangeLog", v); }

  function getTypeConfig(typeKey) {
    var setup = loadStoneSetup();
    return (setup.types || []).find(function (t) { return t.key === typeKey; }) || null;
  }
  function getColumnsForType(typeKey) {
    var setup = loadStoneSetup();
    var type = getTypeConfig(typeKey);
    if (!type) return [];
    var set = (setup.columnSets || []).find(function (c) { return c.key === type.columnSet; });
    return set ? set.columns || [] : [];
  }
  function getShapesForType(typeKey) {
    var setup = loadStoneSetup();
    var type = getTypeConfig(typeKey);
    if (!type) return [];
    var set = (setup.shapeSets || []).find(function (s) { return s.key === type.shapeSet; });
    return set ? set.shapes || [] : [];
  }
  function getSizeFormat(typeKey) {
    var setup = loadStoneSetup();
    var type = getTypeConfig(typeKey);
    if (!type) return null;
    return (setup.sizeFormats || []).find(function (sf) { return sf.key === type.sizeFormat; }) || null;
  }

  function formatStoneNaturalKey(row) {
    return [row.type, row.shape, row.size && row.size.label].join(" | ");
  }

  function appendStoneChangeLog(entry) {
    var logs = loadStoneChangeLog();
    logs.unshift(entry);
    saveStoneChangeLog(logs);
  }

  function ensureStatusAndCosts(row, columns) {
    row.costs = row.costs || {};
    row.status = row.status || {};
    columns.forEach(function (col) {
      if (!(col in row.status)) row.status[col] = row.costs[col] !== null && row.costs[col] !== undefined && row.costs[col] !== "" ? "priced" : "missing";
      if (!(col in row.costs)) row.costs[col] = null;
    });
    return row;
  }

  function normalizeAllRows() {
    var rows = loadStoneCosts();
    rows.forEach(function (r) {
      ensureStatusAndCosts(r, getColumnsForType(r.type));
    });
    saveStoneCosts(rows);
  }

  function statusClass(status) {
    return "status-" + (status || "missing");
  }

  function exportJson(key) {
    var data = Storage.load(key);
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = key + "-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(key, cb) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!confirm("Replace existing " + key + " data?")) return;
          Storage.save(key, parsed);
          cb();
        } catch (err) {
          alert("Malformed JSON. Import aborted.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function filteredRows() {
    var rows = loadStoneCosts();
    return rows.filter(function (row) {
      if (state.type && row.type !== state.type) return false;
      if (state.shape && row.shape !== state.shape) return false;
      if (state.purchasableOnly && !row.purchasable) return false;
      var cols = getColumnsForType(row.type);
      if (state.status && !cols.some(function (c) { return row.status && row.status[c] === state.status; })) return false;
      var q = state.search.trim().toLowerCase();
      if (!q) return true;
      var text = [row.type, row.shape, row.size && row.size.label, row.note].join(" ").toLowerCase();
      return text.indexOf(q) > -1;
    });
  }

  function updateCell(rowKey, column, field, value, note) {
    var rows = loadStoneCosts();
    var row = rows.find(function (r) { return formatStoneNaturalKey(r) === rowKey; });
    if (!row) return;
    var oldValue;
    if (field === "cost") {
      oldValue = row.costs[column];
      row.costs[column] = value;
      if (value !== null && value !== "" && !isNaN(Number(value))) row.status[column] = "priced";
      else if (row.status[column] === "priced") row.status[column] = "missing";
      appendStoneChangeLog({ date: new Date().toISOString(), stone: rowKey, field: "costs." + column, oldValue: oldValue, newValue: value, note: note || "Updated from Stone Costs page" });
    } else {
      oldValue = row.status[column];
      row.status[column] = value;
      appendStoneChangeLog({ date: new Date().toISOString(), stone: rowKey, field: "status." + column, oldValue: oldValue, newValue: value, note: note || "Updated from Stone Costs page" });
    }
    saveStoneCosts(rows);
    renderStoneCostsPage();
  }

  function deleteRow(rowKey) {
    if (!confirm("Delete this stone cost row?")) return;
    var rows = loadStoneCosts().filter(function (r) { return formatStoneNaturalKey(r) !== rowKey; });
    saveStoneCosts(rows);
    renderStoneCostsPage();
  }

  function renderStoneMatrixView(rows) {
    var type = state.type || (loadStoneSetup().types || [])[0] && loadStoneSetup().types[0].key;
    var cols = getColumnsForType(type);
    var statuses = loadStoneSetup().statusValues || [];
    var filtered = rows.filter(function (r) { return !type || r.type === type; });
    return '<div class="table-wrap matrix-wrap"><table class="matrix-table"><thead><tr>' +
      '<th class="sticky-col">Shape</th><th class="sticky-col-2">Size</th><th>Weight Ct</th><th>One-of-Kind</th><th>Purchasable</th><th>Markup Profile</th>' +
      cols.map(function (c) { return '<th>' + App.escapeHtml(c) + '</th>'; }).join("") +
      '<th>Note</th><th>Actions</th></tr></thead><tbody>' +
      (filtered.length ? filtered.map(function (row) {
        ensureStatusAndCosts(row, cols);
        var key = formatStoneNaturalKey(row);
        return '<tr><td class="sticky-col">' + App.escapeHtml(row.shape) + '</td><td class="sticky-col-2">' + App.escapeHtml((row.size && row.size.label) || "") + '</td>' +
        '<td><input class="input slim-input" data-row="' + App.escapeHtml(key) + '" data-field="weightCt" value="' + App.escapeHtml(row.weightCt) + '" /></td>' +
        '<td>' + App.escapeHtml(row.oneOfKind || "standard") + '</td>' +
        '<td>' + (row.purchasable ? "Yes" : "No") + '</td>' +
        '<td>' + App.escapeHtml(row.markupProfile || "") + '</td>' +
        cols.map(function (c) {
          var cost = row.costs[c];
          var st = row.status[c] || "missing";
          return '<td><div class="matrix-cell ' + statusClass(st) + '">' +
            '<input class="input slim-input" type="number" step="0.01" data-action="cost" data-row="' + App.escapeHtml(key) + '" data-col="' + App.escapeHtml(c) + '" value="' + App.escapeHtml(cost === null ? "" : cost) + '" />' +
            '<select class="select slim-select" data-action="status" data-row="' + App.escapeHtml(key) + '" data-col="' + App.escapeHtml(c) + '">' +
            statuses.map(function (s) { return '<option value="' + App.escapeHtml(s.key) + '"' + (s.key === st ? " selected" : "") + '>' + App.escapeHtml(s.label) + '</option>'; }).join("") +
            '</select></div></td>';
        }).join("") +
        '<td><input class="input slim-input" data-row="' + App.escapeHtml(key) + '" data-field="note" value="' + App.escapeHtml(row.note || "") + '" /></td>' +
        '<td><button class="btn btn-sm" data-action="edit-row" data-row="' + App.escapeHtml(key) + '">Edit</button><button class="btn btn-sm btn-danger" data-action="delete-row" data-row="' + App.escapeHtml(key) + '">Delete</button></td></tr>';
      }).join("") : '<tr><td colspan="99" class="empty">No rows match filters.</td></tr>') + '</tbody></table></div>';
  }

  function renderStoneTableView(rows) {
    return '<div class="table-wrap"><table><thead><tr><th>Type</th><th>Shape</th><th>Size</th><th>Weight Ct</th><th>Number of Priced Cells</th><th>Missing Cells</th><th>Purchasable</th><th>Markup Profile</th><th>Note</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (row) {
        var cols = getColumnsForType(row.type);
        ensureStatusAndCosts(row, cols);
        var priced = cols.filter(function (c) { return row.status[c] === "priced"; }).length;
        var missing = cols.filter(function (c) { return row.status[c] === "missing"; }).length;
        var key = formatStoneNaturalKey(row);
        return '<tr><td>' + App.escapeHtml(row.type) + '</td><td>' + App.escapeHtml(row.shape) + '</td><td>' + App.escapeHtml(row.size.label) + '</td><td>' + App.escapeHtml(row.weightCt) + '</td><td>' + priced + '</td><td>' + missing + '</td><td>' + (row.purchasable ? "Yes" : "No") + '</td><td>' + App.escapeHtml(row.markupProfile || "") + '</td><td>' + App.escapeHtml(row.note || "") + '</td><td><div class="row-actions"><button class="btn btn-sm" data-action="edit-row" data-row="' + App.escapeHtml(key) + '">Edit</button><button class="btn btn-sm btn-danger" data-action="delete-row" data-row="' + App.escapeHtml(key) + '">Delete</button></div></td></tr>';
      }).join("") : '<tr><td colspan="10" class="empty">No rows match filters.</td></tr>') + '</tbody></table></div>';
  }

  function renderStoneChangeLogView() {
    var logs = loadStoneChangeLog();
    var q = state.logSearch.trim().toLowerCase();
    if (q) logs = logs.filter(function (l) { return JSON.stringify(l).toLowerCase().indexOf(q) > -1; });
    return '<div class="toolbar"><input class="input grow" id="log-search" placeholder="Search change log" value="' + App.escapeHtml(state.logSearch) + '" /><button class="btn btn-danger" id="clear-log">Clear change log</button></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Stone</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Note</th></tr></thead><tbody>' +
      (logs.length ? logs.map(function (l) { return '<tr><td>' + App.escapeHtml(new Date(l.date).toLocaleString()) + '</td><td>' + App.escapeHtml(l.stone) + '</td><td>' + App.escapeHtml(l.field) + '</td><td>' + App.escapeHtml(l.oldValue) + '</td><td>' + App.escapeHtml(l.newValue) + '</td><td>' + App.escapeHtml(l.note || "") + '</td></tr>'; }).join("") : '<tr><td colspan="6" class="empty">No change log entries.</td></tr>') +
      '</tbody></table></div>';
  }

  function renderStoneCostsPage() {
    normalizeAllRows();
    var setup = loadStoneSetup();
    var types = setup.types || [];
    if (!state.type && types[0]) state.type = types[0].key;
    var shapes = state.type ? getShapesForType(state.type) : [];
    if (state.shape && shapes.indexOf(state.shape) === -1) state.shape = "";

    var rows = filteredRows();
    var main = document.getElementById("stone-costs-page");

    main.innerHTML = '<div class="page-header"><div><h1>Stone Costs</h1><p>Structured matrix-based stone costing by type, shape and size.</p></div><div class="toolbar">' +
      '<button class="btn" id="reset-costs">Reset Stone Costs only</button><button class="btn" id="reset-setup">Reset Stone Setup only</button><button class="btn btn-danger" id="reset-all-stone">Reset All Stone Data</button><button class="btn btn-primary" id="add-row">Add stone cost</button></div></div>' +
      '<div class="toolbar"><select class="select" id="filter-type"><option value="">All types</option>' + types.map(function (t) { return '<option value="' + App.escapeHtml(t.key) + '"' + (state.type === t.key ? " selected" : "") + '>' + App.escapeHtml(t.label) + '</option>'; }).join("") + '</select>' +
      '<select class="select" id="filter-shape"><option value="">All shapes</option>' + shapes.map(function (s) { return '<option value="' + App.escapeHtml(s) + '"' + (state.shape === s ? " selected" : "") + '>' + App.escapeHtml(s) + '</option>'; }).join("") + '</select>' +
      '<input class="input grow" id="filter-search" placeholder="Search" value="' + App.escapeHtml(state.search) + '" />' +
      '<label class="check-inline"><input type="checkbox" id="filter-purch" ' + (state.purchasableOnly ? "checked" : "") + ' /> Purchasable only</label>' +
      '<select class="select" id="filter-status"><option value="">Any status</option>' + (setup.statusValues || []).map(function (s) { return '<option value="' + App.escapeHtml(s.key) + '"' + (state.status === s.key ? " selected" : "") + '>' + App.escapeHtml(s.label) + '</option>'; }).join("") + '</select></div>' +
      '<div class="toolbar"><div class="segmented"><button class="btn btn-sm ' + (state.view === "matrix" ? "btn-primary" : "") + '" data-view="matrix">Matrix View</button><button class="btn btn-sm ' + (state.view === "table" ? "btn-primary" : "") + '" data-view="table">Table View</button><button class="btn btn-sm ' + (state.view === "log" ? "btn-primary" : "") + '" data-view="log">Change Log</button></div>' +
      '<button class="btn" id="exp-costs">Export Stone Costs JSON</button><button class="btn" id="exp-setup">Export Stone Setup JSON</button><button class="btn" id="exp-log">Export Change Log JSON</button><button class="btn" id="imp-costs">Import Stone Costs JSON</button><button class="btn" id="imp-setup">Import Stone Setup JSON</button></div>' +
      '<div class="status-legend">' + (setup.statusValues || []).map(function (s) { return '<span><i class="status-dot ' + statusClass(s.key) + '"></i>' + App.escapeHtml(s.label) + '</span>'; }).join("") + '</div>' +
      (state.view === "matrix" ? renderStoneMatrixView(rows) : (state.view === "table" ? renderStoneTableView(rows) : renderStoneChangeLogView()));

    bindHandlers();
  }

  function updateRowField(rowKey, field, value) {
    var rows = loadStoneCosts();
    var row = rows.find(function (r) { return formatStoneNaturalKey(r) === rowKey; });
    if (!row) return;
    var oldValue = row[field];
    row[field] = value;
    saveStoneCosts(rows);
    appendStoneChangeLog({ date: new Date().toISOString(), stone: rowKey, field: field, oldValue: oldValue, newValue: value, note: "Updated from Stone Costs page" });
  }

  function upsertRow(nextRow, originalKey) {
    var rows = loadStoneCosts();
    var nextKey = formatStoneNaturalKey(nextRow);
    if (rows.some(function (r) { return formatStoneNaturalKey(r) === nextKey && formatStoneNaturalKey(r) !== originalKey; })) {
      alert("A row with the same type + shape + size already exists.");
      return false;
    }
    var idx = rows.findIndex(function (r) { return formatStoneNaturalKey(r) === originalKey; });
    if (idx === -1) rows.push(nextRow);
    else rows[idx] = nextRow;
    saveStoneCosts(rows);
    return true;
  }

  function openRowModal(rowKey) {
    var setup = loadStoneSetup();
    var dialog = document.getElementById("stone-cost-modal");
    var current = loadStoneCosts().find(function (r) { return formatStoneNaturalKey(r) === rowKey; }) || null;
    var draft = current ? JSON.parse(JSON.stringify(current)) : { type: (setup.types[0] || {}).key || "", shape: "", size: {}, weightCt: "", oneOfKind: "standard", purchasable: false, markupProfile: Object.keys(loadMarkupProfiles())[0] || "", costs: {}, status: {}, note: "" };

    function syncDynamic() {
      var shapes = getShapesForType(draft.type);
      if (!draft.shape || shapes.indexOf(draft.shape) === -1) draft.shape = shapes[0] || "";
      var sizeFormat = getSizeFormat(draft.type);
      var cols = getColumnsForType(draft.type);
      cols.forEach(function (c) {
        if (!(c in draft.costs)) draft.costs[c] = null;
        if (!(c in draft.status)) draft.status[c] = "missing";
      });

      dialog.innerHTML = '<form id="stone-form"><div class="dialog-header"><h2>' + (rowKey ? "Edit" : "Add") + ' Stone Cost</h2></div><div class="dialog-body"><div class="form-grid">' +
        '<div><label>Type</label><select class="select" name="type">' + (setup.types || []).map(function (t) { return '<option value="' + App.escapeHtml(t.key) + '"' + (draft.type === t.key ? " selected" : "") + '>' + App.escapeHtml(t.label) + '</option>'; }).join("") + '</select></div>' +
        '<div><label>Shape</label><select class="select" name="shape">' + shapes.map(function (s) { return '<option value="' + App.escapeHtml(s) + '"' + (draft.shape === s ? " selected" : "") + '>' + App.escapeHtml(s) + '</option>'; }).join("") + '</select></div>' +
        (sizeFormat ? sizeFormat.fields.map(function (f) { return '<div><label>' + App.escapeHtml(f) + '</label><input class="input" name="size_' + App.escapeHtml(f) + '" value="' + App.escapeHtml(draft.size[f] || "") + '" /></div>'; }).join("") : "") +
        '<div><label>Weight Ct</label><input class="input" type="number" step="0.001" name="weightCt" value="' + App.escapeHtml(draft.weightCt) + '" /></div>' +
        '<div><label>One-of-Kind</label><select class="select" name="oneOfKind">' + ["standard", "one-of-kind", "calibrated", "master-controlled"].map(function (o) { return '<option value="' + o + '"' + (draft.oneOfKind === o ? " selected" : "") + '>' + o + '</option>'; }).join("") + '</select></div>' +
        '<div><label>Markup Profile</label><select class="select" name="markupProfile">' + Object.keys(loadMarkupProfiles()).map(function (k) { return '<option value="' + App.escapeHtml(k) + '"' + (draft.markupProfile === k ? " selected" : "") + '>' + App.escapeHtml(k) + '</option>'; }).join("") + '</select></div>' +
        '<div><label><input type="checkbox" name="purchasable" ' + (draft.purchasable ? "checked" : "") + ' /> Purchasable</label></div>' +
        '<div class="full"><label>Note</label><textarea class="textarea" name="note">' + App.escapeHtml(draft.note || "") + '</textarea></div>' +
        '<div class="full"><h3>Quality Costs</h3><div class="quality-grid">' + cols.map(function (c) {
          return '<div class="quality-row"><strong>' + App.escapeHtml(c) + '</strong><input class="input" type="number" step="0.01" name="cost_' + App.escapeHtml(c) + '" value="' + App.escapeHtml(draft.costs[c] === null ? "" : draft.costs[c]) + '" /><select class="select" name="status_' + App.escapeHtml(c) + '">' + (setup.statusValues || []).map(function (s) { return '<option value="' + App.escapeHtml(s.key) + '"' + (draft.status[c] === s.key ? " selected" : "") + '>' + App.escapeHtml(s.label) + '</option>'; }).join("") + '</select></div>';
        }).join("") + '</div></div></div></div><div class="dialog-footer"><button type="button" class="btn btn-ghost" id="cancel-modal">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>';

      dialog.querySelector('[name="type"]').onchange = function (e) { draft.type = e.target.value; syncDynamic(); };
      dialog.querySelector("#cancel-modal").onclick = function () { dialog.close(); };
      dialog.querySelector("#stone-form").onsubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        draft.type = form.type.value;
        draft.shape = form.shape.value;
        draft.weightCt = form.weightCt.value === "" ? null : Number(form.weightCt.value);
        draft.oneOfKind = form.oneOfKind.value;
        draft.purchasable = !!form.purchasable.checked;
        draft.markupProfile = form.markupProfile.value;
        draft.note = form.note.value;
        var sf = getSizeFormat(draft.type);
        var parts = [];
        draft.size = {};
        (sf ? sf.fields : []).forEach(function (f) {
          var v = form["size_" + f].value;
          draft.size[f] = v === "" ? null : Number(v) || v;
          parts.push(v);
        });
        draft.size.label = sf && sf.key === "length-width" ? parts[0] + ' x ' + parts[1] + ' mm' : (parts[0] + ' mm');
        getColumnsForType(draft.type).forEach(function (c) {
          var cv = form["cost_" + c].value;
          draft.costs[c] = cv === "" ? null : Number(cv);
          draft.status[c] = form["status_" + c].value;
          if (draft.costs[c] !== null && !isNaN(draft.costs[c]) && draft.status[c] === "missing") draft.status[c] = "priced";
        });
        if (!upsertRow(draft, rowKey)) return;
        appendStoneChangeLog({ date: new Date().toISOString(), stone: formatStoneNaturalKey(draft), field: "row", oldValue: rowKey || null, newValue: "saved", note: "Updated from Stone Costs page" });
        dialog.close();
        renderStoneCostsPage();
      };
    }

    syncDynamic();
    dialog.showModal();
  }

  function bindHandlers() {
    document.getElementById("filter-type").onchange = function (e) { state.type = e.target.value; state.shape = ""; renderStoneCostsPage(); };
    document.getElementById("filter-shape").onchange = function (e) { state.shape = e.target.value; renderStoneCostsPage(); };
    document.getElementById("filter-search").oninput = function (e) { state.search = e.target.value; renderStoneCostsPage(); };
    document.getElementById("filter-purch").onchange = function (e) { state.purchasableOnly = e.target.checked; renderStoneCostsPage(); };
    document.getElementById("filter-status").onchange = function (e) { state.status = e.target.value; renderStoneCostsPage(); };

    Array.prototype.slice.call(document.querySelectorAll("[data-view]")).forEach(function (el) { el.onclick = function () { state.view = el.getAttribute("data-view"); renderStoneCostsPage(); }; });
    document.getElementById("add-row").onclick = function () { openRowModal(); };

    document.getElementById("exp-costs").onclick = function () { exportJson("stoneCosts"); };
    document.getElementById("exp-setup").onclick = function () { exportJson("stoneSetup"); };
    document.getElementById("exp-log").onclick = function () { exportJson("stoneChangeLog"); };
    document.getElementById("imp-costs").onclick = function () { importJson("stoneCosts", renderStoneCostsPage); };
    document.getElementById("imp-setup").onclick = function () { importJson("stoneSetup", function () { saveMarkupProfiles(loadMarkupProfiles()); renderStoneCostsPage(); }); };

    document.getElementById("reset-costs").onclick = function () { if (confirm("Reset Stone Costs only?")) { Storage.reset("stoneCosts"); renderStoneCostsPage(); } };
    document.getElementById("reset-setup").onclick = function () { if (confirm("Reset Stone Setup only?")) { Storage.reset("stoneSetup"); Storage.reset("markupProfiles"); renderStoneCostsPage(); } };
    document.getElementById("reset-all-stone").onclick = function () { if (confirm("Reset all Stone Setup, Stone Costs, Markup Profiles and Change Log?")) { Storage.reset("stoneSetup"); Storage.reset("stoneCosts"); Storage.reset("markupProfiles"); Storage.reset("stoneChangeLog"); renderStoneCostsPage(); } };

    var logSearch = document.getElementById("log-search");
    if (logSearch) logSearch.oninput = function (e) { state.logSearch = e.target.value; renderStoneCostsPage(); };
    var clearLog = document.getElementById("clear-log");
    if (clearLog) clearLog.onclick = function () { if (confirm("Clear entire change log?")) { saveStoneChangeLog([]); renderStoneCostsPage(); } };

    document.body.onclick = function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      var row = btn.getAttribute("data-row");
      if (action === "edit-row") openRowModal(row);
      if (action === "delete-row") deleteRow(row);
    };

    Array.prototype.slice.call(document.querySelectorAll('[data-action="cost"]')).forEach(function (el) {
      el.onchange = function () {
        var v = el.value === "" ? null : Number(el.value);
        updateCell(el.getAttribute("data-row"), el.getAttribute("data-col"), "cost", v);
      };
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-action="status"]')).forEach(function (el) {
      el.onchange = function () { updateCell(el.getAttribute("data-row"), el.getAttribute("data-col"), "status", el.value); };
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-field="note"], [data-field="weightCt"]')).forEach(function (el) {
      el.onchange = function () {
        var field = el.getAttribute("data-field");
        var value = field === "weightCt" ? (el.value === "" ? null : Number(el.value)) : el.value;
        updateRowField(el.getAttribute("data-row"), field, value);
      };
    });
  }

  window.loadStoneSetup = loadStoneSetup;
  window.saveStoneSetup = saveStoneSetup;
  window.loadStoneCosts = loadStoneCosts;
  window.saveStoneCosts = saveStoneCosts;
  window.renderStoneCostsPage = renderStoneCostsPage;
  window.renderStoneMatrixView = renderStoneMatrixView;
  window.renderStoneTableView = renderStoneTableView;
  window.renderStoneChangeLogView = renderStoneChangeLogView;
  window.getTypeConfig = getTypeConfig;
  window.getColumnsForType = getColumnsForType;
  window.getShapesForType = getShapesForType;
  window.formatStoneNaturalKey = formatStoneNaturalKey;
  window.appendStoneChangeLog = appendStoneChangeLog;
  window.exportJson = exportJson;
  window.importJson = importJson;

  renderStoneCostsPage();
})();
