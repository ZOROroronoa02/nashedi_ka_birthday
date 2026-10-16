(function () {
  "use strict";

  var DATA = window.PHOTO_DATA || { photos: [], videos: [] };
  var ALL = DATA.photos.map(function (p) { return p.src; });
  var TOTAL = ALL.length || 1;
  var VIDS = (DATA.videos || []).map(function (v) { return v.src; });

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function R(i, salt) {
    var x = Math.sin((i + 1) * 127.1 + (salt || 0) * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function pick(n, off) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(ALL[(off + i) % TOTAL]);
    return out;
  }
  function spread(n) {
    var out = [], step = TOTAL / n;
    for (var i = 0; i < n; i++) out.push(ALL[Math.floor(i * step) % TOTAL]);
    return out;
  }
  function mkImg(src) {
    var img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "";
    img.src = src;
    return img;
  }
  function mkVid(src) {
    var v = document.createElement("video");
    v.src = src; v.muted = true; v.loop = true;
    v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    return v;
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width: 900px)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------------- confetti ---------------- */
  var confetti = (function () {
    var cv = $("#confetti");
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, parts = [], running = false;
    var COLORS = ["#e7c98c", "#dfa1ab", "#c2707f", "#c0a9dd", "#8a6fa6", "#f6d9dd", "#fff6c8", "#ffffff"];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = Math.floor(innerWidth * dpr);
      H = cv.height = Math.floor(innerHeight * dpr);
      cv.style.width = innerWidth + "px";
      cv.style.height = innerHeight + "px";
    }
    window.addEventListener("resize", resize);
    resize();

    function spawn(n, ox, oy, spread, power) {
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        var sp = (power || 1) * (5 + Math.random() * 13);
        parts.push({
          x: ox != null ? ox * dpr : Math.random() * W,
          y: oy != null ? oy * dpr : -20 * dpr,
          vx: Math.cos(a) * sp * dpr * (0.5 + Math.random()),
          vy: Math.sin(a) * sp * dpr * (0.5 + Math.random()),
          g: 0.2 * dpr,
          w: (4 + Math.random() * 8) * dpr,
          h: (6 + Math.random() * 12) * dpr,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.34,
          col: COLORS[(Math.random() * COLORS.length) | 0],
          circle: Math.random() < 0.3
        });
      }
      if (!running) { running = true; requestAnimationFrame(tick); }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += p.g;
        p.vx *= 0.994; p.vy *= 0.994;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > H + 80 * dpr) { parts.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.y / (H + 90 * dpr));
        ctx.fillStyle = p.col;
        if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(tick);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }

    return {
      burst: function (n, x, y, spread, power) { spawn(n || 120, x, y, spread || Math.PI * 2, power || 1); },
      rain: function (n) { spawn(n || 180, null, null, 0.5, 0.7); }
    };
  })();

  /* ---------------- balloons ---------------- */
  function releaseBalloons(count) {
    var wrap = $("#balloons");
    var colors = ["#dfa1ab", "#c0a9dd", "#e7c98c", "#f6d9dd", "#8a6fa6", "#eebec6", "#c2707f"];
    for (var i = 0; i < (count || 14); i++) {
      (function (i) {
        var b = document.createElement("div");
        var c = colors[(Math.random() * colors.length) | 0];
        b.className = "balloon";
        b.style.left = (2 + Math.random() * 92) + "vw";
        b.style.background = "radial-gradient(circle at 35% 28%, rgba(255,255,255,.55), transparent 52%), " + c;
        b.style.color = c;
        b.style.width = (46 + Math.random() * 34) + "px";
        b.style.height = (58 + Math.random() * 42) + "px";
        wrap.appendChild(b);
        gsap.to(b, {
          y: -(innerHeight + 320),
          x: (Math.random() - 0.5) * 220,
          rotation: (Math.random() - 0.5) * 44,
          duration: 8 + Math.random() * 6,
          delay: Math.random() * 1.6,
          ease: "power1.out",
          onComplete: function () { b.remove(); }
        });
      })(i);
    }
  }

  /* ---------------- music ---------------- */
  var music = (function () {
    var audio = new Audio();
    audio.src = "Blue-Yung-Kai.mp3";
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    var on = false, VOL = 0.62, raf = 0;

    function fade(target, ms, done) {
      cancelAnimationFrame(raf);
      var from = audio.volume, t0 = performance.now();
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (target - from) * k));
        if (k < 1) raf = requestAnimationFrame(step);
        else { audio.volume = target; if (done) done(); }
      })(performance.now());
    }

    function start(btn) {
      if (on) return;
      var p = audio.play();
      var ok = function () {
        on = true;
        if (btn) btn.classList.add("on");
        fade(VOL, 1400);
      };
      if (p && p.then) p.then(ok).catch(function () { on = false; if (btn) btn.classList.remove("on"); });
      else ok();
    }

    function stop(btn) {
      if (!on) return;
      on = false;
      if (btn) btn.classList.remove("on");
      fade(0, 500, function () { audio.pause(); });
    }

    return {
      start: start,
      toggle: function (btn) { if (on) stop(btn); else start(btn); },
      isOn: function () { return on; }
    };
  })();

  /* ---------------- smooth scroll ---------------- */
  var lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, touchMultiplier: 1.6, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  var progressBar = $("#progress");
  lenis.on("scroll", function (e) {
    var p = e.limit > 0 ? e.scroll / e.limit : 0;
    progressBar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
  });

  /* ---------------- ticker ---------------- */
  (function () {
    var words = ["memories", "laughter", "chaos", "midnight talks", "inside jokes", "golden hours", "road trips", "the good stuff", "forever"];
    var inner = words.map(function (w) { return "<span>" + w + "</span><em>✦</em>"; }).join("");
    $("#ticker").innerHTML = inner + inner;
  })();

  /* ---------------- hero ---------------- */
  var HERO = [
    { l: "3%", t: "14%", w: 13, depth: 0.55, speed: 90 },
    { l: "18%", b: "8%", w: 10, depth: 0.9, speed: -70 },
    { r: "4%", t: "17%", w: 12, depth: 0.75, speed: 120 },
    { r: "20%", b: "11%", w: 9, depth: 1.1, speed: -55 },
    { l: "36%", t: "2%", w: 7.5, depth: 1.4, speed: 60 },
    { r: "37%", b: "2%", w: 8, depth: 1.6, speed: -95 }
  ];
  var heroFigs = [];
  (function () {
    var wrapEl = $("#heroPhotos");
    pick(HERO.length, 0).forEach(function (src, i) {
      var L = HERO[i];
      var wrap = document.createElement("div");
      wrap.className = "hp";
      wrap.style.left = L.l || "auto";
      wrap.style.right = L.r || "auto";
      wrap.style.top = L.t || "auto";
      wrap.style.bottom = L.b || "auto";
      wrap.style.width = L.w + "vw";
      wrap.style.zIndex = String(2 + i);
      var fig = document.createElement("figure");
      fig.appendChild(mkImg(src));
      wrap.appendChild(fig);
      wrapEl.appendChild(wrap);
      heroFigs.push({ wrap: wrap, fig: fig, L: L });
    });
  })();

  (function () {
    var nameEl = $("#heroName");
    "RITIKA".split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.textContent = ch;
      nameEl.appendChild(s);
    });
  })();

  gsap.set(".hp", { opacity: 0, scale: 1.16 });
  gsap.set("#heroName span", { yPercent: 112 });
  gsap.set(".eyebrow, .hero-sub, .hero-badge", { opacity: 0, y: 24 });
  gsap.set(".scroll-cue", { opacity: 0, y: 18 });

  heroFigs.forEach(function (o, i) {
    gsap.fromTo(o.wrap, { y: 0 }, {
      y: -o.L.speed,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
    });
  });

  function heroIntro() {
    var tl = gsap.timeline();
    tl.to(".hp", { opacity: 1, scale: 1, duration: 1.7, stagger: 0.09, ease: "power3.out" }, 0)
      .to("#heroName span", { yPercent: 0, duration: 1.25, stagger: 0.055, ease: "power4.out" }, 0.2)
      .to(".eyebrow", { opacity: 1, y: 0, duration: 1 }, 0.35)
      .to(".hero-sub", { opacity: 1, y: 0, duration: 1 }, 0.6)
      .to(".hero-badge", { opacity: 1, y: 0, duration: 1 }, 0.75)
      .to(".scroll-cue", { opacity: 1, y: 0, duration: 1 }, 1.05);
    return tl;
  }

  if (!mobile && !reduced) {
    window.addEventListener("mousemove", function (e) {
      var mx = e.clientX / innerWidth - 0.5;
      var my = e.clientY / innerHeight - 0.5;
      heroFigs.forEach(function (o) {
        gsap.to(o.fig, {
          x: -mx * 44 * o.L.depth,
          y: -my * 44 * o.L.depth,
          duration: 1,
          ease: "power3.out",
          overwrite: "auto"
        });
      });
    }, { passive: true });
  }

  /* ---------------- intro ---------------- */
  (function () {
    var figs = $$(".intro-photo img");
    if (figs[0]) figs[0].src = ALL[8 % TOTAL];
    if (figs[1]) figs[1].src = ALL[9 % TOTAL];

    gsap.to(".intro-lines .line i", {
      yPercent: 0,
      ease: "power3.out",
      stagger: 0.18,
      scrollTrigger: { trigger: "#intro", start: "top 75%", end: "top 25%", scrub: 1 }
    });

    gsap.fromTo(".ip-1", { y: 90, rotation: -13 }, {
      y: -90, rotation: -4, ease: "none",
      scrollTrigger: { trigger: "#intro", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
    });
    gsap.fromTo(".ip-2", { y: 120, rotation: 10 }, {
      y: -70, rotation: 5, ease: "none",
      scrollTrigger: { trigger: "#intro", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
    });
  })();

  /* ---------------- explode ---------------- */
  (function () {
    var stage = $("#explodeStage");
    var count = mobile ? 12 : 18;
    var figs = pick(count, 12).map(function (src) {
      var f = document.createElement("figure");
      f.appendChild(mkImg(src));
      stage.appendChild(f);
      return f;
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#explode", start: "top top", end: "+=280%",
        pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    tl.fromTo(figs,
      { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0.22, opacity: 0, rotation: 0 },
      {
        xPercent: -50, yPercent: -50,
        x: function (i) { var a = (i / count) * Math.PI * 2 + R(i, 1) * 0.8; return Math.cos(a) * innerWidth * (0.19 + R(i, 2) * 0.2); },
        y: function (i) { var a = (i / count) * Math.PI * 2 + R(i, 1) * 0.8; return Math.sin(a) * innerHeight * (0.2 + R(i, 5) * 0.2); },
        scale: function (i) { return 0.75 + R(i, 3) * 0.6; },
        rotation: function (i) { return (R(i, 4) - 0.5) * 52; },
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        stagger: { amount: 1.05, from: "random" }
      }, 0.02);

    tl.to("#explodeWord", { opacity: 0, scale: 0.86, duration: 0.45, ease: "power2.in" }, 0.35);
  })();

  /* ---------------- polaroid ---------------- */
  (function () {
    var stage = $("#polaroidStage");
    var caps = ["remember this?", "our chaos", "golden hour", "that laugh", "no filter", "just us", "forever", "the good old days"];
    var count = mobile ? 5 : 8;
    var frames = pick(count, 34).map(function (src, i) {
      var f = document.createElement("figure");
      f.className = "frame";
      f.appendChild(mkImg(src));
      var c = document.createElement("figcaption");
      c.textContent = caps[i % caps.length];
      f.appendChild(c);
      stage.appendChild(f);
      gsap.set(f, { zIndex: i + 1 });
      return f;
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#polaroid", start: "top top", end: "+=280%",
        pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    tl.fromTo(frames,
      {
        xPercent: -50, yPercent: -50,
        y: function () { return innerHeight * 0.95; },
        x: 0, rotation: function (i) { return (R(i, 7) - 0.5) * 70; },
        scale: 0.68, opacity: 0
      },
      {
        xPercent: -50, yPercent: -50,
        x: function (i) { return (R(i, 1) - 0.5) * innerWidth * 0.46; },
        y: function (i) { return (R(i, 2) - 0.5) * innerHeight * 0.4; },
        rotation: function (i) { return (R(i, 3) - 0.5) * 26; },
        scale: 1, opacity: 1,
        duration: 1, ease: "power2.out",
        stagger: { amount: 1.5, from: "start" }
      }, 0);
  })();

  /* ---------------- filmstrip ---------------- */
  (function () {
    var track = $("#stripTrack");
    var caps = ["the beginning", "that summer", "golden", "unserious", "chaos energy", "sunset", "midnight", "just us", "no filter", "road", "cafe days", "that laugh", "dance", "quiet", "wild", "sweet", "silly", "glow", "vibe check", "core memory", "classic", "always", "happiest", "glitter"];
    var count = mobile ? 16 : 24;
    var vidAt = { 3: 0, 8: 4, 14: 8, 19: 13 };
    pick(count, 44).forEach(function (src, i) {
      var f = document.createElement("figure");
      f.className = "strip-item";
      var vi = vidAt[i];
      var media = (vi !== undefined && VIDS[vi]) ? mkVid(VIDS[vi]) : mkImg(src);
      f.appendChild(media);
      var c = document.createElement("figcaption");
      c.textContent = caps[i % caps.length];
      f.appendChild(c);
      track.appendChild(f);
    });

    var vids = $$("video", track);
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else v.pause();
        });
      }, { rootMargin: "250px" });
      vids.forEach(function (v) { vio.observe(v); });
    } else {
      vids.forEach(function (v) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); });
    }

    var bar = $("#stripBar");
    var distance = function () { return Math.max(1, track.scrollWidth - innerWidth); };

    gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: "#strip", start: "top top",
        end: function () { return "+=" + (distance() * 0.62 + innerHeight * 0.4); },
        pin: ".strip-viewport", scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { bar.style.transform = "scaleX(" + Math.max(0.02, self.progress) + ")"; }
      }
    });
  })();

  /* ---------------- mosaic ---------------- */
  (function () {
    var wrap = $("#mosaicCols");
    var cols = mobile ? 3 : 5;
    var per = 6;
    for (var c = 0; c < cols; c++) {
      var col = document.createElement("div");
      col.className = "mosaic-col";
      for (var k = 0; k < per; k++) {
        var f = document.createElement("figure");
        f.appendChild(mkImg(ALL[(76 + c * per + k) % TOTAL]));
        col.appendChild(f);
      }
      wrap.appendChild(col);
    }
    $$(".mosaic-col").forEach(function (col, i) {
      var dir = i % 2 ? 1 : -1;
      gsap.fromTo(col,
        { y: function () { return dir * innerHeight * 0.1; } },
        {
          y: function () { return dir * -innerHeight * 0.14; },
          ease: "none",
          scrollTrigger: { trigger: "#mosaic", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
        });
    });
  })();

  /* ---------------- cylinder ---------------- */
  (function () {
    var ring = $("#cylRing");
    var count = mobile ? 10 : 16;
    var figs = pick(count, 8).map(function (src) {
      var f = document.createElement("figure");
      f.appendChild(mkImg(src));
      ring.appendChild(f);
      return f;
    });
    var step = 360 / count;

    function layout() {
      var w = parseFloat(getComputedStyle(figs[0]).width) || 200;
      var radius = (w * 0.5) / Math.tan(Math.PI / count) * 1.18;
      figs.forEach(function (f, i) {
        f.style.transform = "translate(-50%,-50%) rotateY(" + (i * step) + "deg) translateZ(" + radius + "px)";
      });
    }
    layout();

    ScrollTrigger.create({
      trigger: "#cylinder", start: "top top", end: "+=320%",
      pin: ".cyl-scene", anticipatePin: 1, invalidateOnRefresh: true,
      onRefresh: layout,
      onUpdate: function (self) {
        var rot = -self.progress * 360 * 1.6;
        ring.style.transform = "rotateY(" + rot + "deg)";
        for (var i = 0; i < figs.length; i++) {
          var a = (rot + i * step) * Math.PI / 180;
          figs[i].style.opacity = (0.3 + 0.7 * (Math.cos(a) * 0.5 + 0.5)).toFixed(3);
        }
      }
    });
  })();

  /* ---------------- 21 mask ---------------- */
  (function () {
    var n = $("#maskNum");
    n.style.backgroundImage = 'url("' + ALL[60 % TOTAL] + '")';
    gsap.fromTo(n,
      { backgroundPosition: "50% 4%" },
      {
        backgroundPosition: "50% 96%", ease: "none",
        scrollTrigger: { trigger: "#mask21", start: "top bottom", end: "bottom top", scrub: true }
      });
  })();

  /* ---------------- letter ---------------- */
  gsap.from("#letterSec .seal, #letterSec h3, #letterSec p, #letterSec .sign", {
    y: 44, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: "#letterSec", start: "top 72%" }
  });

  /* ---------------- finale : a heart made of every photo ---------------- */
  (function () {
    var starsEl = $("#stars");
    for (var i = 0; i < 80; i++) {
      var s = document.createElement("i");
      s.style.left = (Math.random() * 100) + "%";
      s.style.top = (Math.random() * 100) + "%";
      s.style.animationDelay = (Math.random() * 3.4) + "s";
      var sz = 1 + Math.random() * 2.4;
      s.style.width = sz + "px";
      s.style.height = sz + "px";
      starsEl.appendChild(s);
    }

    var wrap = $("#heartPhotos");
    var glow = $("#heartGlow");
    var center = $(".fin-center");
    var candlesWrap = $("#finCandles");
    var btn = $("#wishBtn");

    var COUNT = mobile ? 54 : 90;
    var tiles = spread(COUNT).map(function (src, i) {
      var f = document.createElement("figure");
      f.appendChild(mkImg(src));
      wrap.appendChild(f);
      f._tx = 0; f._ty = 0; f._sx = 0; f._sy = 0;
      f._delay = R(i, 9) * 0.32;
      return f;
    });

    var NC = 21;
    for (var c = 0; c < NC; c++) candlesWrap.appendChild(document.createElement("i"));
    var candles = $$("#finCandles i");

    function layout() {
      var stage = $("#finStage");
      var vw = stage.clientWidth || innerWidth;
      var vh = stage.clientHeight || innerHeight;
      var S = Math.min(vw * 0.86, vh * 0.78, 760);
      var scale = S / 32;
      var minY = 1e9, maxY = -1e9, pts = [];
      for (var i = 0; i < COUNT; i++) {
        var t = (i / COUNT) * Math.PI * 2;
        var hx = 16 * Math.pow(Math.sin(t), 3);
        var hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push([hx, hy]);
        if (hy < minY) minY = hy;
        if (hy > maxY) maxY = hy;
      }
      var midY = (minY + maxY) / 2;
      var shift = mobile ? 0 : vh * 0.05;
      tiles.forEach(function (f, i) {
        f._tx = pts[i][0] * scale;
        f._ty = (pts[i][1] - midY) * scale + shift;
        f._sx = (R(i, 1) - 0.5) * vw * 0.98;
        f._sy = (R(i, 2) - 0.5) * vh * 0.98;
      });
    }
    layout();

    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

    var formed = false, busy = false;

    ScrollTrigger.create({
      trigger: "#finale", start: "top top", end: "+=300%",
      pin: "#finStage", anticipatePin: 1, invalidateOnRefresh: true,
      onRefresh: layout,
      onUpdate: function (self) {
        var p = self.progress;
        var appear = clamp01(p / 0.13);
        var form = easeInOut(clamp01((p - 0.15) / 0.5));
        for (var i = 0; i < tiles.length; i++) {
          var f = tiles[i];
          var d = f._delay;
          var fj = easeInOut(clamp01((form - d) / (1 - d || 1)));
          var x = f._sx + (f._tx - f._sx) * fj;
          var y = f._sy + (f._ty - f._sy) * fj;
          var rot = (1 - fj) * ((R(i, 5) - 0.5) * 44);
          var sc = 0.78 + 0.22 * fj;
          f.style.opacity = appear.toFixed(3);
          f.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg) scale(" + sc.toFixed(3) + ")";
        }
        var gp = clamp01((p - 0.42) / 0.36);
        glow.style.opacity = gp.toFixed(3);
        glow.style.transform = "translate(-50%,-50%) scale(" + (0.45 + 0.6 * clamp01((p - 0.28) / 0.62)).toFixed(3) + ")";
        center.style.opacity = clamp01((p - 0.56) / 0.22).toFixed(3);
        var lit = Math.round(clamp01((p - 0.6) / 0.34) * NC);
        for (var k = 0; k < candles.length; k++) {
          if (k < lit) candles[k].classList.add("lit");
          else candles[k].classList.remove("lit");
        }
        var bp = clamp01((p - 0.8) / 0.15);
        btn.style.opacity = bp.toFixed(3);
        btn.style.pointerEvents = bp > 0.6 ? "auto" : "none";
        if (!formed && p > 0.8) { formed = true; confetti.rain(110); }
      }
    });

    btn.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      candles.forEach(function (cc) { cc.classList.remove("lit"); });
      gsap.fromTo("#heartPhotos", { scale: 1 }, { scale: 1.07, duration: 0.4, yoyo: true, repeat: 1, ease: "power2.inOut" });
      gsap.to("#heartGlow", { opacity: 0.35, duration: 2.2, ease: "power2.out" });
      gsap.fromTo(btn, { scale: 1 }, { scale: 0.94, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.inOut" });
      confetti.burst(190, innerWidth / 2, innerHeight / 2, Math.PI * 2, 1.5);
      window.setTimeout(function () { confetti.burst(140, innerWidth * 0.14, innerHeight * 0.3, Math.PI * 1.1, 1.1); }, 220);
      window.setTimeout(function () { confetti.burst(140, innerWidth * 0.86, innerHeight * 0.3, Math.PI * 1.1, 1.1); }, 430);
      window.setTimeout(function () { confetti.burst(150, innerWidth / 2, innerHeight * 0.72, Math.PI * 1.5, 1.2); }, 640);
      releaseBalloons(20);
      var label = btn.textContent;
      btn.textContent = "\uD83C\uDF89 wish granted, ritika \uD83C\uDF89";
      window.setTimeout(function () { btn.textContent = label; busy = false; }, 3000);
    });
  })();

  /* ---------------- cursor glow ---------------- */
  if (finePointer && !reduced) {
    var glow = $("#glow");
    var shown = false;
    window.addEventListener("mousemove", function (e) {
      if (!shown) { shown = true; glow.style.opacity = "1"; }
      gsap.to(glow, { x: e.clientX, y: e.clientY, duration: 0.7, ease: "power3.out", overwrite: "auto" });
    }, { passive: true });
  }

  /* ---------------- sound ---------------- */
  $("#sound").addEventListener("click", function () { music.toggle(this); });

  /* ---------------- gate + loader ---------------- */
  (function () {
    var gate = $("#gate");
    var loader = $("#loader");
    var curtain = $("#curtain");
    var bloom = $("#ldBloom");
    var ringFg = $("#ldRingFg");
    var numEl = $("#ldNum");
    var wordEl = $("#ldWord");
    var logoEl = $("#ldLogo");
    var flashEl = $("#ldFlash");
    var core = $(".ld-core");

    var PN = reduced ? 0 : (mobile ? 26 : 46);
    var petals = [];
    var psrc = spread(PN);
    for (var i = 0; i < PN; i++) {
      var f = document.createElement("figure");
      f.appendChild(mkImg(psrc[i]));
      bloom.appendChild(f);
      petals.push(f);
    }

    var WORDS = ["lighting the candles", "gathering memories", "twenty-one years of you", "arranging the chaos", "polishing the moments", "one more second", "almost there, ritika"];
    var started = false;

    function finishReveal() {
      loader.style.display = "none";
      document.body.classList.remove("is-booting");
      curtain.style.display = "none";
      ScrollTrigger.refresh();
      lenis.start();
    }

    function runLoader() {
      var vmin = Math.min(innerWidth, innerHeight);
      petals.forEach(function (p, i) {
        p._r = vmin * (0.13 + (i / PN) * 0.62);
        p._a = (i / PN) * Math.PI * 2 * 2.7 + R(i, 4) * 0.4;
      });

      var counted = { v: 0 };
      var tl = gsap.timeline({ onComplete: finishReveal });

      if (PN) {
        gsap.set(petals, { x: 0, y: 0, scale: 0, opacity: 0, rotation: 0 });
        tl.to(petals, {
          x: function (i) { return Math.cos(petals[i]._a) * petals[i]._r; },
          y: function (i) { return Math.sin(petals[i]._a) * petals[i]._r; },
          rotation: function (i) { return (R(i, 3) - 0.5) * 56; },
          scale: 1, opacity: 1,
          duration: 1.1, ease: "power2.out",
          stagger: { each: 0.042, from: "start" }
        }, 0);
        tl.to(bloom, { rotation: 250, duration: 3.5, ease: "power1.inOut" }, 0);
        tl.to(petals, {
          x: function (i) { return Math.cos(petals[i]._a) * petals[i]._r * 2.5; },
          y: function (i) { return Math.sin(petals[i]._a) * petals[i]._r * 2.5; },
          scale: 2.9, opacity: 0,
          duration: 1.15, ease: "power2.in",
          stagger: { each: 0.018, from: "start" }
        }, 2.25);
        tl.to(bloom, { opacity: 0, duration: 0.6, ease: "power2.in" }, 2.95);
      }

      var DUR = PN ? 3.2 : 1.0;
      tl.to(counted, {
        v: 100, duration: DUR, ease: "power1.inOut",
        onUpdate: function () { numEl.textContent = Math.round(counted.v); }
      }, 0);
      tl.to(ringFg, { strokeDashoffset: 0, duration: DUR, ease: "power1.inOut" }, 0);
      for (var w = 0; w < WORDS.length; w++) {
        tl.call((function (txt) {
          return function () { wordEl.textContent = txt; };
        })(WORDS[w]), null, (w / WORDS.length) * DUR);
      }
      tl.to(core, { opacity: 0, scale: 0.85, duration: 0.45, ease: "power2.in" }, DUR + 0.05);

      tl.to(flashEl, { opacity: 0.95, scale: 26, duration: 0.5, ease: "power2.out" }, DUR + 0.15);
      tl.to(logoEl, { opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }, DUR + 0.35);
      tl.to(flashEl, { opacity: 0, duration: 0.7, ease: "power2.in" }, DUR + 0.7);
      tl.to(logoEl, { letterSpacing: "0.34em", duration: 0.9, ease: "power2.out" }, DUR + 0.9);

      tl.set(loader, { display: "none" }, DUR + 1.75);
      tl.call(function () { document.body.classList.remove("is-booting"); }, null, DUR + 1.75);
      tl.to("#curtain span", { scaleY: 0, duration: 0.95, stagger: { each: 0.07 }, ease: "power4.inOut" }, DUR + 1.75);
      tl.add(heroIntro(), DUR + 1.95);
      tl.call(function () { curtain.style.display = "none"; ScrollTrigger.refresh(); lenis.start(); }, null, DUR + 2.85);
    }

    function begin() {
      if (started) return;
      started = true;
      music.start($("#sound"));
      gsap.to(gate, {
        opacity: 0, duration: 0.7, ease: "power2.inOut",
        onComplete: function () {
          gate.style.display = "none";
          runLoader();
        }
      });
    }

    $("#gateBtn").addEventListener("click", begin);

    window.setTimeout(function () {
      if (!started) return;
      if (loader && loader.style.display !== "none" && getComputedStyle(loader).display !== "none") {
        document.body.classList.remove("is-booting");
        loader.style.display = "none";
        curtain.style.display = "none";
        lenis.start();
        ScrollTrigger.refresh();
      }
    }, 14000);
  })();

  /* ---------------- refresh hooks ---------------- */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  });
})();
