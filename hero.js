/* Titan X hero: wireframe towers that assemble floor by floor.
   Cross-bracing echoes the Truss mark. The camera follows the pointer,
   hovering a floor of the main tower lights it, and a scan line sweeps up. */
(function () {
  "use strict";
  var canvas = document.querySelector("[data-hero]");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SILVER = "242,244,248", BLUE = "46,91,255", BLUE_HI = "106,139,255";
  var FH = 0.46; // floor height in world units
  var towers = [
    { x: 0, z: 0, w: 2.1, d: 2.1, n: 14, delay: 0, brace: 3, main: true },
    { x: 2.75, z: 1.1, w: 1.6, d: 1.6, n: 8, delay: 0.5, brace: 2 },
    { x: 0.9, z: -2.9, w: 1.7, d: 1.5, n: 10, delay: 0.9, brace: 2 }
  ];

  var W = 0, H = 0, dpr = 1;
  var cam = { yaw: 0.62, pitch: 0.3, tyaw: 0.62, tpitch: 0.3 };
  var mouse = { x: -1, y: -1, nx: 0, ny: 0, inside: false };
  var startAt = null, running = false, visible = true, hoverFloor = -1, hoverAmt = [];
  var scrollY = 0;

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) draw(performance.now());
  }

  // world -> screen
  var proj = { cx: 0, gy: 0, f: 0, dist: 15, cy: 0, sy: 0, sp: 0, cp: 0 };
  function setupCamera() {
    var wide = W > 900;
    proj.cx = wide ? W * 0.74 : W * 0.62;
    proj.gy = H * (wide ? 0.62 : 0.6) - scrollY * 0.25;
    proj.f = Math.min(H * 1.3, W * (wide ? 1.05 : 1.6));
    proj.sy = Math.sin(cam.yaw); proj.cy = Math.cos(cam.yaw);
    proj.sp = Math.sin(cam.pitch); proj.cp = Math.cos(cam.pitch);
  }
  function P(x, y, z) {
    y -= 3; // look at mid-height
    var rx = x * proj.cy - z * proj.sy;
    var rz = x * proj.sy + z * proj.cy;
    var ry = y * proj.cp - rz * proj.sp;
    var rz2 = y * proj.sp + rz * proj.cp + proj.dist;
    return { x: proj.cx + rx * proj.f / rz2, y: proj.gy - ry * proj.f / rz2, z: rz2 };
  }
  function depthA(z) { var a = 1 - (z - (proj.dist - 3)) / 9; return a < 0.25 ? 0.25 : a > 1 ? 1 : a; }

  function seg(a, b, rgb, alpha, width) {
    ctx.strokeStyle = "rgba(" + rgb + "," + (alpha * depthA((a.z + b.z) / 2)).toFixed(3) + ")";
    ctx.lineWidth = width || 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function lerpP(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function corners(t, y) {
    var hw = t.w / 2, hd = t.d / 2;
    return [P(t.x - hw, y, t.z - hd), P(t.x + hw, y, t.z - hd), P(t.x + hw, y, t.z + hd), P(t.x - hw, y, t.z + hd)];
  }

  function drawGrid(alpha) {
    var R = 9;
    for (var i = -R; i <= R; i++) {
      for (var j = -R; j < R; j++) {
        var d1 = Math.sqrt(i * i + (j + 0.5) * (j + 0.5)) / R;
        var a = (1 - d1) * 0.22 * alpha;
        if (a <= 0.01) continue;
        seg(P(i, 0, j), P(i, 0, j + 1), SILVER, a, 1);
        seg(P(j, 0, i), P(j + 1, 0, i), SILVER, a, 1);
      }
    }
  }

  function drawTower(t, time, isMain) {
    var floorDur = 0.42, stagger = 0.1;
    for (var k = 0; k < t.n; k++) {
      var s = t.delay + k * stagger;
      var e = clamp((time - s) / floorDur);
      if (e <= 0) break;
      var y0 = k * FH, y1 = y0 + FH;
      var low = corners(t, y0);
      var top = corners(t, y0 + FH * ease(clamp(e * 1.6)));
      var hv = isMain ? (hoverAmt[k] || 0) : 0;
      // columns
      for (var c = 0; c < 4; c++) seg(low[c], top[c], SILVER, 0.55 + hv * 0.4, 1);
      // slab
      var se = ease(clamp((e - 0.45) / 0.55));
      if (se > 0) {
        var full = corners(t, y1);
        for (var q = 0; q < 4; q++) {
          var a = full[q], b = full[(q + 1) % 4];
          seg(a, lerpP(a, b, se), hv > 0.02 ? BLUE_HI : SILVER, 0.6 + hv * 0.4, 1 + hv * 1.2);
        }
        // cross-bracing on braced floors
        if (k % t.brace === 1 || (isMain && k === t.n - 1)) {
          var be = ease(clamp((e - 0.6) / 0.4));
          for (var f = 0; f < 4; f++) {
            var l0 = low[f], l1 = low[(f + 1) % 4], u0 = full[f], u1 = full[(f + 1) % 4];
            seg(l0, lerpP(l0, u1, be), BLUE, 0.75, 1.2);
            seg(l1, lerpP(l1, u0, be), BLUE, 0.75, 1.2);
          }
        }
      }
    }
  }

  function towerBuilt(t, time) { return time > t.delay + (t.n - 1) * 0.1 + 0.42; }

  function drawScan(time) {
    var t = towers[0];
    var built = t.delay + (t.n - 1) * 0.1 + 0.6;
    if (time < built) return;
    var cyc = ((time - built) % 5) / 5; // 5s loop, active for the first 60%
    if (cyc > 0.6) return;
    var p = cyc / 0.6;
    var y = p * t.n * FH;
    var c = corners(t, y), fade = Math.sin(p * Math.PI);
    ctx.save();
    ctx.shadowColor = "rgba(" + BLUE + ",.9)"; ctx.shadowBlur = 14;
    for (var q = 0; q < 4; q++) seg(c[q], c[(q + 1) % 4], BLUE_HI, 0.9 * fade, 1.6);
    ctx.restore();
  }

  function drawMast(time) {
    var t = towers[0];
    var e = ease(clamp((time - (t.delay + t.n * 0.1 + 0.3)) / 0.6));
    if (e <= 0) return;
    var y = t.n * FH;
    var a = P(t.x, y, t.z), b = P(t.x, y + 1.4 * e, t.z);
    seg(a, b, SILVER, 0.7, 1);
    if (e >= 1) {
      var blink = 0.5 + 0.5 * Math.sin(time * 3);
      ctx.fillStyle = "rgba(" + BLUE_HI + "," + (0.4 + blink * 0.6).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function updateHover() {
    var t = towers[0];
    hoverFloor = -1;
    if (mouse.inside && W > 900) {
      var base = P(t.x, 0, t.z), topP = P(t.x, t.n * FH, t.z);
      var halfW = Math.abs(P(t.x + t.w / 2, 0, t.z + t.d / 2).x - P(t.x - t.w / 2, 0, t.z - t.d / 2).x) / 2 + 30;
      if (Math.abs(mouse.x - base.x) < halfW && mouse.y < base.y + 10 && mouse.y > topP.y - 10) {
        var rel = (base.y - mouse.y) / (base.y - topP.y);
        hoverFloor = Math.max(0, Math.min(t.n - 1, Math.floor(rel * t.n)));
      }
    }
    for (var k = 0; k < t.n; k++) {
      var target = k === hoverFloor ? 1 : 0;
      hoverAmt[k] = (hoverAmt[k] || 0) + (target - (hoverAmt[k] || 0)) * 0.18;
    }
    canvas.style.cursor = hoverFloor > -1 ? "crosshair" : "";
  }

  function draw(now) {
    var time = reduce ? 99 : startAt === null ? 0 : (now - startAt) / 1000;
    cam.tyaw = 0.62 + (reduce ? 0 : time * 0.035) + mouse.nx * 0.35 + scrollY * 0.0006;
    cam.tpitch = 0.3 + mouse.ny * 0.1;
    cam.yaw += (cam.tyaw - cam.yaw) * 0.06;
    cam.pitch += (cam.tpitch - cam.pitch) * 0.06;
    setupCamera();
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = W > 900 ? 1 : 0.5;
    ctx.lineCap = "square";
    drawGrid(clamp(time / 1.2));
    // draw far towers first
    var order = towers.slice().sort(function (a, b) { return P(b.x, 0, b.z).z - P(a.x, 0, a.z).z; });
    updateHover();
    order.forEach(function (t) { drawTower(t, time, !!t.main); });
    drawMast(time);
    drawScan(time);
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!running) return;
    if (visible) draw(now);
    requestAnimationFrame(loop);
  }

  function start() {
    if (startAt !== null) return;
    startAt = performance.now();
    if (reduce) { draw(startAt); return; }
    running = true;
    requestAnimationFrame(loop);
  }

  var hero = canvas.parentElement;
  hero.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true;
    mouse.nx = mouse.x / W - 0.5; mouse.ny = mouse.y / H - 0.5;
  });
  hero.addEventListener("pointerleave", function () { mouse.inside = false; mouse.nx = 0; mouse.ny = 0; });
  window.addEventListener("scroll", function () { scrollY = Math.min(window.scrollY, H || 1000); }, { passive: true });
  window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; });

  resize();
  if (document.documentElement.classList.contains("ready")) start();
  document.addEventListener("tx:ready", start);

  if (location.search.indexOf("hero-debug") > -1) window.__txHero = { towers: towers, cam: cam, mouse: mouse, start: start };
})();
