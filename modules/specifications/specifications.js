(function () {
  "use strict";

  App.renderNav("specifications");
  App.renderFooter();

  var DEFAULT_SPEC_SETUP = {
    metals: [
      { metal: "Gold", karats: ["10K", "14K", "18K", "22K"], pricingMethod: "Spot × purity × weight", availableIn: "Quotes + Products", notes: "Use live gold spot for estimates." },
      { metal: "Platinum", karats: ["PT900", "PT950"], pricingMethod: "Spot × purity × weight", availableIn: "Quotes + Products", notes: "Typically priced off PT950." }
    ],
    finishes: [
      { finish: "High Polish", category: "Polish", availableIn: "Quotes + Products", notes: "Default for most programs." },
      { finish: "Matte", category: "Texture", availableIn: "Quotes + Products", notes: "Hand-finish required." },
      { finish: "Rhodium", category: "Plating", availableIn: "Quotes only", notes: "Usually only for white gold." }
    ],
    stoneQualities: [
      { group: "Natural Diamond", qualityValues: ["I1", "SI2", "SI1", "VS1"], availableIn: "Quotes + Products", notes: "Match to stone cost tables." }
    ]
  };

  function loadSetup() { return Storage.load("specificationSetup") || DEFAULT_SPEC_SETUP; }
  function saveSetup(v) { Storage.save("specificationSetup", v); }

  function chips(values) {
    return (values || []).map(function (v) {
      return '<span class="chip">' + App.escapeHtml(v) + '</span>';
    }).join(" ");
  }

  function renderSection(title, key, rows, cols, addLabel) {
    return '<section class="card section-card"><div class="section-header"><h3>' + title + '</h3><button class="btn btn-sm btn-primary" data-add="' + key + '">' + addLabel + '</button></div><div class="table-wrap"><table><thead><tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join("") + '<th></th></tr></thead><tbody>' + (rows.length ? rows.map(function (r, i) {
      return '<tr>' + cols.map(function (c) {
        var value = r[c.key];
        if (Array.isArray(value)) return '<td>' + chips(value) + '</td>';
        return '<td>' + App.escapeHtml(value || "") + '</td>';
      }).join("") + '<td><div class="row-actions"><button class="btn btn-sm" data-edit="' + key + '" data-idx="' + i + '">Edit</button><button class="btn btn-sm btn-danger" data-del="' + key + '" data-idx="' + i + '">Delete</button></div></td></tr>';
    }).join("") : '<tr><td colspan="99" class="empty">No records</td></tr>') + '</tbody></table></div></section>';
  }

  function editPrompt(setKey, current) {
    if (setKey === "metals") {
      var metal = prompt("Metal", current && current.metal || "");
      if (!metal) return null;
      var karats = (prompt("Karats (comma-separated)", current ? (current.karats || []).join(",") : "") || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
      var pricingMethod = prompt("Price per gram method", current && current.pricingMethod || "Spot × purity × weight") || "";
      var availableIn = prompt("Available in (Quotes only / Quotes + Products)", current && current.availableIn || "Quotes + Products") || "";
      var notes = prompt("Notes", current && current.notes || "") || "";
      return { metal: metal, karats: karats, pricingMethod: pricingMethod, availableIn: availableIn, notes: notes };
    }

    if (setKey === "finishes") {
      var finish = prompt("Finish", current && current.finish || "");
      if (!finish) return null;
      var category = prompt("Category", current && current.category || "") || "";
      var finishAvailableIn = prompt("Available in (Quotes only / Quotes + Products)", current && current.availableIn || "Quotes + Products") || "";
      var finishNotes = prompt("Notes", current && current.notes || "") || "";
      return { finish: finish, category: category, availableIn: finishAvailableIn, notes: finishNotes };
    }

    if (setKey === "stoneQualities") {
      var group = prompt("Stone group", current && current.group || "");
      if (!group) return null;
      var values = (prompt("Quality values (comma-separated)", current ? (current.qualityValues || []).join(",") : "") || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
      var qualityAvailableIn = prompt("Available in (Quotes only / Quotes + Products)", current && current.availableIn || "Quotes + Products") || "";
      var qualityNotes = prompt("Notes", current && current.notes || "") || "";
      return { group: group, qualityValues: values, availableIn: qualityAvailableIn, notes: qualityNotes };
    }

    return null;
  }

  function renderSpecificationsPage() {
    var setup = loadSetup();
    var main = document.getElementById("specifications-page");
    main.innerHTML = '<div class="page-header"><div><h1>Specifications</h1><p>Maintain setup values for metals, karats, finishes and quality options. Structured like Stone Setup so these can be reused in quotes and products.</p></div></div>' +
      renderSection("Metals", "metals", setup.metals || [], [{ key: "metal", label: "Metal" }, { key: "karats", label: "Karats" }, { key: "pricingMethod", label: "Price / gram method" }, { key: "availableIn", label: "Available in" }, { key: "notes", label: "Notes" }], "Add Metal") +
      renderSection("Finishes", "finishes", setup.finishes || [], [{ key: "finish", label: "Finish" }, { key: "category", label: "Category" }, { key: "availableIn", label: "Available in" }, { key: "notes", label: "Notes" }], "Add Finish") +
      renderSection("Stone Qualities", "stoneQualities", setup.stoneQualities || [], [{ key: "group", label: "Group" }, { key: "qualityValues", label: "Quality values" }, { key: "availableIn", label: "Available in" }, { key: "notes", label: "Notes" }], "Add Group");

    bindHandlers();
  }

  function bindHandlers() {
    document.body.onclick = function (e) {
      var add = e.target.getAttribute("data-add");
      var edit = e.target.getAttribute("data-edit");
      var del = e.target.getAttribute("data-del");
      var idx = Number(e.target.getAttribute("data-idx"));
      var setup = loadSetup();

      if (add) {
        var row = editPrompt(add);
        if (!row) return;
        setup[add].push(row);
        saveSetup(setup);
        renderSpecificationsPage();
      }

      if (edit) {
        var current = setup[edit][idx];
        var next = editPrompt(edit, current);
        if (!next) return;
        setup[edit][idx] = next;
        saveSetup(setup);
        renderSpecificationsPage();
      }

      if (del) {
        var label = setup[del][idx].metal || setup[del][idx].finish || setup[del][idx].group || "this row";
        if (!confirm("Delete " + label + "?")) return;
        setup[del].splice(idx, 1);
        saveSetup(setup);
        renderSpecificationsPage();
      }
    };
  }

  renderSpecificationsPage();
})();
