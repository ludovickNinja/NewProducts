/* NewProducts - thin wrapper around localStorage */
(function (global) {
  "use strict";

  var PREFIX = "newproducts:";

  function storageKey(key) {
    return PREFIX + key;
  }

  function cloneValue(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function load(key) {
    var seeded = global.SAMPLE_DATA ? global.SAMPLE_DATA[key] : undefined;
    var raw;
    try {
      raw = localStorage.getItem(storageKey(key));
    } catch (e) {
      return cloneValue(seeded !== undefined ? seeded : []);
    }

    if (raw === null) {
      save(key, seeded !== undefined ? seeded : []);
      return cloneValue(seeded !== undefined ? seeded : []);
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return cloneValue(seeded !== undefined ? seeded : []);
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch (e) {}
  }

  function add(key, item) {
    var list = load(key);
    if (!Array.isArray(list)) list = [];
    list.push(item);
    save(key, list);
    return item;
  }

  function update(key, idField, idValue, updates) {
    var list = load(key);
    if (!Array.isArray(list)) return null;
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
    var list = load(key);
    if (!Array.isArray(list)) return list;
    var next = list.filter(function (row) { return row[idField] !== idValue; });
    save(key, next);
    return next;
  }

  function reset(key) {
    var seeded = global.SAMPLE_DATA ? global.SAMPLE_DATA[key] : undefined;
    var value = cloneValue(seeded !== undefined ? seeded : []);
    save(key, value);
    return value;
  }

  function resetAll() {
    if (!global.SAMPLE_DATA) return;
    Object.keys(global.SAMPLE_DATA).forEach(function (k) { reset(k); });
  }

  global.Storage = { load: load, save: save, add: add, update: update, remove: remove, reset: reset, resetAll: resetAll };
})(window);
