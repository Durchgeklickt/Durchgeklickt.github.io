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
})();
