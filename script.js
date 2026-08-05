(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── AOS – Animate On Scroll ──────────────────────────────────────────────── */
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      disable: reduced
    });
  }

  /* ── Lenis Smooth Scroll ──────────────────────────────────────────────────── */
  // Fix: Lenis 1.1.x → lerp statt duration/easing (ältere API war deprecated).
  // AOS-Fix: lenis.on('scroll', AOS.refresh) damit IntersectionObserver-Positionen
  // korrekt neu berechnet werden wenn Lenis den nativen Scroll-Event unterdrückt.
  var lenis;
  if (!reduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false });

    lenis.on("scroll", function () {
      if (typeof AOS !== "undefined") AOS.refresh();
    });

    (function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    })(0);

    document.querySelectorAll("a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length <= 1) return;
        var target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
      });
    });
  }

  /* ── Counter Animation (Anime.js) ────────────────────────────────────────── */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target) return;
    if (reduced) { el.textContent = target; return; }

    if (typeof anime !== "undefined") {
      var obj = { val: 0 };
      anime({
        targets: obj, val: target, duration: 1800, easing: "easeOutCubic",
        update: function () { el.textContent = Math.round(obj.val); },
        complete: function () { el.textContent = target; }
      });
    } else {
      var start = null; var dur = 1600;
      (function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step); else el.textContent = target;
      })(performance.now());
    }
  }

  if ("IntersectionObserver" in window) {
    var counterObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
      counterObs.observe(el);
    });
  }

  /* ── Mobile Sticky CTA ───────────────────────────────────────────────────── */
  var mobileCta = document.getElementById("mobileCta");
  var kontaktSection = document.getElementById("kontakt");
  if (mobileCta && kontaktSection && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { mobileCta.style.display = e.isIntersecting ? "none" : ""; });
    }, { threshold: 0.2 }).observe(kontaktSection);
  }

  /* ── Scroll Progress Bar ─────────────────────────────────────────────────── */
  var scrollBar = document.getElementById("scrollProgress");
  if (scrollBar) {
    window.addEventListener("scroll", function () {
      var scrolled = document.documentElement.scrollTop || document.body.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = (max > 0 ? (scrolled / max * 100) : 0) + "%";
    }, { passive: true });
  }

  /* ── Back To Top ─────────────────────────────────────────────────────────── */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      backToTop.classList.toggle("visible",
        (document.documentElement.scrollTop || document.body.scrollTop) > 500);
    }, { passive: true });
    backToTop.addEventListener("click", function () {
      if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── Card 3D Tilt (Desktop only, Touch ignorieren) ───────────────────────── */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".card, .trans-card, .tool-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(600px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ── Formspree Erfolg ────────────────────────────────────────────────────── */
  if (window.location.search.indexOf("gesendet=1") !== -1) {
    var form = document.getElementById("kontaktForm");
    var success = document.getElementById("kontaktSuccess");
    if (form && success) { form.hidden = true; success.hidden = false; }
  }

  /* ── Capacity Bar Animation ──────────────────────────────────────────────── */
  var capBarFill = document.querySelector(".cap-bar-fill");
  if (capBarFill && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        capBarFill.classList.add("cap-bar-animate");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 }).observe(capBarFill);
  }

  /* ── FAQ Card hover tilt (desktop only) ─────────────────────────────────── */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".faq-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateY(" + (x * 4) + "deg) rotateX(" + (-y * 4) + "deg) translateY(-5px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

})();

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT WIDGET — Railway/Groq Backend
═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CHAT_API_URL = "https://durchgeklicktgithubio-production.up.railway.app/chat";

  var fab      = document.getElementById("chatFab");
  var panel    = document.getElementById("chatPanel");
  var closeBtn = document.getElementById("chatClose");
  var form     = document.getElementById("chatForm");
  var input    = document.getElementById("chatInput");
  var messages = document.getElementById("chatMessages");
  var badge    = document.getElementById("chatBadge");
  var iconOpen  = fab ? fab.querySelector(".chat-fab-icon--open")  : null;
  var iconClose = fab ? fab.querySelector(".chat-fab-icon--close") : null;

  if (!fab || !panel) return;

  var history = [];
  var isOpen  = false;
  var isTyping = false;

  function openChat() {
    isOpen = true; panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    if (iconOpen)  iconOpen.hidden  = true;
    if (iconClose) iconClose.hidden = false;
    if (badge) badge.classList.add("hidden");
    scrollToBottom(); input.focus();
  }

  function closeChat() {
    isOpen = false; panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    if (iconOpen)  iconOpen.hidden  = false;
    if (iconClose) iconClose.hidden = true;
  }

  function scrollToBottom() { if (messages) messages.scrollTop = messages.scrollHeight; }

  function addMessage(text, role) {
    var div = document.createElement("div");
    div.className = "chat-msg chat-msg--" + (role === "user" ? "user" : "bot");
    div.textContent = text;
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "chat-msg chat-msg--bot chat-msg--typing";
    div.id = "chatTyping";
    div.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() { var t = document.getElementById("chatTyping"); if (t) t.remove(); }

  fab.addEventListener("click", function () { isOpen ? closeChat() : openChat(); });
  if (closeBtn) closeBtn.addEventListener("click", closeChat);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) closeChat(); });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || isTyping) return;
      input.value = "";
      addMessage(text, "user");
      history.push({ role: "user", content: text });
      isTyping = true;
      showTyping();
      fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          hideTyping();
          var reply = d.reply || d.message || "Entschuldigung, da ist etwas schiefgelaufen.";
          addMessage(reply, "bot");
          history.push({ role: "assistant", content: reply });
          isTyping = false;
        })
        .catch(function () {
          hideTyping();
          addMessage("Entschuldigung, ich bin gerade nicht erreichbar. Bitte schreiben Sie uns direkt.", "bot");
          isTyping = false;
        });
    });
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   💖 EASTER EGG — Für Sophia
   Trigger: Logo 5× antippen/klicken (funktioniert auf iPhone + Desktop)
