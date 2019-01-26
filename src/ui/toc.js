const Overview = require("./overview.js");
const Toolbar = require("./toolbar.js");
const View = require("./view.js");

function getEntries(parent) {
  const reducer = (accumulator, item) => {
    const value = (item.section) ? getEntries(item.section) : item;
    return accumulator.concat(value);
  };
  return parent.reduce(reducer, []);
}

class TOC extends View {
  constructor ({ ui, parent, publi }) {
    parent = publi.parent || parent; // Use publi.parent if it exists
    super("TOC", ui, parent);

    this.toc = publi.toc;
    this.entries = getEntries(this.toc);
    this.createMarkup().createReports().loadReportsFromCache();
    this.overview = this.createOverview();
    this.createEvents();
  }

  createMarkup () {
    const html = `
      <div id="checklist-toc-view" class="checklist-toc-view checklist-component visible">
        <div class="checklist-toc-view-contents">
          <h1>${this.t("toc-title")}</h1>
          <ul id="checklist-toc-stats" class="checklist-toc-stats"></ul>
          <ul id="checklist-toc" class="checklist-toc"></ul>
        </div>
      </div>
    `;
    this.createView(html);

    const createSection = (entry, $parent) => {
      const html = `
        <li class="checklist-toc-section">
          <h2 class="checklist-toc-section-heading">${entry.title}</h2>
          <ul class="checklist-toc-section-contents"></ul>
        </li>
      `;
      const $section = $(html).appendTo($parent);
      entry.$element = $section;
      const $contents = $section.find(".checklist-toc-section-contents");
      createChildren($contents, entry.section);
    };

    const createToolbar = (entry, $element) => {
      const type = entry.type || this.t("article");
      const icon = entry.icon || "<i class='far fa-file-alt'></i>";
      const headerHtml = `
        <div class="checklist-toc-entry-header">
          <div class="checklist-toc-entry-brand">${icon} ${type}</div>
        </div>
      `;
      const $toolbarParent = $(headerHtml);
      $toolbarParent.prependTo($element);
      return new Toolbar({
        ui: this.ui,
        parent: $toolbarParent,
        docId: entry.docId || entry.href,
        context: entry.context
      });
    };

    const createArticle = (entry, $parent) => {
      const html = `
        <li class="checklist-toc-entry checklist-report-container">
          <div class="checklist-toc-entry-contents"></div>
          <div class="checklist-toc-entry-footer">
            <a class="checklist-toggle-report-details" data-checklist-action="toggle-report-details">
              <span class="checklist-toggle-report-details-show"><i class="far fa-plus-square"></i> ${this.t("toc-show-details")}</span>
              <span class="checklist-toggle-report-details-hide"><i class="far fa-minus-square"></i> ${this.t("toc-hide-details")}</span>
            </a>
            <a class="checklist-report-run" data-checklist-action="report-run">
              <i class="far fa-play-circle"></i> ${this.t("toc-report-run")}
            </a>
          </div>
        </li>
      `;
      const $element = $(html);
      createToolbar(entry, $element);
      $parent.append($element);
      entry.$element = $element;
    };

    const createChildren = ($parent, entries) => {
      entries.forEach((entry) => {
        if (entry.section) {
          return createSection(entry, $parent);
        }
        createArticle(entry, $parent);
      });
    };

    const $toc = this.find("#checklist-toc");
    const toc = this.toc;
    createChildren($toc, toc);
    return this;
  }

  createReports () {
    this.entries.forEach((entry) => {
      if (entry.section) return;
      const element = entry.$element.find(".checklist-toc-entry-contents").get(0);
      const metadatas = `<p class="checklist-entry-title"><a href="${entry.href}">${entry.title}</a></p>`;
      const report = this.ui.createReport({
        parent: element,
        docId: entry.docId || entry.href,
        href: entry.href,
        metadatas,
        context: entry.context
      });
      entry.report = report;
    });
    return this;
  }

