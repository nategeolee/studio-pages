// GBP reinstatement checklist: pick the notice reason -> matching documents
// (what each must show) and a day 1/3/7/14 chase plan. Static text in the browser;
// nothing is uploaded or stored. A run sends only type, the reason id, and ref.
(function () {
  var P = window.PROBE || {};
  var form = document.getElementById("tool-form");
  var out = document.getElementById("result");
  var reasonSel = document.getElementById("reason");
  var noticeSel = document.getElementById("notice");

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function link(url, label) {
    if (!url) return esc(label);
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + "</a>";
  }

  // Core evidence Google lists on "Fix suspended or disabled profiles"
  // (support.google.com/business/answer/4569145): registration, license,
  // tax certificates, utility bills; name and address must match the profile.
  var CORE = [
    { name: "Official business registration", must: "The legal business name and address should match the profile. If they differ (a DBA, an old address), say so plainly in the appeal text." },
    { name: "A business license", must: "Current, issued to this business, with the same name and address as the profile wherever the license prints them." },
    { name: "Tax certificates", must: "The same business name and, if an address appears, the same address as the profile." },
    { name: "Utility bills (electricity, phone, water or internet)", must: "A recent bill whose service address matches the profile. A business name on the bill is stronger than a personal name alone." }
  ];

  var CHASE = [
    { day: "Day 1 — Prepare, then file once", items: [
      "Read the notice: the decision date, the reason, the policy link, and whether it can be appealed.",
      "Compare the profile's name, address, category, phone, website and hours to your real-world business and to your documents.",
      "Fix only what clearly breaks Google's guidelines. Don't make test edits to see what happens.",
      "Do not create a new Business Profile for the same business.",
      "Gather your documents. Google says the business name and address on each file should match the profile you are appealing.",
      "Submit one appeal in Google's appeals tool with the documents and a short, factual explanation. Google says an appeal can only be submitted once, so attach everything this time."
    ]},
    { day: "Day 3 — Check, don't refile", items: [
      "Open the appeals tool and write down the status: Submitted, Approved, Not Approved, Can't be appealed, or Eligible for appeal.",
      "Do not submit a second appeal, and do not create a new listing."
    ]},
    { day: "Day 7 — Check again", items: [
      "If the status is still Submitted, wait for Google's email and keep copies of what you sent.",
      "If it is Approved, check the public listing (name, address, hours, category).",
      "If it is Not Approved, start gathering evidence that was not in the first appeal. Google may allow an additional review after a denial."
    ]},
    { day: "Day 14 — Decision or additional review", items: [
      "If it is still Submitted, check the tool again. Still don't create a new profile.",
      "If it is Not Approved, request the additional review and attach only evidence that wasn't in the original appeal.",
      "If it is Approved, confirm the public profile still matches your documents.",
      "If a Google account restriction caused the suspension, the profile appeal waits until that account restriction is lifted."
    ]}
  ];

  var REASONS = [
    {
      id: "quality-issues",
      label: "Quality issues, or the notice isn't specific",
      blurb: "Google's help pages themselves mention listings 'suspended due to quality issues,' and many notices don't name a narrower policy. Treat this as a representation and eligibility check first, then file with Google's standard evidence.",
      extra: [
        { name: "Photos of the real location", must: "For a storefront: the exterior with permanent signage, the entrance from the street, and the customer-facing interior. For a service-area business: branded vehicle, tools or work-in-progress that show what you actually do — no customer personal data in the frame." },
        { name: "A one-page explanation", must: "What the business does, whether customers visit you or you visit them, and that the name and address on the documents match the profile." }
      ],
      day1: []
    },
    {
      id: "name-representation",
      label: "Business name or how the business is represented",
      blurb: "Google's guidelines say the profile name must be the real-world name used on signage, the website and stationery. Marketing taglines, extra keywords, categories, cities, hours, phone numbers or URLs in the name can get a profile suspended.",
      extra: [
        { name: "Storefront signage, stationery, invoices or business cards", must: "They should consistently show the same name you want on the profile. Google asks for this kind of real-world proof if the name includes legal terms (LLC, Ltd) or special characters." },
        { name: "Website homepage", must: "The public name on the site should match the profile name you are appealing, not a keyword-stuffed variant." }
      ],
      day1: ["Before you appeal, edit the profile name so it matches the real-world name. Take keywords, taglines, hours, cities and URLs out of the name and put that information in the proper fields."]
    },
    {
      id: "address-pobox",
      label: "Address, PO box, virtual office or mailbox",
      blurb: "Google does not accept a PO box or a remote mailbox as the business address. The profile should use the real-world location, or hide the address if customers do not visit you there.",
      extra: [
        { name: "Lease, deed or occupancy document", must: "The tenant or owner name and the street address should match the profile. Suite or unit numbers belong on address line 2, not stuffed into the business name." },
        { name: "Exterior photos at that address", must: "Readable street number and, if customers visit, permanent signage at that location — not a mailbox store or virtual-office lobby shared by unrelated brands." }
      ],
      day1: ["If customers visit you during stated hours, the address must be that staffed location. If you go to them, hide the address and set a realistic service area before you appeal. Do not replace a mailbox with another mailbox."]
    },
    {
      id: "not-eligible",
      label: "The business isn't eligible, or Google says it doesn't exist here",
      blurb: "To qualify, Google says a business must make in-person contact with customers during its stated hours. Online-only brands, lead-generation companies, and businesses that don't exist at the claimed address are not eligible.",
      extra: [
        { name: "Proof of in-person customer contact", must: "Photos or records that show customers are served in person at the stated place or, for a service-area business, at the customer's location during the stated hours." },
        { name: "Location photos", must: "If Google says the business doesn't exist there: exterior, entrance and interior at the claimed address, plus a document that ties the business name to that address." }
      ],
      day1: ["Read Google's eligibility rules before you appeal. If the business is online-only or only generates leads for other companies, documents will not make it eligible."]
    },
    {
      id: "service-area",
      label: "Service-area vs storefront (customers don't visit this address)",
      blurb: "If customers do not visit your address during stated hours — a plumber, roofer, cleaner, mobile locksmith, a contractor working from home — the profile should usually hide the address and set a service area.",
      extra: [
        { name: "Documents that show where the business is registered", must: "Registration, license or insurance should list the same address you use behind the hidden service-area setting." },
        { name: "Photos of how you serve customers on site", must: "Branded vehicle, uniforms, tools or work in progress. Do not upload customer names, faces, house numbers or invoices with someone else's personal details." }
      ],
      day1: ["Before you appeal, hide the address if customers don't visit, and set a service area you actually cover. Don't display a home or virtual office as if it were a shop."]
    },
    {
      id: "duplicate",
      label: "Duplicate profile",
      blurb: "Google allows one Business Profile per business. Extra profiles for the same business at the same address can be marked as duplicates. Two distinct, eligible businesses at one address can each have a profile if their names and signage are clearly different.",
      extra: [
        { name: "Permanent signage for each business", must: "If you believe two real businesses were merged by mistake, Google asks for evidence of permanent signage that clearly shows both names at the location." },
        { name: "A short list of the profiles you manage", must: "Which profile should stay, which is the duplicate, and the Business Profile ID for each, so the appeal is specific." }
      ],
      day1: ["If it is one business, do not create another profile to replace the suspended one. If they are two distinct eligible businesses, gather signage that shows both names before you appeal."]
    },
    {
      id: "account-restricted",
      label: "My Google account is restricted (all my profiles are suspended)",
      blurb: "If the Google account itself is restricted, every Business Profile on that account is suspended. Google says to appeal the account first on your My accounts page; only after that restriction is lifted do you appeal each Business Profile.",
      extra: [
        { name: "The same standard business documents", must: "Have registration, license, tax certificates and utility bills ready for the profile appeal that comes after the account is restored. Name and address must still match each profile." }
      ],
      day1: ["Appeal the account restriction first, not the individual profile. After Google lifts the account restriction, submit a separate profile appeal with the matching documents. Do not create new profiles from another account while you wait."]
    },
    {
      id: "fake-engagement",
      label: "Fake reviews or fake engagement",
      blurb: "Google may restrict a profile for fake engagement (incentivized or manipulated reviews). That can mean no new reviews for a time, unpublished ratings, or a public warning — and sometimes a wider suspension.",
      extra: [
        { name: "A short statement of what you stopped", must: "If reviews were solicited with a reward or posted by someone who did not visit, say that the practice has stopped. Documents that prove the business is real still help if the whole profile was suspended, but they do not excuse fake engagement." }
      ],
      day1: ["Stop any review gating, incentives or third-party review posting before you appeal. A stack of licenses will not help if the conduct is still happening."]
    },
    {
      id: "prohibited-content",
      label: "Prohibited or restricted content",
      blurb: "Everything on the profile — description, photos, posts, products — has to follow Google's prohibited and restricted content rules. If the business actually offers something Google does not allow on a Business Profile, documents will not make it eligible.",
      extra: [
        { name: "Photos and pages that show what you actually offer", must: "Only if the flag is wrong: current photos, menu or service list, and the website, so the real activity is obvious. Remove any content that does break the rules before you appeal." }
      ],
      day1: ["Remove content that doesn't follow Google's prohibited and restricted content rules, then appeal. Do not file an appeal that argues for content those rules disallow."]
    },
    {
      id: "not-approved",
      label: "My last appeal was not approved",
      blurb: "Google says that if a reinstatement request is denied, you may be able to request an additional review and provide evidence that was not in the original appeal. Don't send the same files again and hope for a different result.",
      extra: [
        { name: "New evidence only", must: "Files Google has not already seen, still matching the profile name and address: a newer utility bill, a missing license, better location photos, or a clearer explanation of a name or address difference." },
        { name: "A list of what you sent the first time", must: "So you can see the gap and attach only what was missing, which is what Google asks for on an additional review." }
      ],
      day1: ["Do not file a brand-new first appeal with the same packet. Use the additional-review path and attach only evidence that was not in the original appeal."]
    }
  ];

  function fillSelect(sel) {
    sel.innerHTML = REASONS.map(function (r) {
      return '<option value="' + esc(r.id) + '">' + esc(r.label) + "</option>";
    }).join("");
  }
  fillSelect(reasonSel);
  fillSelect(noticeSel);

  function docsFor(reason) { return CORE.concat(reason.extra || []); }

  function chaseFor(reason) {
    return CHASE.map(function (block, i) {
      var items = block.items.slice();
      if (i === 0 && reason.day1 && reason.day1.length) items = reason.day1.concat(items);
      return { day: block.day, items: items };
    });
  }

  function render(reason) {
    var docs = docsFor(reason);
    var chase = chaseFor(reason);
    var html = "";
    html += '<p class="small" style="margin:0">Documents that match</p>';
    html += '<p class="big">' + esc(reason.label) + "</p>";
    html += "<p>" + esc(reason.blurb) + "</p>";
    html += '<div class="flag">On every document, Google asks that the business name and address match the profile you are appealing.</div>';
    html += '<h3 style="font-size:17px;margin:16px 0 8px">What to gather</h3>';
    html += docs.map(function (d) {
      return '<div class="flag"><strong>' + esc(d.name) + "</strong><br>" + esc(d.must) + "</div>";
    }).join("");
    html += '<h3 style="font-size:17px;margin:16px 0 8px">Chase checklist</h3>';
    html += chase.map(function (block) {
      return "<p><strong>" + esc(block.day) + "</strong></p><ol class=\"q\">" +
        block.items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
        "</ol>";
    }).join("");
    html += '<p><button type="button" class="secondary" id="copy-result">Copy this checklist</button></p>';
    html += '<p class="small">Not legal or financial advice, and not a promise of reinstatement. You file the appeal yourself in Google\'s tool.</p>';
    html += '<p class="small">' + link(P.helpAppealsUrl, "Google's official appeal help") +
      " · " + link(P.helpGuidelinesUrl, "Guidelines for representing your business") +
      " · " + link(P.helpEligibilityUrl, "Eligibility and ownership") +
      (reason.id === "duplicate" && P.helpDuplicatesUrl ? " · " + link(P.helpDuplicatesUrl, "Duplicate profiles") : "") +
      "</p>";
    out.hidden = false;
    out.innerHTML = html;
    var copyBtn = document.getElementById("copy-result");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var lines = [reason.label, "", reason.blurb, "", "On every document, the business name and address should match the profile.", "", "What to gather:"];
        docs.forEach(function (d) { lines.push("- " + d.name + ": " + d.must); });
        chase.forEach(function (block) {
          lines.push("", block.day);
          block.items.forEach(function (item) { lines.push("- " + item); });
        });
        lines.push("", "Not legal or financial advice. No promise of reinstatement. File the appeal yourself in Google's tool.");
        copyText(lines.join("\n"), copyBtn);
      });
    }
    if (noticeSel) noticeSel.value = reason.id;
  }

  document.getElementById("run").addEventListener("click", function () {
    var id = reasonSel.value;
    var reason = REASONS.filter(function (r) { return r.id === id; })[0];
    if (!reason) { out.hidden = false; out.innerHTML = '<p class="flag bad">Pick what your notice says.</p>'; return; }
    render(reason);
    submitProbe({ type: "run", stage: "reason " + reason.id, ref: "gbp-reinstatement" });
  });

  var cf = document.getElementById("capture-form"), msg = document.getElementById("capture-msg");
  if (!window.probeHasForm) { document.getElementById("capture-btn").setAttribute("aria-disabled", "true"); msg.textContent = "Sign-ups open shortly."; }
  document.getElementById("capture-btn").addEventListener("click", function () {
    var email = String(cf.elements.email.value || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "That email doesn't look right."; return; }
    var d = { type: "signup", email: email, stage: "notice " + cf.elements.notice.value, ref: "gbp-reinstatement" };
    if (submitProbe(d)) { msg.textContent = "You're on the list. You'll hear from us when the appeal packet opens."; cf.elements.email.value = ""; }
    else msg.textContent = "Sign-ups open shortly.";
  });
})();
