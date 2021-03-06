const Base = require("../base.js");

class Cache extends Base {
  constructor ({ caller }) {
    super("Cache", caller);
    this.namespace = this.getConfig("namespace");
  }

  get (id, defaultValue) {
    if (id == null) return defaultValue;
    const namespace = this.namespace;
    const key = `checklist-${namespace}-${id}`;
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? defaultValue : value;
  }

  set (id, value) {
    if (id == null) return;
    const namespace = this.namespace;
    const key = `checklist-${namespace}-${id}`;
    localStorage.setItem(key, JSON.stringify(value));
    return this;
  }

  clear (regex = new RegExp(`^checklist-${this.namespace}-`)) {
    Object.keys(localStorage).forEach((key) => {
      if (!regex.test(key)) return;
      localStorage.removeItem(key);
    });
    return this;
  }

  setFilter (id, value) {
    this.set(`filter-${id}`, value);
  }

  // Return true if filter exists, i.e. statements must be hidden
  getFilter (id) {
    return this.get(`filter-${id}`, true);
  }

  // Return true if any filter exists
  isFiltered (ids) {
    return ids.some((id) => this.getFilter(id));
  }
}

module.exports = Cache;
