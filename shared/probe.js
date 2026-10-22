// Shared probe wiring: reads window.PROBE (config.js) and fills the studio name,
// the paid CTA (payment link or waitlist), the capture slot, and the analytics beacon.
(function () {
  var P = window.PROBE || {};
  document.querySelectorAll("[data-studio-name]").forEach(function (el) { el.textContent = P.studioName || "The Studio"; });

  var disc = document.querySelector("[data-disclaimer]");
  var discFoot = document.querySelector("[data-disclaimer-footer]");
  if (disc && discFoot && disc.textContent.trim()) discFoot.textContent = disc.textContent.trim();

  var cta = document.getElementById("paid-cta");
  var note = document.getElementById("paid-note");
  if (cta) {
    if (P.paymentLinkUrl) {
      cta.href = P.paymentLinkUrl; cta.textContent = P.paidLabel || "Buy";
      if (note) note.textContent = "Card checkout by Stripe. Delivered by email.";
    } else if (P.formUrl) {
      cta.href = P.formUrl; cta.textContent = P.waitlistLabel || "Join the waitlist";
      if (note) note.textContent = "Checkout opens soon. Waitlist gets it first, at the launch price.";
    } else {
      cta.setAttribute("aria-disabled", "true"); cta.textContent = "Opening shortly";
    }
  }

  var slot = document.getElementById("capture-slot");
  if (slot) {
    if (P.formUrl) {
      var a = document.createElement("a");
      a.className = "primary"; a.href = P.formUrl; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Send me the result";
      slot.appendChild(a);
    } else {
      slot.innerHTML = '<p class="small">Waitlist opens shortly.</p>';
    }
  }

  // Copy-to-clipboard helper for tool pages: window.copyText(text, buttonEl)
  window.copyText = function (text, btn) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(function () {
      if (btn) { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1500); }
    });
  };

  // Number helpers
  window.fmt$ = function (n) { if (!isFinite(n)) return "—"; var s = Math.round(Math.abs(n)).toLocaleString("en-US"); return (n < 0 ? "−$" : "$") + s; };
  window.num = function (form, name) { var v = parseFloat(String((form.elements[name] || {}).value || "").replace(/[^0-9.\-]/g, "")); return isFinite(v) ? v : 0; };

  if (P.cfBeaconToken) {
    var s = document.createElement("script");
    s.defer = true; s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: P.cfBeaconToken }));
    document.body.appendChild(s);
  }
})();
