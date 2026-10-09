(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var vh = window.innerHeight;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- intro ---------- */
  var loader = document.querySelector("[data-loader]");
  function ready() {
    if (root.classList.contains("ready")) return;
    root.classList.add("ready");
    document.dispatchEvent(new Event("tx:ready"));
  }
  if (loader && root.classList.contains("is-loading")) {
    var countEl = loader.querySelector("[data-count]");
    var t0 = performance.now(), DUR = 2200, done = false;
    var tick = function (now) {
      var p = clamp((now - t0) / DUR, 0, 1);
      if (countEl) countEl.textContent = String(Math.round(p * 100)).padStart(2, "0");
      if (p < 1 && !done) requestAnimationFrame(tick); else finish();
    };
    var finish = function () {
      if (done) return;
      done = true;
      loader.classList.add("lift");
      root.classList.remove("is-loading");
      setTimeout(ready, 250);
      // remove the curtain once it has lifted (timer as a fallback if transitionend never fires)
      var clear = function () { loader.classList.remove("lift"); loader.classList.add("gone"); };
      loader.addEventListener("transitionend", clear, { once: true });
      setTimeout(clear, 1300);
    };
    loader.addEventListener("click", finish);
    requestAnimationFrame(tick);
  } else {
    ready();
  }

  /* ---------- header, progress, active link ---------- */
  var header = document.querySelector(".site-header");
  var bar = document.querySelector(".progress span");
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    if (!document.body.classList.contains("menu-open")) header.classList.toggle("hidden", y > 480 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove("hidden");
    lastY = y;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  if ("IntersectionObserver" in window && navLinks.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "divisions", "process", "why", "contact"].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- mobile menu ---------- */
  var drawer = document.getElementById("drawer");
  var menuBtn = document.querySelector("[data-menu]");
  function setMenu(open) {
    drawer.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    header.classList.remove("hidden");
  }
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", function () { setMenu(drawer.hidden); });
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 900 && !drawer.hidden) setMenu(false); });
  }

  /* ---------- split headings into words ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--wi:' + i + '">' + w + "</span></span>";
    }).join(" ");
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll("[data-reveal], [data-split]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- statement: words light up as you scroll ---------- */
  var scrub = document.querySelector("[data-scrub]");
  var scrubWords = [];
  if (scrub) {
    var hl = ["own.", "ground", "up."];
    var text = scrub.textContent.trim();
    scrub.setAttribute("aria-label", text);
    scrub.innerHTML = text.split(/\s+/).map(function (w) {
      return '<span class="sw' + (hl.indexOf(w) > -1 ? " hl" : "") + '" aria-hidden="true">' + w + "</span>";
    }).join(" ");
    scrubWords = scrub.querySelectorAll(".sw");
  }

  /* ---------- divisions: sticky visual follows the active block ---------- */
  var blocks = document.querySelectorAll("[data-div]");
  var scenes = document.querySelectorAll("[data-scene]");
  var dvNum = document.querySelector("[data-dv-num]");
  var dvCap = document.querySelector("[data-dv-cap]");
  var names = ["Construction", "Real estate", "Property management"];
  var activeDiv = -1;
  function setDiv(i) {
    if (i === activeDiv) return;
    activeDiv = i;
    blocks.forEach(function (b, j) { b.classList.toggle("on", j === i); });
    scenes.forEach(function (s, j) { s.classList.toggle("on", j === i); });
    if (dvNum) dvNum.textContent = "0" + (i + 1);
    if (dvCap) dvCap.textContent = names[i];
  }
  if (blocks.length) setDiv(0);

  /* ---------- process rail ---------- */
  var processSec = document.querySelector("[data-process]");
  var rail = document.querySelector(".process-rail span");
  var steps = document.querySelectorAll("[data-step]");

  /* ---------- per-frame scroll effects ---------- */
  function scrollEffects() {
    if (scrubWords.length) {
      var r = scrub.getBoundingClientRect();
      var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
      var n = reduce ? scrubWords.length : Math.round(p * scrubWords.length);
      for (var i = 0; i < scrubWords.length; i++) scrubWords[i].classList.toggle("on", i < n);
    }
    if (blocks.length) {
      var best = 0, bestD = Infinity, mid = vh * 0.5;
      blocks.forEach(function (b, j) {
        var br = b.getBoundingClientRect();
        var d = Math.abs(br.top + br.height / 2 - mid);
        if (d < bestD) { bestD = d; best = j; }
      });
      setDiv(best);
    }
    if (processSec) {
      var pr = processSec.querySelector(".process").getBoundingClientRect();
      var pp = clamp((vh * 0.85 - pr.top) / (vh * 0.55), 0, 1);
      if (rail) rail.style.setProperty("--p", pp.toFixed(3));
      var railVisible = rail && rail.offsetParent !== null;
      steps.forEach(function (s, j) {
        var on = railVisible ? pp >= j / steps.length + 0.02 : s.getBoundingClientRect().top < vh * 0.8;
        s.classList.toggle("on", on || reduce);
      });
    }
  }

  /* ---------- marquee reacts to scroll speed ---------- */
  var marquee = document.querySelector("[data-track]");
  var mx = 0, mVel = 0, mDir = 1, mHalf = 0, lastScroll = window.scrollY, lastT = performance.now();
  if (marquee) {
    marquee.innerHTML += marquee.innerHTML;
    marquee.querySelectorAll("span").forEach(function (s, i) { if (i >= marquee.children.length / 4) s.setAttribute("aria-hidden", "true"); });
    mHalf = marquee.scrollWidth / 2;
  }

  /* ---------- custom cursor + magnetic buttons ---------- */
  var cursor = document.querySelector(".cursor");
  var cur = { x: -100, y: -100, rx: -100, ry: -100 };
  var dot = cursor && cursor.querySelector(".cursor-dot");
  var ring = cursor && cursor.querySelector(".cursor-ring");
  if (finePointer && !reduce && cursor) {
    root.classList.add("has-cursor");
    window.addEventListener("pointermove", function (e) { cur.x = e.clientX; cur.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, label, [data-spot], .marquee span"));
    });
    window.addEventListener("pointerdown", function () { cursor.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { cursor.classList.remove("is-down"); });
    document.addEventListener("pointerleave", function () { cur.x = cur.y = -100; });

    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = "transform .15s linear, color .3s, box-shadow .3s";
        el.style.transform = "translate(" + (dx * 0.22).toFixed(1) + "px," + (dy * 0.32).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform .6s cubic-bezier(.2,.7,.1,1), color .3s, box-shadow .3s";
        el.style.transform = "";
      });
    });
  }

  /* ---------- spotlight + tilt cards ---------- */
  document.querySelectorAll("[data-spot]").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (finePointer && !reduce && card.classList.contains("in")) {
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y / r.height) * 6).toFixed(2) + "deg) rotateY(" + ((x / r.width - 0.5) * 8).toFixed(2) + "deg)";
      }
    });
    card.addEventListener("pointerleave", function () { card.style.transform = ""; });
  });

  /* ---------- footer wordmark light sweep ---------- */
  var foot = document.querySelector("[data-footword]");
  var fw = { x: -0.3, y: 0.5, hover: false, vis: false };
  if (foot) {
    foot.addEventListener("pointermove", function (e) {
      var r = foot.getBoundingClientRect();
      fw.hover = true; fw.x = (e.clientX - r.left) / r.width; fw.y = (e.clientY - r.top) / r.height;
    });
    foot.addEventListener("pointerleave", function () { fw.hover = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { fw.vis = en[0].isIntersecting; }).observe(foot);
  }

  /* ---------- main loop ---------- */
  function frame(now) {
    var dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    scrollEffects();

    if (marquee && !reduce) {
      var sy = window.scrollY, ds = sy - lastScroll; lastScroll = sy;
      if (Math.abs(ds) > 0.5) mDir = ds > 0 ? 1 : -1;
      mVel += (Math.abs(ds) * 10 - mVel) * 0.1;
      mx -= mDir * (50 + mVel) * dt;
      if (mHalf) { if (mx <= -mHalf) mx += mHalf; if (mx > 0) mx -= mHalf; }
      var skew = clamp(mVel / 160, 0, 8) * -mDir;
      marquee.style.transform = "translate3d(" + mx.toFixed(2) + "px,0,0) skewX(" + skew.toFixed(2) + "deg)";
    }

    if (root.classList.contains("has-cursor")) {
      cur.rx += (cur.x - cur.rx) * 0.18; cur.ry += (cur.y - cur.ry) * 0.18;
      dot.style.transform = "translate(" + cur.x + "px," + cur.y + "px) translate(-50%,-50%)";
      ring.style.transform = "translate(" + cur.rx.toFixed(1) + "px," + cur.ry.toFixed(1) + "px) translate(-50%,-50%)";
    }

    if (foot && fw.vis) {
      if (!fw.hover && !reduce) { fw.x = ((now / 1000) % 6) / 6 * 1.6 - 0.3; fw.y = 0.5; }
      foot.style.setProperty("--fx", (fw.x * 100).toFixed(2) + "%");
      foot.style.setProperty("--fy", (fw.y * 100).toFixed(2) + "%");
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener("resize", function () {
    vh = window.innerHeight;
    if (marquee) mHalf = marquee.scrollWidth / 2;
  });
  window.addEventListener("load", function () { if (marquee) mHalf = marquee.scrollWidth / 2; });

  /* ---------- enquiry form (validates in the page; connect a form service before launch) ---------- */
  var form = document.getElementById("project-form");
  if (form) {
    var err = document.getElementById("form-error");
    var doneBox = document.getElementById("form-done");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (f) {
        var bad = !f.value.trim();
        f.setAttribute("aria-invalid", String(bad));
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) {
        err.textContent = "Fill in the highlighted fields so we can get back to you.";
        err.hidden = false;
        firstBad.focus();
        return;
      }
      err.hidden = true;
      form.hidden = true;
      doneBox.hidden = false;
      doneBox.focus();
    });
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim()) e.target.setAttribute("aria-invalid", "false");
    });
  }
})();
