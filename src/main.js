const Batch = require("./batch.js");
const Checker = require("./checker.js");
const Loader = require("./loader.js");
const UI = require("./ui.js");

if (typeof jQuery === "undefined") {
  throw Error ("Checklist requires jQuery");
}

window.checklist = {
  // checklist properties
  config: window.checklistUserConfig || {},

  // checklist methods
  // TODO: 1. merge config, 2. add an "override" parameter
  setConfig: function (options) {
    const config = {};
    config.context = options.context || this.config.context;
    config.rules = options.rules || this.config.rules;
    config.parent = options.parent || this.config.parent;
    this.config = config;
  },

  init: function (config) {
    const initUi = (ui) => {
      if (!ui) {
        ui = new UI({parent});
        ui.show();
      }
      checker.on("done", (statements) => {
        ui.inject(statements);
      });
    };

    if (config) {
      this.setConfig(config);
    }

    const {rules, context, parent} = this.config;

    if (!this.loader) {
      this.loader = new Loader();
    }

    const checker = new Checker({ rules, context });
    this.checker = checker;

    // Init optional UI
    if (parent) {
      initUi(this.ui);
    }

    return checker;
  },

  start: function (config, callback) {
    const checker = this.init(config);

    if (typeof callback === "function") {
      checker.on("done", (statements) => {
        callback(checker, statements);
      });
    }

    checker.run();
    return checker;
  },

  clear: function () {
    this.config = {};
    this.loader = new Loader();
  },

  batch: function (hrefs) {
    const batch = new Batch(hrefs);
    return batch;
  }
};
