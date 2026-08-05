/* Durchgeklickt Landingpage — JS-Bundle.
   Sprint 126: AOS + Typed.js + vanilla-tilt
   Sprint 127: Splitting.js + canvas-confetti + just-validate + Lenis
   Grundprinzip: Animation ist Zusatz-Politur, nie Voraussetzung. Jede Library wird
   defensiv geguardet (typeof-Check) und bei prefers-reduced-motion deaktiviert. */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── FADE-IN (IntersectionObserver) ──────────────────────────────────────────
  // Bug-Fix Sprint 127: zuvor stand hier ein blankes `return`, das bei
  // prefers-reduced-motion ALLE nachfolgenden Features (FAQ, Sticky Header,
  // Formspree-Erfolg, etc.) still-killed. Jetzt nur der Observer-Zweig abgegrenzt.
  var fadeEls = document.querySelectorAll(".fade-in");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    fadeEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    fadeEls.forEach(function (el) { observer.observe(el); });
  }

  // ── STICKY MOBILE-CTA ────────────────────────────────────────────────────────
  var mobileCta = document.getElementById("mobileCta");
  var kontaktSection = document.getElementById("kontakt");
  if (mobileCta && kontaktSection && "IntersectionObserver" in window) {
    var ctaObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          mobileCta.style.display = entry.isIntersecting ? "none" : "";
        });
      },
      { threshold: 0.2 }
    );
    ctaObserver.observe(kontaktSection);
  }

  // ── STICKY HEADER ────────────────────────────────────────────────────────────
  var header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    }, { passive: true });
  }

  // ── ANIMIERTE ZÄHLER ─────────────────────────────────────────────────────────
  var statNums = document.querySelectorAll(".stat-num[data-target]");
  if (statNums.length) {
    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.getAttribute("data-target"), 10);
          if (target === 0) { el.textContent = "0"; obs.unobserve(el); return; }
          var duration = 1200;
          var startTime = null;
          function step(ts) {
            if (!startTime) startTime = ts;
            var progress = Math.min((ts - startTime) / duration, 1);
            var ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(ease * target);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target;
          }
          requestAnimationFrame(step);
          obs.unobserve(el);
        });
      }, { threshold: 0.5 });
      statNums.forEach(function (el) { counterObserver.observe(el); });
    } else {
      statNums.forEach(function (el) {
        el.textContent = el.getAttribute("data-target");
      });
    }
  }

  // ── FAQ ACCORDION ────────────────────────────────────────────────────────────
  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-question").forEach(function (other) {
        other.setAttribute("aria-expanded", "false");
        var ans = other.nextElementSibling;
        if (ans) ans.hidden = true;
      });
      if (!expanded) {
        btn.setAttribute("aria-expanded", "true");
        var answer = btn.nextElementSibling;
        if (answer) answer.hidden = false;
      }
    });
  });

  // ── FORMSPREE SUCCESS ────────────────────────────────────────────────────────
  if (window.location.search.indexOf("gesendet=1") !== -1) {
    var form = document.getElementById("kontaktForm");
    var success = document.getElementById("kontaktSuccess");
    if (form && success) {
      form.hidden = true;
      success.hidden = false;
    }
    if (!prefersReducedMotion && typeof confetti !== "undefined") {
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#D6321C", "#F5B700", "#1B4F9C", "#ffffff"]
      });
      setTimeout(function () {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#D6321C", "#F5B700"]
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#1B4F9C", "#F5B700"]
        });
      }, 400);
    }
  }

  // ── LENIS SMOOTH SCROLL ──────────────────────────────────────────────────────
  if (!prefersReducedMotion && typeof Lenis !== "undefined") {
    var lenis = new Lenis({ lerp: 0.08, smoothWheel: true, syncTouch: false });
    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
    // AOS refresh bei jedem Lenis-Scroll-Tick
    lenis.on("scroll", function () {
      if (typeof AOS !== "undefined") AOS.refresh();
    });
  }

  // ── AOS (Animate On Scroll) ──────────────────────────────────────────────────
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      disable: prefersReducedMotion
    });
  }

  // ── TYPED.JS HERO-EYEBROW ────────────────────────────────────────────────────
  if (!prefersReducedMotion && typeof Typed !== "undefined" && document.getElementById("typed-hero")) {
    new Typed("#typed-hero", {
      strings: [
        "Friseure &amp; Barbershops.",
        "Tierarztpraxen.",
        "Immobilienmakler.",
        "Zahnarztpraxen.",
        "Handwerksbetriebe.",
        "lokale Betriebe aller Art."
      ],
      typeSpeed: 55,
      backSpeed: 28,
      backDelay: 1800,
      loop: true,
      smartBackspace: true
    });
  }

  // ── VANILLA-TILT ─────────────────────────────────────────────────────────────
  if (!prefersReducedMotion && typeof VanillaTilt !== "undefined") {
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 5,
      speed: 600,
      glare: false,
      "full-page-listening": false
    });
  }

  // ── SPLITTING.JS — Hero H1 Buchstaben-Animation ──────────────────────────────
  if (!prefersReducedMotion && typeof Splitting !== "undefined") {
    var heroH1 = document.querySelector(".hero h1");
    if (heroH1) {
      Splitting({ target: heroH1 });
      heroH1.classList.add("splitting-ready");
    }
  }

  // ── JUST-VALIDATE — Inline-Formularvalidierung ───────────────────────────────
  if (typeof JustValidate !== "undefined" && document.getElementById("kontaktForm")) {
    var validation = new JustValidate("#kontaktForm", {
      errorLabelStyle: {
        color: "#B8280F",
        fontSize: "11px",
        fontWeight: "700",
        fontFamily: "inherit",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "block",
        marginTop: "3px"
      },
      lockForm: false
    });
    validation
      .addField("#f-name", [
        { rule: "required", errorMessage: "Name ist erforderlich" },
        { rule: "minLength", value: 2, errorMessage: "Mindestens 2 Zeichen" }
      ])
      .addField("#f-email", [
        { rule: "required", errorMessage: "E-Mail ist erforderlich" },
        { rule: "email", errorMessage: "Bitte eine gültige E-Mail eingeben" }
      ])
      .addField("#f-betrieb", [
        { rule: "required", errorMessage: "Betriebsname ist erforderlich" }
      ])
      .onSuccess(function () {
        document.getElementById("kontaktForm").submit();
      });
  }
})();