  loadReportsFromCache () {
    this.entries.forEach((entry) => {
      if (!entry.report) return;
      entry.report.fromCache();
    });
    return this;
  }

  createOverview () {
    const ui = this.ui;
    // TODO: maybe Overview should be a child of Pane and should communicate with TOC by using events ?
    const pane = ui.components.pane;
    const parent = pane.find("#checklist-pane-contents");
    return new Overview({ ui, parent });
  }

  createEvents () {
    // Event handlers definition
    const updateIndicators = () => {
      const indicators = this.getIndicators();
      this.overview.update(indicators);
    }

    const toggleFail = function (entry, flag = true) {
      const { $element, report } = entry;
      if (!flag && !$element.hasClass("checklist-report-failed")) return;
      $element.toggleClass("checklist-report-failed", flag);
      const $icon = report.find(".checklist-report-icon");
      const html = flag ? "<i class='fas fa-exclamation-triangle'></i>" : "";
      $icon.html(html);
    };

    const toggleDetailsButton = function (entry) {
      const { $element, report } = entry;
      const hasStatements = () => report.find(".checklist-statements .checklist-statement").length > 0;
      const hasRejections = () => report.find(".checklist-rejections .checklist-rejection").length > 0;
      const containsSomething = hasStatements() || hasRejections();
      $element.toggleClass("checklist-report-with-details", containsSomething);
    }

    const hideRunButton = function (entry) {
      entry.$element.find(".checklist-report-run").addClass("hidden");
    }

    // Events creation for each report
    this.entries.forEach((entry) => {
      const report = entry.report;
      const $element = entry.$element;

      // Update indicators in overview
      // TODO: add "beforeReset" ?
      ["run", "rated", "done", "failed"].forEach((eventName) => {
        report.on(eventName, () => updateIndicators());
      });

      // Update entry UI
      if (report.hasState("fromCache")) hideRunButton(entry);
      report.on("run", () => hideRunButton(entry));
      report.on("failed", () => toggleFail(entry));
      report.on("beforeReset", () => toggleFail(entry, false));
      report.on("afterUpdateView", () => toggleDetailsButton(entry));
    });

    // Run events for the first time
    this.entries.forEach(toggleDetailsButton);
    updateIndicators();

    return this;
  }

  getIndicators () {
    const states = {
      length: this.entries.length,
      blank: 0,
      done: 0,
      pending: 0,
      fromCache: 0,
      failed: 0
    }

    const updateStates = (report) => {
      const isRun = report.hasState("run");
      const isDone = report.hasState("done");
      const isFromCache = report.hasState("fromCache");
      const isFailed = report.hasState("failed");

      if (!isRun && !isFromCache) states.blank++;
      if (isDone) states.done++;
      if (isRun && !isDone) states.pending++;
      if (isFromCache) states.fromCache++;
      if (isFailed) states.failed++;
    }

    const ratings = {};
    const ratingsConf = this.getConfig("ratings", []);
    ratingsConf.forEach((el) => ratings[el.id] = 0);

    const updateRatings = (report) => {
      const r = report.rating;
      if (typeof r === "string") ratings[r]++;
    }

    this.entries.forEach((entry) => {
      if (!entry.report) return;
      const report = entry.report;
      updateStates(report);
      updateRatings(report);
    });

    return { states, ratings };
  }

  rerun (reports) {
    this.overview.reset();
    reports.forEach((report) => {
      report.rerun();
    });
    return this;
  }

  rerunAll () {
    return this.rerun(this.reports);
  }

  rerunUnchecked () {
    const isUnchecked = (el) => !el.hasState("done") && !el.hasState("run") && !el.hasState("fromCache");
    const unchecked = this.reports.filter(isUnchecked);
    return this.rerun(unchecked);
  }

  focus (duration = 300) {
    const $toc = this.get$element();
    const top = $toc.offset().top;
    $("html, body").animate({scrollTop: top}, duration);
    return this;
  }
}

module.exports = TOC;
