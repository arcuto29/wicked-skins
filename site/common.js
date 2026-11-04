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
  document.querySelectorAll("[data-chrome]").forEach((a) => { a.href = S.chromeStoreUrl || S.releasesUrl; if (!S.chromeStoreUrl) a.querySelector("small") && (a.querySelector("small").textContent = "Coming to the Chrome Web Store. Download the zip for now"); });
  document.querySelectorAll("[data-releases]").forEach((a) => (a.href = S.releasesUrl));
  document.querySelectorAll("[data-contact]").forEach((el) => (el.textContent = S.contactEmail || "the contact email listed on this site"));
})();
