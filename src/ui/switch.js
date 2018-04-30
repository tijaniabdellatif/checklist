function startChecklist () {
  localStorage.setItem("checklist-on", true);
  location.reload();
}

function showSwitch () {
  // FIXME: window.t() n'existe pas, utiliser ui.t()
  const html = `
    <div id="checklist-start" class="checklist-start">
      <span>Checklist</span>
      <div class="checklist-switch">
        <div class="checklist-slider"></div>
      </div>
    </div>
  `;
  const $el = $(html);
  $el.on("click", function () {
    const $switch = $(this).find(".checklist-switch");
    $switch.one("transitionend", startChecklist);
    $switch.addClass("checked");
  });
  $("body").append($el);
}

module.exports = showSwitch;
