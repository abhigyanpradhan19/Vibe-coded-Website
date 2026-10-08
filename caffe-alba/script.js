/* ============================================================
   Caffè Alba — interactions
   ============================================================ */
(() => {
  "use strict";

  window.__alba = true;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Intro ---------- */
  const intro = $("#intro");
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    document.body.classList.add("is-ready");
    revealAll();
    if (intro) setTimeout(() => intro.remove(), 900);
  };
  if (document.readyState === "complete") setTimeout(start, 900);
  else window.addEventListener("load", () => setTimeout(start, 700));
  setTimeout(start, 2600); // safety net

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  let io = null;

  function revealAll() {
    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-in"));
      return;
    }
    if (io) return;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Scroll driven effects ---------- */
  const header = $("#header");
  const progress = $("#progress");
  const heroVisual = $("#heroVisual");
  const band = $(".band");
  const shapes = $$(".shape");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;

    header.classList.toggle("is-stuck", y > 24);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    if (reduced) { ticking = false; return; }

    if (heroVisual && y < window.innerHeight * 1.3) {
      heroVisual.style.transform = `translate3d(0, ${y * -0.055}px, 0)`;
    }

    shapes.forEach((s, i) => {
      const speed = parseFloat(s.dataset.speed || "0.08");
      const amp = 24 + speed * 130;
      s.style.setProperty("--py", `${Math.sin(y * 0.0016 + i * 1.15) * amp}px`);
    });

    if (band) {
      const r = band.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        band.style.setProperty("--bandY", `${p * -46}px`);
      }
    }

    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  const closeNav = () => {
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  };
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", closeNav));
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !burger.contains(e.target)) closeNav();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- Menu filter ---------- */
  const tabs = $$(".tab");
  const items = $$(".menu__item");
  const filterMenu = (filter) => {
    let shown = 0;
    items.forEach((item) => {
      const show = filter === "all" || item.dataset.cat === filter;
      if (!show) { item.classList.add("is-hidden"); return; }
      item.classList.remove("is-hidden");
      if (reduced) return;
      const delay = Math.min(shown * 45, 360);
      item.classList.add("is-enter");
      item.style.transitionDelay = `${delay}ms`;
      shown++;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        item.classList.remove("is-enter");
        setTimeout(() => { item.style.transitionDelay = ""; }, 700);
      }));
    });
  };
  const selectTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    filterMenu(tab.dataset.filter);
  };

  tabs.forEach((tab, i) => {
    tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let step = map[e.key];
      if (e.key === "Home") step = null;
      else if (e.key === "End") step = null;
      else if (!step) return;
      e.preventDefault();
      const n = tabs.length;
      const next = e.key === "Home" ? 0
        : e.key === "End" ? n - 1
        : (i + step + n) % n;
      selectTab(tabs[next], true);
    });
  });

  /* ---------- Count up ---------- */
  const counters = $$("[data-count]");
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    const dur = 1500;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduced && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach((c) => { c.textContent = c.dataset.count; });
  }

  /* ---------- Testimonials ---------- */
  const voices = $$(".voice");
  const dots = $$("#voiceDots button");
  let current = Math.max(0, voices.findIndex((v) => v.classList.contains("is-active")));
  let timer = null;
  const showVoice = (i) => {
    current = i;
    voices.forEach((v, k) => v.classList.toggle("is-active", k === i));
    dots.forEach((d, k) => {
      d.classList.toggle("is-active", k === i);
      d.setAttribute("aria-pressed", String(k === i));
    });
  };
  const rotate = () => {
    if (reduced || voices.length < 2) return;
    clearInterval(timer);
    timer = setInterval(() => showVoice((current + 1) % voices.length), 6500);
  };
  dots.forEach((d, i) => d.addEventListener("click", () => { showVoice(i); rotate(); }));
  showVoice(current);
  rotate();

  /* ---------- Active nav link ---------- */
  const sections = $$("section[id]");
  const navLinks = $$(".nav__link");
  if (sections.length && "IntersectionObserver" in window) {
    const sio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => sio.observe(s));
  }

  /* ---------- Reservation form ---------- */
  const form = $("#reserve");
  const msg = $("#reserveMsg");
  const toast = $("#toast");
  let toastTimer;
  const showToast = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 5200);
  };

  if (form) {
    const dateInput = form.querySelector('input[name="date"]');
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.namedItem("name").value.trim();
      const date = form.elements.namedItem("date").value;
      if (!name || !date) {
        msg.classList.remove("is-ok");
        msg.textContent = "Please add your name and a date — grazie.";
        return;
      }
      const guests = form.elements.namedItem("guests").value;
      const time = form.elements.namedItem("time").value;
      msg.classList.add("is-ok");
      msg.textContent = `Table for ${guests} held — see you then.`;
      showToast(`Grazie, ${name}! Table for ${guests} on ${date} at ${time}, 148 5th Street.`);
      form.reset();
    });
  }

  /* ---------- Image fallback ---------- */
  $$("img").forEach((img) => img.addEventListener("error", () => {
    img.style.visibility = "hidden";
    const host = img.parentElement;
    if (host) {
      host.style.background = "linear-gradient(140deg, #efe6d7, #d8c9ae)";
      host.style.minHeight = "220px";
    }
  }, { once: true }));

  /* ---------- Year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
