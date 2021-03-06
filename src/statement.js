const Base = require("./base.js");
const Marker = require("./marker.js");

class Statement extends Base {
  constructor ({name, id, description, type, tags, count, caller}) {
    super("Statement", caller);
    this.check = caller;
    this.docId = caller.docId;

    Object.assign(this, {name, id, description, type, count, tags});

    if (this.name == null) {
      throw Error("Statement constructor requires a name");
    }

    if (!this.count || this.count < 1) {
      this.count = 1;
    }
    this.markers = [];
  }

  add (nb = 1) {
    this.count += nb;
  }

  getDuplicate () {
    return this.check.statements.find((el) => {
      return this.is(el);
    });
  }

  is (statement) {
    return this.id === statement.id;
  }

  addMarker (options) {
    try {
      const showMarkers = this.getConfig("showMarkers", true);
      if (!showMarkers) return this;

      const createMarker = (singleTarget, options) => {
        const overwriting = {target: singleTarget, caller: this};
        const newOptions = Object.assign({}, options, overwriting);
        const marker = new Marker(newOptions);
        this.markers.push(marker);
        this.emit("marker", marker);
      };

      // Make sure target is one single element
      const $target = $(options.target);
      $target.each(function () {
        createMarker($(this), options);
      });
    } catch (err) {
      throw Error(err)
    }
    return this;
  }

  // Export instance to a minimal plain object which can be stored in cache
  export () {
    const clone = Base.export(this, ["docId", "states", "name", "description", "id", "type", "tags", "count"]);
    return clone;
  }
}

module.exports = Statement;
