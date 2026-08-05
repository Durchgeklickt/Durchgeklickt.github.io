(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll Fade-in ---------- */
  var fadeEls = document.querySelectorAll(".fade-in");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    fadeEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var fadeObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    fadeEls.forEach(function (el) { fadeObserver.observe(el); });
  }

  /* ---------- Zähler-Animation ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target || prefersReducedMotion) { el.textContent = target || el.textContent; return; }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var counterObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll(".stat-number[data-count]").forEach(function (el) {
      counterObs.observe(el);
    });
  }

  /* ---------- Sticky Mobile CTA ausblenden wenn Kontakt sichtbar ---------- */
  var mobileCta = document.getElementById("mobileCta");
  var kontaktSection = document.getElementById("kontakt");
  if (mobileCta && kontaktSection && "IntersectionObserver" in window) {
    var ctaObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          mobileCta.style.display = entry.isIntersecting ? "none" : "";
        });
      },
      { threshold: 0.2 }
    );
    ctaObs.observe(kontaktSection);
  }

  /* ---------- Formspree Erfolg ---------- */
  if (window.location.search.indexOf("gesendet=1") !== -1) {
    var form = document.getElementById("kontaktForm");
    var success = document.getElementById("kontaktSuccess");
    if (form && success) { form.hidden = true; success.hidden = false; }
  }

  /* ---------- Mobile Nav Burger ---------- */
  var burger = document.getElementById("navBurger");
  var nav = document.querySelector(".main-nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("nav-open", !open);
    });
  }

})();