═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var logo = document.querySelector(".logo");
  var modal = document.getElementById("sophiaModal");
  if (!logo || !modal) return;

  var count = 0;
  var timer = null;

  function openSophia() {
    modal.hidden = false;
    modal.style.display = "flex";
    modal.focus();

    // Confetti burst — Hannah Montana energy 🎉
    if (typeof confetti !== "undefined") {
      var colors = ["#ff69b4", "#ff007f", "#ffd700", "#da70d6", "#ff1493", "#fff"];
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, colors: colors, scalar: 1.2 });
      setTimeout(function () {
        confetti({ particleCount: 70, spread: 130, origin: { y: 0.4, x: 0.15 }, colors: colors });
      }, 350);
      setTimeout(function () {
        confetti({ particleCount: 70, spread: 130, origin: { y: 0.4, x: 0.85 }, colors: colors });
      }, 650);
      setTimeout(function () {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 }, colors: colors, shapes: ["star"] });
      }, 1000);
    }

    // Anime.js entrance
    if (typeof anime !== "undefined") {
      anime({
        targets: ".sophia-box",
        scale: [0.7, 1.04, 1],
        opacity: [0, 1],
        duration: 700,
        easing: "easeOutBack"
      });
      anime({
        targets: ".sophia-headline",
        scale: [0.5, 1.08, 1],
        opacity: [0, 1],
        duration: 600,
        delay: 200,
        easing: "easeOutBack"
      });
      anime({
        targets: ".sh",
        translateY: [60, 0],
        opacity: [0, 1],
        delay: anime.stagger(80, { start: 400 }),
        duration: 500,
        easing: "easeOutCubic"
      });
      anime({
        targets: ".sophia-pill",
        scale: [0, 1],
        opacity: [0, 1],
        delay: anime.stagger(100, { start: 600 }),
        duration: 400,
        easing: "easeOutBack"
      });
    }
  }

  function closeSophia() {
    modal.hidden = true;
    modal.style.display = "none";
  }

  logo.addEventListener("click", function (e) {
    // Nur Scroll-to-top verhindern während der Zählung
    if (count > 0) e.preventDefault();
    count++;
    clearTimeout(timer);
    timer = setTimeout(function () {
      count = 0;
    }, 3000);
    if (count >= 5) {
      e.preventDefault();
      count = 0;
      clearTimeout(timer);
      openSophia();
    }
  });

  // Touch: extra Trigger für Geräte wo click auf <a> ggf. verzögert kommt
  logo.addEventListener("touchend", function (e) {
    // count wird bereits durch click erhöht — doppelt zählen verhindern
    // touchend + click feuern beide auf iOS, also nichts extra tun hier
  });

  var closeBtn = document.getElementById("sophiaClose");
  var closeBtn2 = document.getElementById("sophiaCloseBtn");
  var overlay  = document.getElementById("sophiaOverlay");
  if (closeBtn)  closeBtn.addEventListener("click", closeSophia);
  if (closeBtn2) closeBtn2.addEventListener("click", closeSophia);
  if (overlay)   overlay.addEventListener("click", closeSophia);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeSophia();
  });
})();
