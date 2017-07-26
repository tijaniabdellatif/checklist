const Base = require("../base.js");
const cache = require("./cache.js");
const Help = require("./help.js");
const Pane = require("./pane.js");
const Report = require("./report.js");
const Settings = require("./settings.js");
const TOC = require("./toc.js");

// Load UI styles
require("./styles.css");

class UI extends Base {
  constructor ({ caller }) {
    super("UI", caller);
    this.components = {};
    this.reports = {};
    this.triggerState("ready");
  }

  // FIXME: not consistent with other checklist components
  init ({parent, buttonsCreator, toc}) {
    const setMiscEventHandlers = () => {
      // TODO: move this somewhere else whith other buttons fonctions?
      $(document).on("click", ".checklist-clear-filters", () => this.clearFilters());
    };

    Object.assign(this, {parent, buttonsCreator});
    this.createComponents(toc);
    setMiscEventHandlers();
    this.show();
    this.triggerState("initialized");
  }

  createComponents (toc) {
    const options = {ui: this, parent: this.parent};
    this.components.pane = new Pane(options);
    this.components.settings = new Settings(options);
    this.components.help = new Help(options);
    if (toc) {
      const tocView = new TOC(options);
      tocView.copy(toc);
      this.components.toc = tocView;
    }
    return this;
  }

  filterStatements (id, hidden = true) {
    this.forEachReport((report) => {
      report.filterStatements(id, hidden);
    });
    cache.setFilter(id, hidden);
    return this;
  }

  clearFilters () {
    this.forEachReport((report) => report.clearFilters());
    this.settings.clearFilters();
    cache.clearFilters();
    return this;
  }

  createReport (options) {
    const report = new Report({
      ui: this,
      parent: options.parent,
      docId: options.docId,
      buttonsCreator: options.buttonsCreator || this.buttonsCreator
    });
    this.reports[options.docId] = report;
    return report;
  }

  getReport (docId) {
    return this.reports[docId];
  }

  forEachReport (fn) {
    const reports = this.reports;
    Object.keys(reports).forEach((docId) => {
      fn(reports[docId], docId);
    });
    return this;
  }

  connectChecker (checker) {
    const docId = checker.docId;
    const report = this.getReport(docId);
    if (!report) {
      // FIXME: what to do here? which use case?
      console.log(this.reports);
      console.error(`Report not found for ${docId}`);
    }
    report.connect(checker);
    return this;
  }

  addBodyClass (classname) {
    $(document.body).addClass(classname);
  }

  removeBodyClass (classname) {
    $(document.body).removeClass(classname);
  }

  toggleBodyClass (classname, state) {
    $(document.body).toggleClass(classname, state);
  }

  hide () {
    this.removeBodyClass("checklist-visible");
    this.setState("visible", false);
    this.emit("hidden");
    return this;
  }

  show () {
    this.addBodyClass("checklist-visible");
    this.triggerState("visible");
    return this;
  }

  showInfo (info) {
    this.components.help.setContent(info);
    return this;
  }
}

module.exports = UI;
