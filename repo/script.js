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

/* ═══════════════════════════════════════════════════════
   CHAT WIDGET
   Setzt CHAT_API_URL auf die Railway-URL nach dem Deploy.
═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // Nach Railway-Deploy hier die echte URL eintragen:
  var CHAT_API_URL = "https://DEINE-APP.railway.app/chat";

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
    isOpen = true;
    panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    if (iconOpen)  iconOpen.hidden  = true;
    if (iconClose) iconClose.hidden = false;
    if (badge) { badge.classList.add("hidden"); }
    scrollToBottom();
    input.focus();
  }

  function closeChat() {
    isOpen = false;
    panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    if (iconOpen)  iconOpen.hidden  = false;
    if (iconClose) iconClose.hidden = true;
  }

  function scrollToBottom() {
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

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

  function hideTyping() {
    var t = document.getElementById("chatTyping");
    if (t) t.remove();
  }

  fab.addEventListener("click", function () {
    isOpen ? closeChat() : openChat();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeChat);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = input.value.trim();
      if (!msg || isTyping) return;

      addMessage(msg, "user");
      history.push({ role: "user", parts: [{ text: msg }] });
      input.value = "";
      input.disabled = true;
      form.querySelector(".chat-send").disabled = true;
      isTyping = true;
      showTyping();

      var payload = JSON.stringify({
        message: msg,
        history: history.slice(0, -1)
      });

      fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          hideTyping();
          var reply = data.reply || "Entschuldigung, ich konnte keine Antwort abrufen.";
          addMessage(reply, "bot");
          history.push({ role: "model", parts: [{ text: reply }] });
        })
        .catch(function () {
          hideTyping();
          addMessage("Verbindungsfehler — bitte versuchen Sie es kurz später nochmal.", "bot");
        })
        .finally(function () {
          isTyping = false;
          input.disabled = false;
          form.querySelector(".chat-send").disabled = false;
          input.focus();
        });
    });
  }

  // Badge nach 4 Sekunden anzeigen wenn Chat noch nicht geöffnet
  setTimeout(function () {
    if (!isOpen && badge) {
      badge.classList.remove("hidden");
    }
  }, 4000);

}());
