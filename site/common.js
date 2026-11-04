// Header + footer shared by every page, filled from site-config.js
(function () {
  const S = window.SITE, here = location.pathname.split("/").pop() || "index.html";
  const link = (href, label) => `<a href="${href}"${here === href ? ' class="on"' : ""}>${label}</a>`;
  document.body.insertAdjacentHTML("afterbegin", `<header class="top"><div class="wrap">
    <a class="brand" href="index.html"><img src="img/icon-128.png" alt=""><span>${S.name}</span></a>
    <nav class="links">${link("index.html#features", "Features")}${link("workshop.html", "Workshop")}${link("index.html#download", "Download")}${link("index.html#faq", "FAQ")}</nav>
  </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `<footer><div class="wrap">
    <span>© ${new Date().getFullYear()} ${S.name}</span>${link("privacy.html", "Privacy")}${link("terms.html", "Terms")}
    ${S.contactEmail ? `<a href="mailto:${S.contactEmail}">Contact</a>` : ""}
    <span style="margin-left:auto">Cosmetic only. Not affiliated with, endorsed or sponsored by TradingView, Inc. Not financial advice.</span>
  </div></footer>`);
  // Arriving from the "confirm your email" link: say so, and clean the address bar.
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("type") === "signup" || h.get("type") === "email_change" || (h.get("access_token") && !/reset\.html$/.test(location.pathname))) {
    document.querySelector("header.top").insertAdjacentHTML("afterend", `<div style="background:#0f2b26;color:#2ef2b0;text-align:center;padding:12px;font-weight:700">Email confirmed. Now sign in from the extension: Workshop › Sign in.</div>`);
    history.replaceState(null, "", location.pathname);
  } else if (h.get("error_description")) {
    document.querySelector("header.top").insertAdjacentHTML("afterend", `<div style="background:#2b0f14;color:#ff8a9a;text-align:center;padding:12px">${h.get("error_description").replace(/[<>&]/g, "")}</div>`);
    history.replaceState(null, "", location.pathname);
  }
  document.querySelectorAll("[data-chrome]").forEach((a) => { a.href = S.chromeStoreUrl || S.releasesUrl; if (!S.chromeStoreUrl) a.querySelector("small") && (a.querySelector("small").textContent = "Coming to the Chrome Web Store. Download the zip for now"); });
  document.querySelectorAll("[data-releases]").forEach((a) => (a.href = S.releasesUrl));
  document.querySelectorAll("[data-contact]").forEach((el) => (el.textContent = S.contactEmail || "the contact email listed on this site"));
})();
