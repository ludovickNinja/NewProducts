/* NewProducts - shared app helpers
 *
 * Exposes a small global `App` with utilities used by every module page:
 * navigation rendering, ID generation, debouncing, escaping, and a placeholder
 * for future cost-calculation logic.
 */
(function (global) {
  "use strict";

  var MODULES = [
    { key: "dashboard", label: "Dashboard", path: "" },
    { key: "master-designs", label: "Master Designs", path: "modules/master-designs/" },
    { key: "stone-cost-tables", label: "Stone Costs", path: "modules/stone-cost-tables/" },
    { key: "stone-setup", label: "Stone Setup", path: "modules/stone-setup/" },
    { key: "labour-cost-templates", label: "Labour Costs", path: "modules/labour-cost-templates/" },
    { key: "product-development", label: "Product Development", path: "modules/product-development/" },
    { key: "specifications", label: "Specifications", path: "modules/specifications/" },
    { key: "products", label: "Products", path: "modules/products/" }
  ];

  function renderNav(activeKey) {
    // Determine path prefix based on how deep the current page sits
    // (root => "", a module page => "../../").
    var depth = (location.pathname.match(/\/modules\//) ? 2 : 0);
    var prefix = depth ? "../../" : "./";

    var brand =
      '<a class="brand" href="' + prefix + 'index.html">' +
      '<span class="brand-mark"></span>NewProducts</a>';

    var links = MODULES.map(function (m) {
      var href = prefix + (m.path ? m.path + "index.html" : "index.html");
      var cls = m.key === activeKey ? "active" : "";
      return '<a class="' + cls + '" href="' + href + '">' + m.label + "</a>";
    }).join("");

    var html =
      '<header class="topbar">' +
      brand +
      '<nav class="nav">' + links + "</nav>" +
      "</header>";

    var holder = document.getElementById("topbar");
    if (holder) holder.outerHTML = html;
  }

  function renderFooter() {
    var holder = document.getElementById("footer");
    if (!holder) return;
    holder.outerHTML =
      '<footer class="footer">NewProducts &middot; static prototype &middot; data persisted in your browser</footer>';
  }

  function uuid(prefix) {
    var s = Math.random().toString(36).slice(2, 8);
    var t = Date.now().toString(36).slice(-4);
    return (prefix || "id") + "_" + t + s;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function badge(value) {
    if (!value) return '<span class="badge">&mdash;</span>';
    var cls = String(value).toLowerCase().replace(/[^a-z]+/g, "-");
    return '<span class="badge ' + cls + '">' + escapeHtml(value) + "</span>";
  }

  function money(amount, currency) {
    if (amount === null || amount === undefined || amount === "") return "";
    var n = Number(amount);
    if (isNaN(n)) return escapeHtml(amount);
    var cur = currency || "USD";
    return n.toFixed(2) + " " + cur;
  }

  /* ---- Placeholder costing logic ----
   * Real cost rules will live here later. For now this is a deliberately
   * naive helper so module pages can show a calculated value without any
   * pretense of accuracy. Do not build on top of this number.
   */
  function calculateProductCost(product, opts) {
    opts = opts || {};
    var base = Number(product && product.estimatedWeight) || 0;
    var metalRate = opts.metalRate || 60;
    var stoneCost = opts.stoneCost || 0;
    var labourCost = opts.labourCost || 0;
    return +(base * metalRate + stoneCost + labourCost).toFixed(2);
  }

  /* ---- CRUD page helper ----
   * Each module page calls App.crudPage(config). The helper wires up the
   * search bar, Add button, table rendering, modal form, and delete flow.
   *
   * config = {
   *   storeKey:   string  (key in SAMPLE_DATA / Storage)
   *   idField:    string  (unique identifier field on the record)
   *   itemLabel:  string  ("Master Design")
   *   columns:    [{ key, label, render?, badge? }]
   *   fields:     [{ key, label, type, options?, full?, required?, step? }]
   *   searchKeys: [string]  fields scanned by the search box
   * }
   */
  function crudPage(config) {
    var listEl = document.getElementById("list-body");
    var emptyEl = document.getElementById("list-empty");
    var searchEl = document.getElementById("search");
    var addBtn = document.getElementById("add-btn");
    var resetBtn = document.getElementById("reset-btn");
    var dialog = document.getElementById("form-dialog");
    var form = document.getElementById("form");
    var formGrid = form.querySelector(".form-grid");
    var dialogTitle = document.getElementById("dialog-title");
    var cancelBtn = document.getElementById("form-cancel");

    var state = { all: [], filter: "", editingId: null };

    function refresh() {
      state.all = Storage.load(config.storeKey);
      render();
    }

    function render() {
      var q = state.filter.trim().toLowerCase();
      var rows = state.all.filter(function (row) {
        if (!q) return true;
        return config.searchKeys.some(function (k) {
          var v = row[k];
          return v !== undefined && v !== null &&
            String(v).toLowerCase().indexOf(q) !== -1;
        });
      });

      if (rows.length === 0) {
        listEl.innerHTML = "";
        emptyEl.style.display = "block";
        emptyEl.textContent = state.all.length === 0
          ? "No records yet. Click “Add” to create one."
          : "No matches for “" + q + "”.";
        return;
      }
      emptyEl.style.display = "none";

      listEl.innerHTML = rows.map(function (row) {
        var cells = config.columns.map(function (col) {
          var raw = row[col.key];
          var value;
          if (typeof col.render === "function") value = col.render(raw, row);
          else if (col.badge) value = badge(raw);
          else value = escapeHtml(raw === undefined || raw === null ? "" : raw);
          var cls = col.dim ? ' class="cell-dim"' : "";
          return "<td" + cls + ">" + value + "</td>";
        }).join("");
        var idVal = escapeHtml(row[config.idField]);
        var actions =
          '<td><div class="row-actions">' +
          '<button class="btn btn-sm" data-action="edit" data-id="' + idVal + '">Edit</button>' +
          '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + idVal + '">Delete</button>' +
          "</div></td>";
        return "<tr>" + cells + actions + "</tr>";
      }).join("");
    }

    function buildForm(record) {
      record = record || {};
      formGrid.innerHTML = config.fields.map(function (f) {
        var val = record[f.key];
        if (val === undefined || val === null) val = "";
        var cls = f.full ? "full" : "";
        var inner;
        var idAttr = ' id="f_' + f.key + '" name="' + f.key + '"';
        var req = f.required ? " required" : "";

        if (f.type === "select") {
          var opts = (f.options || []).map(function (opt) {
            var o = typeof opt === "string" ? { value: opt, label: opt } : opt;
            var sel = String(o.value) === String(val) ? " selected" : "";
            return '<option value="' + escapeHtml(o.value) + '"' + sel + ">" +
              escapeHtml(o.label) + "</option>";
          });
          var blank = f.required ? "" : '<option value=""></option>';
          inner = '<select class="select"' + idAttr + req + ">" + blank + opts.join("") + "</select>";
        } else if (f.type === "textarea") {
          inner = '<textarea class="textarea"' + idAttr + req + ">" + escapeHtml(val) + "</textarea>";
        } else if (f.type === "number") {
          var step = f.step ? ' step="' + f.step + '"' : ' step="any"';
          inner = '<input class="input" type="number"' + step + idAttr + req +
            ' value="' + escapeHtml(val) + '" />';
        } else if (f.type === "date") {
          inner = '<input class="input" type="date"' + idAttr + req +
            ' value="' + escapeHtml(val) + '" />';
        } else {
          inner = '<input class="input" type="text"' + idAttr + req +
            ' value="' + escapeHtml(val) + '" />';
        }
        return '<div class="' + cls + '"><label for="f_' + f.key + '">' +
          escapeHtml(f.label) + (f.required ? " *" : "") + "</label>" + inner + "</div>";
      }).join("");
    }

    function readForm() {
      var data = {};
      config.fields.forEach(function (f) {
        var el = form.querySelector("#f_" + f.key);
        var v = el ? el.value : "";
        if (f.type === "number") v = v === "" ? "" : Number(v);
        data[f.key] = v;
      });
      return data;
    }

    function openDialog(mode, record) {
      state.editingId = record ? record[config.idField] : null;
      dialogTitle.textContent =
        (mode === "edit" ? "Edit " : "Add ") + config.itemLabel;
      buildForm(record);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }

    function closeDialog() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    addBtn.addEventListener("click", function () {
      openDialog("add", null);
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (confirm("Reset this module back to sample data?")) {
          Storage.reset(config.storeKey);
          refresh();
        }
      });
    }

    searchEl.addEventListener("input", debounce(function () {
      state.filter = searchEl.value;
      render();
    }, 80));

    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var action = btn.getAttribute("data-action");
      var record = state.all.find(function (r) { return String(r[config.idField]) === id; });
      if (!record) return;

      if (action === "edit") {
        openDialog("edit", record);
      } else if (action === "delete") {
        if (confirm("Delete " + config.itemLabel + " “" + (record[config.idField]) + "”?")) {
          Storage.remove(config.storeKey, config.idField, record[config.idField]);
          refresh();
        }
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = readForm();

      if (state.editingId) {
        Storage.update(config.storeKey, config.idField, state.editingId, data);
      } else {
        if (!data[config.idField]) {
          data[config.idField] = uuid(config.itemLabel.split(" ")[0].toLowerCase());
        }
        Storage.add(config.storeKey, data);
      }
      closeDialog();
      refresh();
    });

    cancelBtn.addEventListener("click", function () {
      closeDialog();
    });

    refresh();
  }

  global.App = {
    MODULES: MODULES,
    renderNav: renderNav,
    renderFooter: renderFooter,
    uuid: uuid,
    escapeHtml: escapeHtml,
    debounce: debounce,
    badge: badge,
    money: money,
    calculateProductCost: calculateProductCost,
    crudPage: crudPage
  };
})(window);
