/* Spina Vita — main.js  (Vanilla-JS, keine Bibliotheken)
   1) Mobile-Navigation  2) Header-Scroll-State  3) Scroll-Reveal
   4) Jahr im Footer  5) Wirbelsäulen-Scroll-Guide  6) Anatomie-Ebene (Scroll-Scale)
   7) Zahl-Counter */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1) Mobile-Navigation ---------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menü öffnen");
    menu.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", !open ? "Menü schließen" : "Menü öffnen");
      menu.classList.toggle("is-open", !open);
      // Hintergrund-Scroll sperren, solange das Menü offen ist
      document.body.classList.toggle("nav-open", !open);
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    // Klick außerhalb des Panels schließt das Menü
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });
  }

  /* 3) Scroll-Reveal (IntersectionObserver) ---------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* 4) Aktuelles Jahr im Footer ---------------------------------------------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* 5) + 6) Scroll-getriebene Effekte (rAF-gedrosselt) ----------------------- */
  var header = document.querySelector(".site-header");
  var fab = document.querySelector(".fab");
  var spine = document.querySelector(".spine-guide");
  var vertebrae = document.querySelectorAll(".spine-guide .vertebra");
  var anatomy = document.querySelectorAll(".anatomy-layer svg");
  var heroZoom = document.querySelector(".hero-immersive .hero-zoom");
  var heroInner = document.querySelector(".hero-immersive .hero-inner");
  var heroCue = document.querySelector(".scroll-cue");
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    // Header-Zustand
    if (header) header.classList.toggle("is-scrolled", y > 8);

    // Floating-CTA: erscheint, sobald man zu scrollen beginnt
    if (fab) fab.classList.toggle("is-visible", y > vh * 0.45);

    // ⓪ Hero: man scrollt „ins Bild hinein" – Bild zoomt, Text zieht sich sanft zurück
    if (heroZoom && !reduce) {
      var hp = Math.min(1, Math.max(0, y / vh));      // 0 = oben, 1 = Hero verlassen
      heroZoom.style.transform = "scale(" + (1.03 + hp * 0.22).toFixed(3) + ")";
      if (heroInner) {
        heroInner.style.transform = "translateY(" + (hp * -46).toFixed(1) + "px)";
        heroInner.style.opacity = Math.max(0, 1 - hp * 1.25).toFixed(3);
      }
      if (heroCue) heroCue.style.opacity = Math.max(0, 1 - hp * 3).toFixed(3);
    }

    // ① Wirbelsäulen-Legende: erscheint erst nach dem Hero, füllt sich beim Scrollen
    if (vertebrae.length && spine) {
      // Im Header/Hero noch unsichtbar – erst ab ~70 % Viewport-Höhe einblenden
      spine.classList.toggle("is-visible", y > vh * 0.7);

      var docH = document.documentElement.scrollHeight - vh;
      var prog = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;
      var active = Math.round(prog * vertebrae.length);
      for (var i = 0; i < vertebrae.length; i++) {
        vertebrae[i].classList.toggle("on", i < active);
      }
      spine.classList.toggle("is-complete", prog > 0.97);
    }

    // ② Anatomie-Ebene: skaliert & blendet ein, während die Sektion durchs Bild wandert
    if (anatomy.length && !reduce) {
      anatomy.forEach(function (svg) {
        var sec = svg.closest(".anatomy-section");
        if (!sec) return;
        var r = sec.getBoundingClientRect();
        // p: 0 = Sektion tritt unten ein, 1 = verlässt oben
        var p = 1 - (r.bottom) / (vh + r.height);
        p = Math.min(1, Math.max(0, p));
        var scale = 0.72 + p * 0.5;                 // 0.72 → 1.22
        var op = 0.04 + Math.sin(p * Math.PI) * 0.07; // sanft auf-/abblenden
        svg.style.transform = "scale(" + scale.toFixed(3) + ")";
        svg.style.opacity = op.toFixed(3);
      });
    }
    ticking = false;
  }

  function requestTick() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScrollFrame); }
  }
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
  onScrollFrame();

  /* 7) Zahl-Counter (Count-up beim Einscrollen) ------------------------------ */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1200, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }
})();
