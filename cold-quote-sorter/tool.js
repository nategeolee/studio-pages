// Cold-quote sorter: open-quotes CSV -> ranked call list (value x warmth x neglect), three drafted texts per quote,
// a call script for the top ten. Everything runs in the browser; nothing is uploaded, stored or sent except an
// anonymous "ran, N rows" count to the probe's form.
(function () {
  var form = document.getElementById("tool-form");
  var csvBox = document.getElementById("csv");
  var mapBox = document.getElementById("mapping");
  var out = document.getElementById("result");
  var DAY = 86400000;
  var FIELDS = [
    { key: "customer", sel: "m_customer", re: /customer|client|name|contact/i },
    { key: "value", sel: "m_value", re: /value|amount|total|price|\$/i },
    { key: "date", sel: "m_date", re: /quote.*date|sent|created|issued|^date$/i },
    { key: "touch", sel: "m_touch", re: /last|contact|touch|follow|activity/i }
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Minimal CSV parser: commas, quoted fields, doubled quotes, CRLF.
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); f = ""; if (row.join("").trim()) rows.push(row); row = []; }
      else f += c;
    }
    row.push(f); if (row.join("").trim()) rows.push(row);
    return rows.map(function (r) { return r.map(function (x) { return x.trim(); }); });
  }

  function parseDate(s) {
    s = String(s || "").trim(); if (!s) return null;
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (m) { var y = +m[3]; if (y < 100) y += 2000; return new Date(y, +m[1] - 1, +m[2]); }
    var t = Date.parse(s); return isFinite(t) ? new Date(t) : null;
  }
  function parseMoney(s) { var v = parseFloat(String(s || "").replace(/[^0-9.\-]/g, "")); return isFinite(v) ? v : null; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function nice(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  // Greeting name: "Dana Ruiz" -> Dana, "Ruiz, Dana" -> Dana; businesses, families and titles keep the full name.
  function first(name) {
    var s = String(name).trim(); if (!s) return "there";
    if (/,/.test(s)) { var parts = s.split(",").map(function (x) { return x.trim(); }); if (parts[1] && !/\b(llc|inc|co|ltd)\b/i.test(parts[1])) s = parts[1] + " " + parts[0]; }
    var w = s.split(/\s+/);
    if (w.length !== 2 || /^(mr|mrs|ms|dr)\.?$/i.test(w[0]) || /\b(family|hoa|llc|inc|co|corp|dental|church|school|properties|management|group|association|apartments|services|the)\b|&/i.test(s)) return s;
    return w[0];
  }

  function sampleCSV() {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var ago = function (n) { return iso(new Date(t - n * DAY)); };
    var rows = [["customer", "quote value", "quote date", "last contact date"],
      ["Dana Ruiz", "$8,450", ago(12), ago(12)], ["Mike Chen", "$1,200", ago(3), ago(1)],
      ["Patel Family", "$14,900", ago(41), ago(30)], ["Joan Whitaker", "$650", ago(8), ago(8)],
      ["Greenway Dental", "$22,300", ago(19), ago(5)], ["Tom Becker", "$3,975", ago(27), ago(20)],
      ["Lisa Moreno", "$5,600", ago(6), ago(6)], ["Ray Okafor", "$2,150", ago(95), ago(80)],
      ["Hillside HOA", "$31,000", ago(60), ago(45)], ["Karen Liu", "$4,300", ago(15), ago(2)],
      ["Steve Novak", "$9,800", ago(33), ago(33)], ["Alma Torres", "$1,875", ago(21), ago(14)]];
    return rows.map(function (r) { return r.map(function (x) { return /,/.test(x) ? '"' + x + '"' : x; }).join(","); }).join("\n");
  }

  var rows = null;
  function loadText(text) {
    rows = parseCSV(text);
    if (rows.length < 2) { mapBox.hidden = true; return; }
    var head = rows[0];
    FIELDS.forEach(function (f, fi) {
      var sel = form.elements[f.sel];
      var opts = (f.key === "touch" ? '<option value="-1">None (use quote date)</option>' : "") +
        head.map(function (h, i) { return '<option value="' + i + '">' + esc(h || "Column " + (i + 1)) + '</option>'; }).join("");
      sel.innerHTML = opts;
      var guess = -1;
      head.forEach(function (h, i) { if (guess < 0 && f.re.test(h) && !(f.key === "date" && /last/i.test(h))) guess = i; });
      if (guess < 0 && f.key !== "touch") guess = Math.min(fi, head.length - 1);
      sel.value = String(guess);
    });
    mapBox.hidden = false;
  }
  csvBox.addEventListener("input", function () { loadText(csvBox.value); });
  document.getElementById("file").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    var r = new FileReader(); r.onload = function () { csvBox.value = String(r.result); loadText(csvBox.value); }; r.readAsText(file);
  });
  document.getElementById("sample").addEventListener("click", function (e) { e.preventDefault(); csvBox.value = sampleCSV(); loadText(csvBox.value); });
  var dl = document.getElementById("sample-dl");
  dl.addEventListener("click", function () { dl.href = "data:text/csv;charset=utf-8," + encodeURIComponent(sampleCSV()); });

  function texts(q, sender) {
    var n = first(q.customer), who = sender || "[your name]", v = fmt$(q.value), d = nice(q.date);
    return [
      "Hi " + n + ", it's " + who + ". Checking in on the " + v + " quote we sent " + d + ". Any questions I can answer, or anything you'd like changed?",
      "Hi " + n + ", " + who + " here. We have openings in the next couple of weeks if you'd like to get your job on the calendar. Want me to hold a spot?",
      "Hi " + n + ", " + who + " again. I don't want to keep bugging you about the quote from " + d + ". Should I close it out, or is it still on your list? Either answer helps."
    ];
  }
  function script(q, sender) {
    var n = first(q.customer), who = sender || "[your name]";
    return "Hi " + n + ", this is " + who + ". I'm calling about the " + fmt$(q.value) + " quote we sent on " + nice(q.date) + ". " +
      "Do you have a minute? ... Did you get a chance to look it over? ... Is there anything about the price, timing or scope that's holding you back? ... " +
      "If it helps, I can walk you through it or adjust it today. Would you like to get it on the schedule, or should I check back on a date that suits you?";
  }

  document.getElementById("run").addEventListener("click", function () {
    out.hidden = false;
    if (!rows || rows.length < 2) { out.innerHTML = '<p class="flag bad">Paste a CSV with a header row and at least one quote, or try the sample.</p>'; return; }
    var ix = {}; FIELDS.forEach(function (f) { ix[f.key] = parseInt(form.elements[f.sel].value, 10); });
    var sender = String(form.elements.sender.value || "").trim().slice(0, 60);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var qs = [], skipped = 0;
    rows.slice(1, 501).forEach(function (r) {
      var value = parseMoney(r[ix.value]), date = parseDate(r[ix.date]);
      var touch = ix.touch >= 0 ? parseDate(r[ix.touch]) : null;
      var customer = (r[ix.customer] || "").trim();
      if (!customer || value == null || value <= 0 || !date) { skipped++; return; }
      if (!touch || touch < date) touch = date;
      var age = Math.max(0, Math.round((today - date) / DAY)), since = Math.max(0, Math.round((today - touch) / DAY));
      var warmth = Math.max(0.1, 1 - age / 90), neglect = Math.min(1, Math.max(0.15, since / 7));
      qs.push({ customer: customer, value: value, date: date, age: age, since: since, score: value * warmth * neglect });
    });
    if (!qs.length) { out.innerHTML = '<p class="flag bad">No rows could be read. Check the column choices above: each quote needs a customer, a value and a quote date.</p>'; return; }
    qs.sort(function (a, b) { return b.score - a.score; });

    var total = 0, atRisk = 0, stale = 0;
    qs.forEach(function (q) { total += q.value; if (q.since >= 7) atRisk += q.value; if (q.age > 90) stale++; });
    var html = '<p class="small" style="margin:0">Open quotes not touched in a week or more</p><p class="big">' + fmt$(atRisk) + '</p>' +
      '<dl class="kv"><dt>Open quotes read</dt><dd>' + qs.length + '</dd><dt>Total open value</dt><dd>' + fmt$(total) + '</dd>' +
      '<dt>Call first</dt><dd>' + esc(qs[0].customer) + '</dd></dl>';
    if (skipped) html += '<p class="flag">' + skipped + ' row' + (skipped > 1 ? "s" : "") + ' skipped (missing customer, value or a readable date).</p>';
    if (stale) html += '<p class="flag">' + stale + ' quote' + (stale > 1 ? "s are" : " is") + ' over 90 days old and ranked low; consider closing ' + (stale > 1 ? "them" : "it") + ' out.</p>';
    html += '<p class="small">Ranked by value × how fresh the quote is (fades to near zero by 90 days) × how long since you last reached out (full weight at 7 days).</p>';
    html += '<h3 style="font-size:17px;margin:16px 0 4px">Your call list</h3>';
    html += qs.map(function (q, i) {
      var t = texts(q, sender), id = "q" + i;
      var block = '<div style="border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:8px 0">' +
        '<strong>' + (i + 1) + '. ' + esc(q.customer) + '</strong> · ' + fmt$(q.value) +
        '<br><span class="small">Quoted ' + q.age + ' day' + (q.age === 1 ? "" : "s") + ' ago · last contact ' + q.since + ' day' + (q.since === 1 ? "" : "s") + ' ago</span>' +
        '<details style="margin-top:6px"><summary>Three follow-up texts' + (i < 10 ? " and a call script" : "") + '</summary>' +
        t.map(function (x, k) { return '<p style="margin:8px 0 4px">' + esc(x) + '</p><button type="button" class="secondary" data-copy="' + id + "t" + k + '">Copy text ' + (k + 1) + '</button>'; }).join("") +
        (i < 10 ? '<p style="margin:12px 0 4px"><em>Call script:</em> ' + esc(script(q, sender)) + '</p><button type="button" class="secondary" data-copy="' + id + 's">Copy script</button>' : "") +
        '</details></div>';
      q._t = t; q._s = i < 10 ? script(q, sender) : "";
      return block;
    }).join("");
    html += '<p class="small">These are drafts. Read each one before you send it from your own phone or CRM.</p>';
    out.innerHTML = html;
    out.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = b.getAttribute("data-copy").match(/^q(\d+)(t(\d)|s)$/); if (!m) return;
        var q = qs[+m[1]]; copyText(m[3] != null ? q._t[+m[3]] : q._s, b);
      });
    });
    // Anonymous count only: that it ran and how many quotes. No names, values or dates leave the browser.
    submitProbe({ type: "run", stage: "rows " + qs.length, ref: "cold-quote-sorter" });
  });

  var cf = document.getElementById("capture-form"), msg = document.getElementById("capture-msg");
  if (!window.probeHasForm) { document.getElementById("capture-btn").setAttribute("aria-disabled", "true"); msg.textContent = "Sign-ups open shortly."; }
  document.getElementById("capture-btn").addEventListener("click", function () {
    var email = String(cf.elements.email.value || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "That email doesn't look right."; return; }
    // Shared with probe 1's form: send only type, email, stage (quote software) and ref, so counts split by ref.
    var d = { type: "signup", email: email, stage: "software " + cf.elements.software.value, ref: "cold-quote-sorter" };
    if (submitProbe(d)) { msg.textContent = "You're on the list. You'll hear from us when the weekly sweep opens."; cf.elements.email.value = ""; }
    else msg.textContent = "Sign-ups open shortly.";
  });
})();
