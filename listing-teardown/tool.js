// Listing Teardown: adjusted earnings and fair range from a listing's own numbers.
// Educational analysis. Every adjustment is shown, so the buyer can disagree with any of them.
(function () {
  var form = document.getElementById("tool-form");
  var out = document.getElementById("result");
  var runs = 0;

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

  document.getElementById("run").addEventListener("click", function () {
    var asking = num(form, "asking"), sde = num(form, "sde"), revenue = num(form, "revenue");
    var addbacks = num(form, "addbacks"), verify = parseFloat(form.elements.verify.value);
    var salary = num(form, "salary"), capexPct = parseFloat(form.elements.capex.value), rent = num(form, "rent");
    var m = form.elements.mult.value.split(",").map(parseFloat), mLo = m[0], mHi = m[1];

    if (!sde && !asking) { out.hidden = false; out.innerHTML = '<p class="flag bad">Enter at least the asking price and the listed cash flow.</p>'; return; }

    var unverified = addbacks * (1 - verify);
    var capex = revenue * capexPct;
    var adjusted = sde - unverified - salary - capex - rent;
    var fairLo = adjusted * mLo, fairHi = adjusted * mHi;
    var askMultListed = sde > 0 ? asking / sde : NaN;
    var askMultAdj = adjusted > 0 ? asking / adjusted : NaN;
    var gap = asking - fairHi;

    var flags = [];
    if (adjusted <= 0) flags.push(['bad', "After replacing the owner and reserving for capex, there's nothing left. You'd be buying a job, not a business. Either the listed SDE is wrong or the price should be close to asset value."]);
    if (sde > 0 && addbacks / sde > 0.3) flags.push(['bad', "Add-backs are " + Math.round(100 * addbacks / sde) + "% of the listed earnings. Above 30% is where sellers do most of their inflating. Ask for every one, with documents."]);
    else if (sde > 0 && addbacks / sde > 0.15) flags.push(['warn', "Add-backs are " + Math.round(100 * addbacks / sde) + "% of listed earnings. Normal, but verify each one before you believe the total."]);
    if (isFinite(askMultListed) && askMultListed > mHi + 0.5) flags.push(['bad', "Asking price is " + askMultListed.toFixed(1) + "× the listed earnings, above the top of the range for this kind of business even before adjustments."]);
    if (isFinite(askMultAdj) && askMultAdj > mHi && (!isFinite(askMultListed) || askMultListed <= mHi + 0.5)) flags.push(['warn', "Looks fair on the listing's numbers (" + askMultListed.toFixed(1) + "×) but is " + askMultAdj.toFixed(1) + "× what you'd actually earn."]);
    if (revenue > 0 && sde / revenue > 0.4) flags.push(['warn', "Listed earnings are " + Math.round(100 * sde / revenue) + "% of revenue. Margins that high are rare on Main Street; they usually mean unpaid owner labor or missing costs."]);
    if (!revenue) flags.push(['warn', "No revenue entered, so no capex reserve and no margin check. Listings that hide revenue usually have a reason."]);
    if (rent === 0) flags.push(['warn', "Rent gap set to 0. A below-market lease that resets at renewal is the most common surprise after closing. Ask for the lease."]);
    if (flags.length === 0 || (flags.length === 1 && flags[0][0] === 'warn' && rent === 0)) flags.unshift(['good', "No major flags on the numbers as entered. The teardown checks the listing itself: the add-back list, the lease, the trend, and the broker's language."]);

    runs++;
    var summary = "Listing teardown (free calculator)\nAsking " + fmt$(asking) + " · listed SDE " + fmt$(sde) +
      "\nAdjusted earnings " + fmt$(adjusted) + " · fair range " + fmt$(fairLo) + "–" + fmt$(fairHi) +
      (isFinite(askMultAdj) ? " · asking = " + askMultAdj.toFixed(1) + "× adjusted" : "");

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
      flags.map(function (f) { return '<p class="flag ' + f[0] + '">' + f[1] + '</p>'; }).join('') +
      '<h3 style="margin:20px 0 8px;font-size:17px">Three of the ten questions to ask the broker</h3>' +
      '<ol class="q">' + QUESTIONS.slice(0, 3).map(function (q) { return '<li>' + q + '</li>'; }).join('') +
      '<li class="locked">Seven more, with the answers that mean walk away, in the $49 teardown.</li></ol>' +
      '<p><button type="button" class="secondary" id="copy">Copy this result</button></p>';
    document.getElementById("copy").addEventListener("click", function (e) { copyText(summary, e.target); });
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
