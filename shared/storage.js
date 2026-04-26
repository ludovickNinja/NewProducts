/* NewProducts - thin wrapper around localStorage
 *
 * Each module is identified by a key (e.g. "masterDesigns") and stores its
 * full collection as a JSON array. On first load, sample data is seeded.
 */
(function (global) {
  "use strict";

  var PREFIX = "newproducts:";

  function storageKey(key) {
    return PREFIX + key;
  }

  function load(key) {
    var seeded = (global.SAMPLE_DATA && global.SAMPLE_DATA[key]) || [];
    var raw;
    try {
      raw = localStorage.getItem(storageKey(key));
    } catch (e) {
      return seeded.slice();
    }
    if (raw === null) {
      // First visit: seed and return.
      save(key, seeded);
      return seeded.slice();
    }
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : seeded.slice();
    } catch (e) {
      return seeded.slice();
    }
  }

  function save(key, list) {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(list || []));
    } catch (e) {
      // Quota or disabled storage - silently ignore for the prototype.
    }
  }

  function add(key, item) {
    var list = load(key);
    list.push(item);
    save(key, list);
    return item;
  }

  function update(key, idField, idValue, updates) {
    var list = load(key);
    for (var i = 0; i < list.length; i++) {
      if (list[i][idField] === idValue) {
        list[i] = Object.assign({}, list[i], updates);
        save(key, list);
        return list[i];
      }
    }
    return null;
  }

  function remove(key, idField, idValue) {
    var list = load(key).filter(function (row) {
      return row[idField] !== idValue;
    });
    save(key, list);
    return list;
  }

  function reset(key) {
    var seeded = (global.SAMPLE_DATA && global.SAMPLE_DATA[key]) || [];
    save(key, seeded);
    return seeded.slice();
  }

  function resetAll() {
    if (!global.SAMPLE_DATA) return;
    Object.keys(global.SAMPLE_DATA).forEach(function (k) {
      reset(k);
    });
  }

  global.Storage = {
    load: load,
    save: save,
    add: add,
    update: update,
    remove: remove,
    reset: reset,
    resetAll: resetAll
  };
})(window);
