// Listing Teardown: adjusted earnings, fair range and an SBA-style loan check from a listing's own numbers.
// Educational analysis. Every adjustment is shown, so the buyer can disagree with any of them.
// Industry presets are starting points (labelled as such on the page), not market data.
(function () {
  var form = document.getElementById("tool-form");
  var out = document.getElementById("result");
  var last = null;

  var PRESETS = {
    carwash:      { mult: "2.5,3.5", capex: "0.04", label: "car wash" },
    laundromat:   { mult: "3,4.5",   capex: "0.04", label: "laundromat" },
    homeservices: { mult: "2,3",     capex: "0.02", label: "home services" },
    auto:         { mult: "2,3",     capex: "0.02", label: "auto repair" },
    restaurant:   { mult: "1.5,2.5", capex: "0.04", label: "restaurant" },
    ecommerce:    { mult: "2.5,3.5", capex: "0.01", label: "online business" },
    other:        { mult: "2,3",     capex: "0.02", label: "business" }
  };
  function applyPreset() {
    var p = PRESETS[form.elements.industry.value] || PRESETS.other;
    form.elements.mult.value = p.mult; form.elements.capex.value = p.capex;
  }
  form.elements.industry.addEventListener("change", applyPreset);
  applyPreset();

  var QUESTIONS = [
    "Which add-backs are documented with a receipt or a tax return, and which are the seller's memory?",
    "What did the owner actually do each week, and what would it cost to hire that person?",
    "Are the last three years' numbers from tax returns or from internal books, and do they match?",
    "What's the lease term, the rent, and what happens to rent at renewal?",
    "Which customers are more than 10% of revenue, and would they stay without the owner?",
    "What equipment or vehicles will need replacing in the next three years, and at what cost?",
    "Why is the seller selling, and when did they decide?",
    "Has the price been cut or the listing relisted, and how long has it been on the market?",
    "What's the trailing-twelve-months revenue versus the year shown in the listing?",
    "Will the seller finance part of the price, and on what terms?"
  ];

  function annualDebtService(principal, ratePct, years) {
    if (principal <= 0) return 0;
    var r = ratePct / 100 / 12, n = years * 12;
    if (r <= 0) return principal / years;
    return 12 * principal * r / (1 - Math.pow(1 + r, -n));
  }

  document.getElementById("run").addEventListener("click", function () {
    var industry = form.elements.industry.value, label = (PRESETS[industry] || PRESETS.other).label;
    var state = String(form.elements.state.value || "").trim().toUpperCase().slice(0, 2);
    var asking = num(form, "asking"), sde = num(form, "sde"), revenue = num(form, "revenue");
    var addbacks = num(form, "addbacks"), verify = parseFloat(form.elements.verify.value);
    var salary = num(form, "salary"), capexPct = parseFloat(form.elements.capex.value), rent = num(form, "rent");
    var m = form.elements.mult.value.split(",").map(parseFloat), mLo = m[0], mHi = m[1];
    var down = parseFloat(form.elements.down.value), rate = num(form, "rate") || 10.5;

    if (!sde || !asking) { out.hidden = false; out.innerHTML = '<p class="flag bad">Enter at least the asking price and the listed cash flow.</p>'; return; }

    var unverified = addbacks * (1 - verify);
    var capex = revenue * capexPct;
    var adjusted = sde - unverified - salary - capex - rent;
    var fairLo = adjusted * mLo, fairHi = adjusted * mHi;
    var askMultListed = asking / sde;
    var askMultAdj = adjusted > 0 ? asking / adjusted : NaN;
    var gap = asking - fairHi;
    var loan = asking * (1 - down);
    var debt = annualDebtService(loan, rate, 10);
    var dscr = debt > 0 ? adjusted / debt : NaN;
    var cashLeft = adjusted - debt;

    var flags = [];
    if (adjusted <= 0) flags.push(['bad', "After replacing the owner and reserving for capex, there's nothing left. You'd be buying a job, not a business. Either the listed cash flow is wrong or the price should be close to asset value."]);
    if (debt > 0 && isFinite(dscr) && dscr < 1.25) flags.push(['bad', "At this price the loan payments would take " + (adjusted > 0 ? Math.round(100 * debt / adjusted) + "%" : "more than all") + " of what you'd actually earn. Lenders commonly want earnings of at least 1.25× the payments; this deal is at " + (isFinite(dscr) ? dscr.toFixed(2) : "below 0") + "×. As listed, it likely doesn't finance, or it finances and you work for the bank."]);
    else if (debt > 0 && dscr < 1.5) flags.push(['warn', "The loan works on paper (" + dscr.toFixed(2) + "× coverage) but leaves little room for a bad year. One lost customer or one broken machine and you're short."]);
    if (addbacks / sde > 0.3) flags.push(['bad', "Add-backs are " + Math.round(100 * addbacks / sde) + "% of the listed earnings. Above 30% is where sellers do most of their inflating. Ask for every one, with documents."]);
    else if (addbacks / sde > 0.15) flags.push(['warn', "Add-backs are " + Math.round(100 * addbacks / sde) + "% of listed earnings. Normal, but verify each one before you believe the total."]);
    if (askMultListed > mHi + 0.5) flags.push(['bad', "Asking price is " + askMultListed.toFixed(1) + "× the listed earnings, above the top of the usual range for a " + label + " even before adjustments."]);
    else if (isFinite(askMultAdj) && askMultAdj > mHi) flags.push(['warn', "Looks fair on the listing's numbers (" + askMultListed.toFixed(1) + "×) but is " + askMultAdj.toFixed(1) + "× what you'd actually earn."]);
    if (revenue > 0 && sde / revenue > 0.4 && industry !== "laundromat" && industry !== "carwash") flags.push(['warn', "Listed earnings are " + Math.round(100 * sde / revenue) + "% of revenue. Margins that high are rare for a " + label + "; they usually mean unpaid owner labor or missing costs."]);
    if (!revenue) flags.push(['warn', "No revenue entered, so no capex reserve and no margin check. Listings that hide revenue usually have a reason."]);
    if (rent === 0 && industry !== "ecommerce") flags.push(['warn', "Rent gap set to 0. A below-market lease that resets at renewal is the most common surprise after closing. Ask for the lease."]);
    if (!flags.some(function (f) { return f[0] === 'bad'; })) flags.unshift(['good', "No deal-breakers on the numbers as entered. The teardown checks what the calculator can't: the add-back list itself, the lease, the trend, and the broker's language."]);

    last = { industry: industry, state: state, asking: asking, sde: sde, revenue: revenue, addbacks: addbacks, verify: verify,
      salary: salary, capex: capexPct, rent: rent, multiple: form.elements.mult.value, down: down, rate: rate,
      adjusted: Math.round(adjusted), fair_lo: Math.round(fairLo), fair_hi: Math.round(fairHi), dscr: isFinite(dscr) ? dscr.toFixed(2) : "" };
    var r = {}; for (var k in last) r[k] = last[k]; r.type = "run";
    submitProbe(r);

    var summary = "Listing teardown (free calculator) · " + label + (state ? ", " + state : "") +
      "\nAsking " + fmt$(asking) + " · listed cash flow " + fmt$(sde) +
      "\nAdjusted earnings " + fmt$(adjusted) + " · fair range " + fmt$(fairLo) + "–" + fmt$(fairHi) +
      (debt > 0 ? "\nLoan coverage " + (isFinite(dscr) ? dscr.toFixed(2) : "<0") + "× · cash left after payments " + fmt$(cashLeft) + "/yr" : "");

    out.hidden = false;
    out.innerHTML =
      '<p class="small">What you\'d actually earn, after the adjustments a buyer\'s accountant would make:</p>' +
      '<div class="big">' + fmt$(adjusted) + ' <span class="small">a year</span></div>' +
      '<dl class="kv">' +
        '<dt>Listed cash flow (SDE)</dt><dd>' + fmt$(sde) + '</dd>' +
        '<dt>Unverified add-backs removed</dt><dd>' + fmt$(-unverified) + '</dd>' +
        '<dt>Replacing the owner</dt><dd>' + fmt$(-salary) + '</dd>' +
        '<dt>Capex reserve (' + Math.round(capexPct * 100) + '% of revenue)</dt><dd>' + fmt$(-capex) + '</dd>' +
        '<dt>Rent gap</dt><dd>' + fmt$(-rent) + '</dd>' +
      '</dl>' +
      '<dl class="kv">' +
        '<dt>Fair price range at ' + mLo + '–' + mHi + '× adjusted</dt><dd>' + fmt$(fairLo) + ' – ' + fmt$(fairHi) + '</dd>' +
        '<dt>Asking price</dt><dd>' + fmt$(asking) + (isFinite(askMultAdj) ? ' (' + askMultAdj.toFixed(1) + '× adjusted)' : '') + '</dd>' +
        '<dt>' + (gap > 0 ? 'Asking is above the range by' : 'Asking is inside or below the range by') + '</dt><dd>' + fmt$(Math.abs(gap)) + '</dd>' +
      '</dl>' +
      (debt > 0 ?
      '<dl class="kv">' +
        '<dt>Loan (' + Math.round((1 - down) * 100) + '% of asking, 10 yrs at ' + rate + '%)</dt><dd>' + fmt$(loan) + '</dd>' +
        '<dt>Payments per year</dt><dd>' + fmt$(-debt) + '</dd>' +
        '<dt>Coverage (lenders commonly want 1.25×+)</dt><dd>' + (isFinite(dscr) ? dscr.toFixed(2) + '×' : '—') + '</dd>' +
        '<dt>Cash left for you each year</dt><dd>' + fmt$(cashLeft) + '</dd>' +
      '</dl>' : '') +
      flags.map(function (f) { return '<p class="flag ' + f[0] + '">' + f[1] + '</p>'; }).join('') +
      '<h3 style="margin:20px 0 8px;font-size:17px">Three of the ten questions to ask the broker</h3>' +
      '<ol class="q">' + QUESTIONS.slice(0, 3).map(function (q) { return '<li>' + q + '</li>'; }).join('') +
      '<li class="locked">Seven more, with the answers that mean walk away, in the $49 teardown.</li></ol>' +
      '<p><button type="button" class="secondary" id="copy">Copy this result</button></p>';
    document.getElementById("copy").addEventListener("click", function (e) { copyText(summary, e.target); });
    var btn = document.getElementById("capture-btn");
    if (btn) btn.textContent = "Send me the weekly teardown + " + label + " alerts";
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Inline capture: email + stage, with the last calculation attached so we know what they're looking at.
  var cf = document.getElementById("capture-form"), msg = document.getElementById("capture-msg");
  if (cf) {
    if (!probeHasForm) { cf.querySelector("button").setAttribute("aria-disabled", "true"); msg.textContent = "Sign-ups open shortly."; }
    document.getElementById("capture-btn").addEventListener("click", function () {
      var email = String(cf.elements.email.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "That email doesn't look right."; return; }
      var d = {}; if (last) for (var k in last) d[k] = last[k];
      d.type = "signup"; d.email = email; d.stage = cf.elements.stage.value;
      if (!d.industry) d.industry = form.elements.industry.value;
      if (submitProbe(d)) { msg.textContent = "You're in. The first teardown lands this week."; cf.elements.email.value = ""; }
      else msg.textContent = "Sign-ups open shortly.";
    });
  }
})();
