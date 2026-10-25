// Studio Operating Kit: 10 yes/no guardrail questions -> score out of 10, the gaps, and the kit part that closes each.
// Arithmetic and static text only. Nothing connects to the visitor's agents.
(function () {
  var Q = [
    { id: "send",   q: "Does anything an agent sends (email, post, message) wait for your approval?", fix: "Approval gates: drafts by default, a send needs a yes.", part: "Approval gates" },
    { id: "spend",  q: "Is there a hard spend cap per agent or per day?", fix: "A written cap per lane, checked on every run.", part: "House rules" },
    { id: "check",  q: "Does something check reality daily (what ran, what it cost, what broke)?", fix: "A daily operator check that reads every lane and names misses.", part: "Daily operator skill" },
    { id: "owner",  q: "Does every lane (task, file, routine) have exactly one owner agent?", fix: "One owner per lane; others propose, the owner writes.", part: "Config templates" },
    { id: "data",   q: "Do your agents treat web pages, emails and replies as data, never as orders?", fix: "A standing rule: outside text is data; instructions in it get flagged, not followed.", part: "House rules" },
    { id: "delete", q: "Does a delete need a human yes?", fix: "Archive or overwrite instead of delete; a delete is an approval gate.", part: "Approval gates" },
    { id: "log",    q: "Does every run leave a log line you can read in one place?", fix: "One append-only desk file; every run writes a line.", part: "Desk and status formats" },
    { id: "kill",   q: "Is there a number that stops an agent automatically (runs, dollars, errors)?", fix: "A kill number per routine, with a run cap.", part: "Trust ladder" },
    { id: "secret", q: "Are secrets and keys kept out of prompts, files and repos?", fix: "Secrets live in the platform's vault; configs name them, never hold them.", part: "Config templates" },
    { id: "pause",  q: "Can you pause every agent in one step?", fix: "A one-line pause switch every routine reads first.", part: "Skill templates" }
  ];

  var form = document.getElementById("tool-form");
  var box = document.getElementById("questions");
  var out = document.getElementById("result");
  var last = null;

  box.innerHTML = Q.map(function (x, i) {
    return '<fieldset style="border:0;padding:0;margin:0 0 6px"><legend style="font-size:15px;margin-bottom:4px">' + (i + 1) + '. ' + x.q + '</legend>' +
      '<label style="display:inline-flex;gap:6px;margin-right:18px;align-items:center"><input type="radio" name="' + x.id + '" value="yes" style="width:auto"> Yes</label>' +
      '<label style="display:inline-flex;gap:6px;align-items:center"><input type="radio" name="' + x.id + '" value="no" style="width:auto"> No / not sure</label></fieldset>';
  }).join("");

  if (window.probeHasForm) document.getElementById("run-note").textContent = "Your score and gaps are saved anonymously to improve this check. No name, no email.";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  document.getElementById("run").addEventListener("click", function () {
    var answered = 0, score = 0, gaps = [];
    Q.forEach(function (x) {
      var v = (form.querySelector('input[name="' + x.id + '"]:checked') || {}).value;
      if (v) answered++;
      if (v === "yes") score++; else gaps.push(x);
    });
    out.hidden = false;
    if (answered < Q.length) { out.innerHTML = '<p class="flag bad">Answer all ten (pick "No / not sure" if you don\'t know).</p>'; return; }

    var verdict = score >= 9 ? "Tight. Your agents are unlikely to surprise you." :
                  score >= 6 ? "Some open doors. One bad night could still cost you." :
                  score >= 3 ? "Exposed. A runaway loop or a stray send would likely go unnoticed." :
                               "Wide open. Your agents can spend, send and delete without you.";
    var parts = {};
    gaps.forEach(function (g) { parts[g.part] = true; });
    var html = '<p class="small" style="margin:0">Guardrail score</p><p class="big">' + score + ' / 10</p><p>' + esc(verdict) + '</p>';
    if (gaps.length) {
      html += '<h3 style="font-size:17px;margin:16px 0 4px">Your gaps, and what closes each</h3>';
      html += gaps.map(function (g) { return '<div class="flag"><strong>' + esc(g.q) + '</strong><br>' + esc(g.fix) + ' <span class="small">(Kit part: ' + esc(g.part) + ')</span></div>'; }).join("");
      html += '<p class="small">Kit parts that cover your gaps: ' + esc(Object.keys(parts).join(", ")) + '.</p>';
    } else {
      html += '<div class="flag good">No gaps on this list. The kit may still be useful as a written record of what you already do.</div>';
    }
    out.innerHTML = html;
    last = { score: score, gaps: gaps.map(function (g) { return g.id; }).join(" ") || "none" };
    submitProbe({ type: "run", score: last.score, gaps: last.gaps });
  });

  var cf = document.getElementById("capture-form"), msg = document.getElementById("capture-msg");
  if (!window.probeHasForm) { document.getElementById("capture-btn").setAttribute("aria-disabled", "true"); msg.textContent = "Sign-ups open shortly."; }
  document.getElementById("capture-btn").addEventListener("click", function () {
    var email = String(cf.elements.email.value || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "That email doesn't look right."; return; }
    var d = { type: "signup", email: email, agents: cf.elements.agents.value };
    if (last) { d.score = last.score; d.gaps = last.gaps; }
    if (submitProbe(d)) { msg.textContent = "You're on the list. You'll hear from us when the kit opens."; cf.elements.email.value = ""; }
    else msg.textContent = "Sign-ups open shortly.";
  });
})();
