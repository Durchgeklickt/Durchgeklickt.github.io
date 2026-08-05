(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis Smooth Scroll ---------- */
  if (!prefersReducedMotion && typeof Lenis !== "undefined") {
    var lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);

    /* Anchor links → Lenis smooth scroll */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.querySelector(a.getAttribute("href"));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });
  }

  /* ---------- Reveal Animations ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-right");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Counter Animation ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target || prefersReducedMotion) { el.textContent = target || el.textContent; return; }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
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
    document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
      counterObs.observe(el);
    });
  }

  /* ---------- Mobile Sticky CTA ---------- */
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

})();
