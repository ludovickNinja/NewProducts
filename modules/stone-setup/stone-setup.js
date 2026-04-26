(function () {
  "use strict";

  App.renderNav("stone-setup");
  App.renderFooter();

  function loadStoneSetup() { return Storage.load("stoneSetup") || {}; }
  function saveStoneSetup(v) { Storage.save("stoneSetup", v); }
  function loadStoneCosts() { return Storage.load("stoneCosts") || []; }
  function loadMarkupProfiles() { return Storage.load("markupProfiles") || {}; }
  function saveMarkupProfiles(v) { Storage.save("markupProfiles", v); }

  function chips(values) { return (values || []).map(function (v) { return '<span class="chip">' + App.escapeHtml(v) + '</span>'; }).join(" "); }

  function renderSection(title, key, rows, cols, addLabel) {
    return '<section class="card section-card"><div class="section-header"><h3>' + title + '</h3><button class="btn btn-sm btn-primary" data-add="' + key + '">' + addLabel + '</button></div><div class="table-wrap"><table><thead><tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join("") + '<th></th></tr></thead><tbody>' + (rows.length ? rows.map(function (r, i) {
      return '<tr>' + cols.map(function (c) {
        var v = r[c.key];
        if (Array.isArray(v)) v = chips(v);
        return '<td>' + (Array.isArray(r[c.key]) ? v : App.escapeHtml(v)) + '</td>';
      }).join("") + '<td><div class="row-actions"><button class="btn btn-sm" data-edit="' + key + '" data-idx="' + i + '">Edit</button><button class="btn btn-sm btn-danger" data-del="' + key + '" data-idx="' + i + '">Delete</button></div></td></tr>';
    }).join("") : '<tr><td colspan="99" class="empty">No records</td></tr>') + '</tbody></table></div></section>';
  }

  function renderStoneSetupPage() {
    var setup = loadStoneSetup();
    var profiles = loadMarkupProfiles();
    var main = document.getElementById("stone-setup-page");
    main.innerHTML = '<div class="page-header"><div><h1>Stone Setup</h1><p>Manage reference data used by Stone Costs.</p></div></div>' +
      renderSection("Categories", "categories", setup.categories || [], [{ key: "key", label: "Key" }, { key: "label", label: "Label" }], "Add Category") +
      renderSection("Types", "types", setup.types || [], [{ key: "key", label: "Key" }, { key: "label", label: "Label" }, { key: "category", label: "Category" }, { key: "shapeSet", label: "Shape Set" }, { key: "columnSet", label: "Column Set" }, { key: "sizeFormat", label: "Size Format" }, { key: "costingMode", label: "Costing Mode" }], "Add Type") +
      renderSection("Column Sets", "columnSets", setup.columnSets || [], [{ key: "key", label: "Key" }, { key: "label", label: "Label" }, { key: "columns", label: "Columns" }], "Add Column Set") +
      renderSection("Shape Sets", "shapeSets", setup.shapeSets || [], [{ key: "key", label: "Key" }, { key: "label", label: "Label" }, { key: "shapes", label: "Shapes" }], "Add Shape Set") +
      renderSection("Size Formats", "sizeFormats", setup.sizeFormats || [], [{ key: "key", label: "Key" }, { key: "label", label: "Label" }, { key: "fields", label: "Fields" }], "Add Size Format") +
      renderSection("Status Values", "statusValues", setup.statusValues || [], [{ key: "key", label: "Key" }, { key: "label", label: "Label" }], "Add Status") +
      renderSection("Markup Profiles", "markupProfiles", Object.keys(profiles).map(function (k) { return Object.assign({ key: k }, profiles[k]); }), [{ key: "key", label: "Key" }, { key: "label", label: "Label" }, { key: "markup1", label: "Markup1" }, { key: "markup2", label: "Markup2" }], "Add Markup Profile");

    bindSetupHandlers();
  }

  function preventDelete(setKey, row) {
    var setup = loadStoneSetup();
    var costs = loadStoneCosts();
    if (setKey === "categories" && (setup.types || []).some(function (t) { return t.category === row.key; })) return "Category used by a type.";
    if (setKey === "types" && costs.some(function (c) { return c.type === row.key; })) return "Type is used by stone costs.";
    if (setKey === "statusValues" && costs.some(function (c) { return Object.keys(c.status || {}).some(function (k) { return c.status[k] === row.key; }); })) return "Status is in use by existing cells.";
    return "";
  }

  function editPrompt(setKey, current) {
    if (setKey === "markupProfiles") {
      var key = prompt("Key", current && current.key || ""); if (!key) return null;
      var label = prompt("Label", current && current.label || "");
      var m1 = Number(prompt("Markup1", current && current.markup1 || 1));
      var m2 = Number(prompt("Markup2", current && current.markup2 || 1));
      return { key: key, label: label, markup1: m1, markup2: m2 };
    }

    var keyVal = prompt("Key", current && current.key || "");
    if (!keyVal) return null;
    var labelVal = prompt("Label", current && current.label || "") || "";
    var next = { key: keyVal, label: labelVal };
    if (setKey === "types") {
      var s = loadStoneSetup();
      next.category = prompt("Category key", current && current.category || (s.categories[0] || {}).key || "") || "";
      next.shapeSet = prompt("Shape set key", current && current.shapeSet || (s.shapeSets[0] || {}).key || "") || "";
      next.columnSet = prompt("Column set key", current && current.columnSet || (s.columnSets[0] || {}).key || "") || "";
      next.sizeFormat = prompt("Size format key", current && current.sizeFormat || (s.sizeFormats[0] || {}).key || "") || "";
      next.costingMode = prompt("Costing mode (matrix/single-price/one-of-kind)", current && current.costingMode || "matrix") || "matrix";
    }
    if (setKey === "columnSets") next.columns = (prompt("Columns (comma-separated)", current ? (current.columns || []).join(",") : "") || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
    if (setKey === "shapeSets") next.shapes = (prompt("Shapes (comma-separated)", current ? (current.shapes || []).join(",") : "") || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
    if (setKey === "sizeFormats") next.fields = (prompt("Fields (comma-separated)", current ? (current.fields || []).join(",") : "") || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
    return next;
  }

  function bindSetupHandlers() {
    document.body.onclick = function (e) {
      var add = e.target.getAttribute("data-add");
      var edit = e.target.getAttribute("data-edit");
      var del = e.target.getAttribute("data-del");
      var idx = Number(e.target.getAttribute("data-idx"));
      var setup = loadStoneSetup();

      if (add) {
        var newRow = editPrompt(add);
        if (!newRow) return;
        if (add === "markupProfiles") {
          var p = loadMarkupProfiles();
          p[newRow.key] = { label: newRow.label, markup1: newRow.markup1, markup2: newRow.markup2 };
          saveMarkupProfiles(p);
        } else {
          setup[add].push(newRow);
          saveStoneSetup(setup);
        }
        renderStoneSetupPage();
      }

      if (edit) {
        var curr = edit === "markupProfiles" ? Object.keys(loadMarkupProfiles()).map(function (k) { return Object.assign({ key: k }, loadMarkupProfiles()[k]); })[idx] : setup[edit][idx];
        var next = editPrompt(edit, curr);
        if (!next) return;
        if (edit === "markupProfiles") {
          var profiles = loadMarkupProfiles();
          if (curr.key !== next.key) delete profiles[curr.key];
          profiles[next.key] = { label: next.label, markup1: next.markup1, markup2: next.markup2 };
          saveMarkupProfiles(profiles);
        } else {
          setup[edit][idx] = next;
          saveStoneSetup(setup);
        }
        renderStoneSetupPage();
      }

      if (del) {
        var row = del === "markupProfiles" ? Object.keys(loadMarkupProfiles()).map(function (k) { return Object.assign({ key: k }, loadMarkupProfiles()[k]); })[idx] : setup[del][idx];
        var reason = preventDelete(del, row);
        if (reason) return alert(reason);
        if (!confirm("Delete " + row.key + "?")) return;
        if (del === "markupProfiles") {
          var prof = loadMarkupProfiles();
          delete prof[row.key];
          saveMarkupProfiles(prof);
        } else {
          setup[del].splice(idx, 1);
          saveStoneSetup(setup);
        }
        renderStoneSetupPage();
      }
    };
  }

  window.renderStoneSetupPage = renderStoneSetupPage;
  renderStoneSetupPage();
})();
