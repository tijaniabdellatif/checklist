const svg = require("./svg.json");
const View = require("./view.js");

function getHtml (buttonsCreator, docId) {
  if (typeof buttonsCreator !== "function") return;

  const getButton = (infos) => {
    const icon = (infos.icon && svg[infos.icon]);
    const text = icon || infos.title;
    const title = icon ? `title="${infos.title}"`: "";
    const attrs = [];
    for (let attr in infos.attributes) {
      const value = infos.attributes[attr];
      attrs.push(`${attr}="${value}"`);
    }
    const button = `
      <a class="checklist-toolbar-button" ${title} ${attrs.join(" ")}>
        ${text}
      </a>
    `;
    return button;
  };

  const infos = buttonsCreator(docId);
  const buttonsHtml = infos.map(getButton).join("\n");
  const html = `
    <div class="checklist-report-toolbar">
      ${buttonsHtml}
    </div>
  `;
  return html;
}

class Toolbar extends View {
  constructor ({ ui, parent, docId }) {
    super("Toolbar", ui, parent);

    const html = getHtml(ui.buttonsCreator, docId);
    this.createView(html);
  }
}

module.exports = Toolbar;
