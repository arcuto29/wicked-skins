/* Priism Skins — the trading account box (TopstepX's account picker), shared by the panel and the page.
   Visual only. Two jobs:
   1. read() what the platform's own account box says (its type, size and number), so the real type can always be
      shown, never changed. A practice account is shown as Practice; nothing here can make it say Live or Funded.
      If the type can't be read for certain (none found, or two different ones), it returns null and nothing is
      restyled: the platform's own box is shown as it is.
   2. nickname(): your nickname for the box, checked so it can't pose as account details (no numbers, money, account
      words or look-alike letters). The type badge sits next to it either way. */
(function (root) {
  "use strict";
  // in order: the more specific names first ("Express Funded" before "Funded")
  const TYPES = [
    { re: /\blive\s*funded\b|\blfa\b/i, label: "Live Funded", short: "LFA", tone: "live" },
    { re: /\bexpress\s*funded\b|\bxfa\b/i, label: "Express Funded", short: "XFA", tone: "funded" },
    { re: /\blive\b/i, label: "Live", tone: "live" },
    { re: /\bfunded\b/i, label: "Funded", tone: "funded" },
    { re: /\btrading\s*combine\b|\bcombine\b/i, label: "Combine", tone: "eval" },
    { re: /\beval(uation)?\b/i, label: "Evaluation", tone: "eval" },
    { re: /\bpractice\b/i, label: "Practice", tone: "practice" },
  ];
  // fixed per type, never your colours, so a type can't be dressed up as another
  const TONE = { practice: "#9aa6bd", eval: "#f5b041", funded: "#34d399", live: "#fb7185" };

  function read(text) {
    let t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 120) return null;
    let type = null;
    for (const ty of TYPES) {
      const m = t.match(ty.re); if (!m) continue;
      if (type) return null;                                   // two different account types: can't be sure
      type = ty; t = t.replace(ty.re, " ");                    // (so "Express Funded" doesn't also count as "Funded")
    }
    if (!type) return null;
    const src = String(text);
    const size = (src.match(/\$\s*(\d{1,4}(?:\.\d)?)\s*([KM])\b/i) || src.match(/\b(\d{1,4}(?:\.\d)?)\s*([KM])\b/i));
    const num = src.match(/\(\s*(?:…|\.\.\.|\*+)?\s*(\d{2,})\s*\)/) || src.match(/(?:…|\.\.\.)\s*(\d{2,})\b/);
    return { type: type.label, short: type.short || type.label, tone: type.tone, color: TONE[type.tone], size: size ? "$" + size[1] + size[2].toUpperCase() : "", number: num ? num[1] : "" };
  }

  // ---- nickname ----
  // Latin letters, spaces and . ' _ - only, 1-18 characters: no digits, money signs or look-alike letters from other
  // alphabets. And none of the words below, also not spelled with i / l / ! swapped or split by spaces or dots.
  const SHAPE = /^[A-Za-z][A-Za-z .'_-]{0,17}$/;
  const WORDS = ["live", "funded", "fund", "practice", "combine", "express", "xfa", "lfa", "eval", "evaluation", "account", "acct",
    "payout", "pa", "demo", "sim", "simulated", "real", "prop", "balance", "k", "topstep", "topstepx", "official", "verified", "admin", "support"];
  const STRONG = ["live", "funded", "practice", "combine", "express", "payout", "topstep", "verified", "official", "evaluation"];   // also caught when split up or run into a word
  const canon = (s) => s.toLowerCase().replace(/[l|!1]/g, "i");
  const CW = WORDS.map(canon), CS = STRONG.map(canon);
  function nicknameProblem(raw) {
    const v = String(raw || "").replace(/\s+/g, " ").trim();
    if (!v) return "";
    if (!SHAPE.test(v)) return "Letters, spaces and . ' _ - only, up to 18 characters: no numbers, money signs or symbols.";
    const tokens = canon(v).split(/[ .'_-]+/).filter(Boolean), compact = tokens.join("");
    const word = tokens.find((t) => CW.includes(t) || CS.some((w) => t.startsWith(w)));
    const split = CS.find((w) => compact.includes(w) && !tokens.some((t) => t.includes(w)));
    if (word || split) return "Account words (live, funded, practice, combine, payout…) can't be used, so it never looks like account details.";
    return "";
  }
  const nickname = (raw) => { const v = String(raw || "").replace(/\s+/g, " ").trim(); return v && !nicknameProblem(v) ? v : ""; };

  root.PriismAcct = { read, nickname, nicknameProblem, TONE };
})(typeof self !== "undefined" ? self : this);
