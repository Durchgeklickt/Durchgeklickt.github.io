/* Durchgeklickt Landingpage -- subtiles Fade-in beim Scrollen (IntersectionObserver).
   Bewusst NICHTS Aufdringliches: kein Parallax, kein Auto-Play, keine Popups. Wenn JS
   nicht laeuft, bleibt die Seite ueber die "no-js"-Klasse (siehe styles.css) trotzdem
   vollstaendig lesbar -- die Animation ist reine Zusatz-Politur, nie Voraussetzung. */
(function () {
  "use strict";

  // Sobald JS laeuft, "no-js" entfernen -- Elemente mit .fade-in bekommen jetzt ihren
  // Transform-Startversatz und werden gezielt vom Observer in Position gebracht.
  document.documentElement.classList.remove("no-js");

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var fadeEls = document.querySelectorAll(".fade-in");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    // Reduzierte Bewegung gewuenscht oder alter Browser ohne Observer-Support:
    // sofort alles anzeigen statt eine kaputte/unangenehme Erfahrung zu riskieren.
    fadeEls.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

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

  // Sticky Mobile-CTA: ausblenden, sobald der echte Kontakt-Button im Viewport ist --
  // vermeidet doppelte CTAs uebereinander, wenn der Nutzer sowieso schon unten ist.
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

  // Sticky Header
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // Animierte Zähler in der Stats-Leiste
  var statNums = document.querySelectorAll('.stat-num[data-target]');
  if (statNums.length && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-target'), 10);
        if (target === 0) { el.textContent = '0'; obs.unobserve(el); return; }
        var start = 0;
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
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      // alle anderen schließen
      document.querySelectorAll('.faq-question').forEach(function (other) {
        other.setAttribute('aria-expanded', 'false');
        var ans = other.nextElementSibling;
        if (ans) ans.hidden = true;
      });
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        var answer = btn.nextElementSibling;
        if (answer) answer.hidden = false;
      }
    });
  });

  // Sprint 123: Formspree leitet nach erfolgreichem Versand per "_next"-Feld auf
  // "?gesendet=1#kontakt" zurueck -- zeigt dann die Erfolgsmeldung im Bauhaus-Look statt
  // Formsprees eigener generischer Danke-Seite, damit der Nutzer den Absender nicht verlaesst.
  if (window.location.search.indexOf("gesendet=1") !== -1) {
    var form = document.getElementById("kontaktForm");
    var success = document.getElementById("kontaktSuccess");
    if (form && success) {
      form.hidden = true;
      success.hidden = false;
    }
  }

  // AOS initialisieren
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
      disable: prefersReducedMotion ? true : false
    });
  }

  // Typed.js Hero
  if (typeof Typed !== 'undefined' && document.getElementById('typed-hero')) {
    new Typed('#typed-hero', {
      strings: [
        'Friseure &amp; Barbershops.',
        'Tierarztpraxen.',
        'Immobilienmakler.',
        'Zahnarztpraxen.',
        'Handwerksbetriebe.',
        'lokale Betriebe aller Art.'
      ],
      typeSpeed: 55,
      backSpeed: 28,
      backDelay: 1800,
      loop: true,
      smartBackspace: true
    });
  }

  // vanilla-tilt auf Karten
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
      max: 5,
      speed: 600,
      glare: false,
      'full-page-listening': false
    });
  }
})();
