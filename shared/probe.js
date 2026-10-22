// Shared probe wiring: reads window.PROBE (config.js), fills the studio name and the paid CTA
// (payment link, else waitlist anchor, else disabled), submits to the probe's form in the background,
// and loads the analytics beacon.
(function () {
  var P = window.PROBE || {};
  document.querySelectorAll("[data-studio-name]").forEach(function (el) { el.textContent = P.studioName || "The Studio"; });

  var disc = document.querySelector("[data-disclaimer]");
  var discFoot = document.querySelector("[data-disclaimer-footer]");
  if (disc && discFoot && disc.textContent.trim()) discFoot.textContent = disc.textContent.trim();

  var hasForm = !!(P.form && P.form.action);
  window.probeHasForm = hasForm;

  var cta = document.getElementById("paid-cta");
  var note = document.getElementById("paid-note");
  if (cta) {
    if (P.paymentLinkUrl) {
      cta.href = P.paymentLinkUrl; cta.textContent = P.paidLabel || "Buy";
      if (note) note.textContent = "Card checkout by Stripe. Delivered by email.";
    } else if (hasForm) {
      cta.href = "#capture"; cta.removeAttribute("target"); cta.textContent = P.waitlistLabel || "Join the waitlist";
      if (note) note.textContent = "Checkout opens soon. The waitlist gets it first, at the launch price.";
    } else {
      cta.setAttribute("aria-disabled", "true"); cta.textContent = "Opening shortly";
    }
  }

  // Background submit to the probe's Google Form (studio/stack/form-setup.gs). Fire and forget.
  // window.submitProbe({type: "run" | "signup", ...fields}) returns true if sent.
  window.submitProbe = function (data) {
    if (!hasForm) return false;
    data.ref = data.ref || (document.referrer || "direct").slice(0, 200);
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) {
      if (P.form.entries[k] && data[k] !== "" && data[k] != null) body.append(P.form.entries[k], String(data[k]).slice(0, 500));
    });
    try { fetch(P.form.action, { method: "POST", mode: "no-cors", body: body }).catch(function () {}); } catch (e) { return false; }
    return true;
  };

  // Copy-to-clipboard helper: window.copyText(text, buttonEl)
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
