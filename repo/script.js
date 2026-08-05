(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- AOS – Animate On Scroll ---------- */
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
      disable: reduced ? true : false
    });
  }

  /* ---------- Lenis Smooth Scroll ---------- */
  if (!reduced && typeof Lenis !== "undefined") {
    var lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });

    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length <= 1) return;
        var target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
      });
    });
  }

  /* ---------- Counter Animation (Anime.js) ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target) return;
    if (reduced) { el.textContent = target; return; }

    if (typeof anime !== "undefined") {
      var obj = { val: 0 };
      anime({
        targets: obj,
        val: target,
        duration: 1800,
        easing: "easeOutCubic",
        update: function () { el.textContent = Math.round(obj.val); },
        complete: function () { el.textContent = target; }
      });
    } else {
      /* Fallback ohne Anime.js */
      var start = null;
      var dur = 1600;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step); else el.textContent = target;
      }
      requestAnimationFrame(step);
    }
  }

  if ("IntersectionObserver" in window) {
    var counterObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
      counterObs.observe(el);
    });
  }

  /* ---------- Mobile Sticky CTA ---------- */
  var mobileCta = document.getElementById("mobileCta");
  var kontaktSection = document.getElementById("kontakt");
  if (mobileCta && kontaktSection && "IntersectionObserver" in window) {
    var ctaObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        mobileCta.style.display = entry.isIntersecting ? "none" : "";
      });
    }, { threshold: 0.2 });
    ctaObs.observe(kontaktSection);
  }

  /* ---------- Scroll Progress Bar ---------- */
  var scrollBar = document.getElementById("scrollProgress");
  if (scrollBar) {
    window.addEventListener("scroll", function () {
      var scrolled = document.documentElement.scrollTop || document.body.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = (max > 0 ? (scrolled / max * 100) : 0) + "%";
    }, { passive: true });
  }

  /* ---------- Back To Top ---------- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      var scrolled = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrolled > 500) {
        backToTop.classList.add("visible");
      } else {
        backToTop.classList.remove("visible");
      }
    }, { passive: true });

    backToTop.addEventListener("click", function () {
      if (typeof lenis !== "undefined") {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  /* ---------- Card 3D Tilt ---------- */
  if (!reduced) {
    document.querySelectorAll(".card, .trans-card, .tool-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = "perspective(600px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Formspree Erfolg ---------- */
  if (window.location.search.indexOf("gesendet=1") !== -1) {
    var form = document.getElementById("kontaktForm");
    var success = document.getElementById("kontaktSuccess");
    if (form && success) { form.hidden = true; success.hidden = false; }
  }

})();
