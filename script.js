/* ============================================================
   Zephyr Retail — shared behavior
   ============================================================ */

/* ---------------- FAQ page: search + category filter ---------------- */

(function faqBehavior() {
  const search = document.getElementById("faqSearch");
  const filters = document.getElementById("faqFilters");
  const empty = document.getElementById("faqEmpty");
  if (!search || !filters) return;

  const categories = Array.from(document.querySelectorAll(".faq-category"));
  let activeFilter = "all";

  function applyFilters() {
    const q = search.value.trim().toLowerCase();
    let anyVisible = false;

    categories.forEach((cat) => {
      const catMatchesFilter = activeFilter === "all" || cat.dataset.category === activeFilter;
      let catHasVisibleItem = false;

      cat.querySelectorAll(".faq-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        const matchesSearch = q === "" || text.includes(q);
        const show = catMatchesFilter && matchesSearch;
        item.style.display = show ? "" : "none";
        if (show) catHasVisibleItem = true;
      });

      cat.style.display = catHasVisibleItem ? "" : "none";
      if (catHasVisibleItem) anyVisible = true;
    });

    empty.style.display = anyVisible ? "none" : "block";
  }

  search.addEventListener("input", applyFilters);

  filters.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      filters.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      applyFilters();
    });
  });

  // Deep-link support: /faq.html#returns opens that category & scrolls to it
  if (window.location.hash) {
    const id = window.location.hash.replace("#", "");
    const chip = filters.querySelector(`[data-filter="${id}"]`);
    if (chip) chip.click();
  }
})();


/* ---------------- Track Order page: live Supabase lookup ---------------- */

(function trackOrderBehavior() {
  const form = document.getElementById("trackForm");
  if (!form) return;

  const orderIdInput = document.getElementById("orderId");
  const loading = document.getElementById("resultLoading");
  const notFound = document.getElementById("resultNotFound");
  const resultBox = document.getElementById("trackResult");
  const timelineTrack = document.getElementById("rTimeline");
  const timelineFill = document.getElementById("rFill");

  const STEPS = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

  // Backed by a real Supabase table (public.orders) via its auto-generated REST API.
  // The publishable key below is safe to expose client-side by design (read-only,
  // enforced by the table's Row Level Security policy) -- same pattern a Freshdesk
  // AI Agent workflow step would use to query this same endpoint.
  const SUPABASE_URL = "https://flpwfhyqqkftrcwyihkr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Jg5_0Ynw7tY8BNqJv4abSA_Aw20IXiv";

  const STATUS_TO_BADGE = {
    "Delivered": "status-delivered",
    "Out for delivery": "status-transit",
    "Processing": "status-processing",
    "Shipped": "status-shipped",
  };

  function renderTimeline(currentStep, stepDates) {
    timelineTrack.querySelectorAll(".tl-step").forEach((el) => el.remove());
    STEPS.forEach((label, i) => {
      const step = document.createElement("div");
      step.className = "tl-step" + (i < currentStep ? " done" : i === currentStep ? " current" : "");
      step.innerHTML = `
        <div class="tl-dot"></div>
        <div class="tl-label">${label}</div>
        <div class="tl-date">${stepDates[i] || ""}</div>
      `;
      timelineTrack.appendChild(step);
    });
    const pct = (currentStep / (STEPS.length - 1)) * 100;
    timelineFill.style.width = pct + "%";
  }

  function renderOrder(row) {
    document.getElementById("rOid").textContent = "ORDER " + row.order_id;
    document.getElementById("rTitle").textContent = row.title;
    document.getElementById("rMeta").textContent = row.customer_name
      ? `Placed ${row.placed_date} · ${row.customer_name}`
      : "Placed " + row.placed_date;

    const badgeClass = STATUS_TO_BADGE[row.status] || "status-processing";
    document.getElementById("rBadge").className = "status-badge " + badgeClass;
    document.getElementById("rBadgeText").textContent = row.status;

    const itemsEl = document.getElementById("rItems");
    itemsEl.innerHTML = "";
    (row.items || []).forEach((item) => {
      const el = document.createElement("div");
      el.className = "item-row";
      el.innerHTML = `<span class="name">${item.name}</span><span class="qty">×${item.qty}</span>`;
      itemsEl.appendChild(el);
    });

    document.getElementById("rCarrier").textContent = row.carrier || "—";
    document.getElementById("rTrackNum").textContent = row.tracking_number || "—";
    document.getElementById("rShipTo").textContent = row.ship_to || "—";
    document.getElementById("rEta").textContent = row.eta || "—";
    document.getElementById("rLoc").textContent = row.current_location || "—";
    document.getElementById("rHelp").innerHTML = (row.help_note || "") + ' Questions? See our <a href="faq.html#tracking">tracking FAQ</a>.';

    renderTimeline(row.current_step, row.step_dates || []);
  }

  async function doLookup(rawId) {
    const id = rawId.trim().toUpperCase();

    resultBox.style.display = "none";
    notFound.style.display = "none";
    loading.style.display = "flex";

    try {
      const url = `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${encodeURIComponent(id)}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (!res.ok) throw new Error("Order lookup failed: " + res.status);

      const rows = await res.json();
      loading.style.display = "none";

      if (rows && rows.length > 0) {
        renderOrder(rows[0]);
        resultBox.style.display = "block";
        resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        notFound.style.display = "block";
      }
    } catch (err) {
      loading.style.display = "none";
      notFound.style.display = "block";
      console.error("Order lookup error:", err);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (orderIdInput.value.trim()) doLookup(orderIdInput.value);
  });

  document.querySelectorAll(".sample-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      orderIdInput.value = chip.dataset.sample;
      doLookup(chip.dataset.sample);
    });
  });
})();


/* ---------------- Zephyr Luxe page: sign in + chat identity ---------------- */

(function luxeLoginBehavior() {
  const loginForm = document.getElementById("luxeLoginForm");
  const chatBtn = document.getElementById("openLuxeChatBtn");
  if (!loginForm && !chatBtn) return;

  const SUPABASE_URL = "https://flpwfhyqqkftrcwyihkr.supabase.co";
  const LOGIN_ENDPOINT = SUPABASE_URL + "/functions/v1/luxe-login";
  const STORAGE_KEY = "zephyr_luxe_profile";

  const modal = document.getElementById("luxeLoginModal");
  const errorBox = document.getElementById("luxeLoginError");
  const submitBtn = document.getElementById("luxeLoginSubmitBtn");
  const signedOutState = document.getElementById("luxeSignedOutState");
  const signedInState = document.getElementById("luxeSignedInState");
  const welcomeName = document.getElementById("luxeWelcomeName");
  const navLink = document.getElementById("luxeSignInLink");

  function openModal(e) {
    if (e) e.preventDefault();
    if (modal) modal.style.display = "flex";
  }
  function closeModal() {
    if (modal) modal.style.display = "none";
  }

  document.getElementById("luxeSignInLink")?.addEventListener("click", openModal);
  document.getElementById("luxeSignInLink2")?.addEventListener("click", openModal);
  document.getElementById("luxeLoginClose")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  function getStoredProfile() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function applySignedInUI(profile) {
    if (signedOutState) signedOutState.style.display = "none";
    if (signedInState) signedInState.style.display = "block";
    if (welcomeName) welcomeName.textContent = "Signed in as " + profile.full_name.split(" ")[0];
    if (navLink) navLink.textContent = profile.full_name.split(" ")[0];
    if (chatBtn) chatBtn.style.display = "inline-flex";
    activateFreshdeskWidget(profile);
  }

  // Widget config lives here, not in the HTML, because identity needs to be
  // injected at init time. Confirmed via Freshchat's own SDK docs: identity
  // is set through config-object keys (externalId, firstName, lastName,
  // email) passed directly to init(), not a separate post-init method call.
  const FRESHDESK_WIDGET = {
    token: "01M11N6P1DBH7PQCAFP7JZVSR5",
    host: "https://bittertruth.freshdesk.com",
    widgetId: "01M11N6RRJ66Z22FJCAY0RE84Z",
  };

  let widgetActivated = false;
  function activateFreshdeskWidget(profile) {
    if (widgetActivated) return;
    widgetActivated = true;

    const nameParts = (profile?.full_name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    const initConfig = {
      token: FRESHDESK_WIDGET.token,
      host: FRESHDESK_WIDGET.host,
      widgetId: FRESHDESK_WIDGET.widgetId,
      externalId: profile?.email,
      email: profile?.email,
      firstName: firstName,
      lastName: lastName,
    };

    window.__zephyrLuxeWidgetConfig = initConfig; // exposed for console debugging

    const code = `
      function initFreshdesk() {
        window.fdWidget.init(${JSON.stringify(initConfig)});
      }
      function initialize(i,t){var e;i.getElementById(t)?initFreshdesk():((e=i.createElement("script")).id=t,e.async=!0,e.src="${FRESHDESK_WIDGET.host}/webchat/js/widget.js",e.onload=initFreshdesk,i.head.appendChild(e))}
      function initiateCall(){initialize(document,"Freshdesk-js-sdk")}
      initiateCall();
    `;

    const liveScript = document.createElement("script");
    liveScript.textContent = code;
    document.body.appendChild(liveScript);

    console.info("Zephyr Luxe: widget initialized with identity config:", initConfig);
  }

  // Restore session on page load, if already signed in this browser session.
  const existing = getStoredProfile();
  if (existing) applySignedInUI(existing);

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in…";

      const email = document.getElementById("luxeEmail").value.trim();
      const password = document.getElementById("luxePassword").value;

      try {
        const res = await fetch(LOGIN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (data.success) {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.profile));
          applySignedInUI(data.profile);
          closeModal();
          loginForm.reset();
        } else {
          errorBox.textContent = data.error || "Invalid email or password. Please try again.";
          errorBox.style.display = "block";
        }
      } catch (err) {
        errorBox.textContent = "Couldn't reach the sign-in service. Please try again.";
        errorBox.style.display = "block";
        console.error("Luxe login error:", err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign in";
      }
    });
  }

  if (chatBtn) {
    chatBtn.addEventListener("click", () => {
      const w = window.fdWidget;
      if (w && typeof w.open === "function") {
        w.open();
      } else if (w && typeof w.show === "function") {
        w.show();
      } else if (w) {
        console.info("fdWidget loaded. Available methods:", Object.keys(w));
      } else {
        alert("The chat widget is still loading — give it a moment and click again.");
      }
    });
  }
})();


/* ---------------- Shared carousel behavior ---------------- */

(function carouselBehavior() {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector(".carousel-track");
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    const dotsWrap = root.querySelector(".carousel-dots");
    if (!track || slides.length === 0) return;

    let index = 0;
    let timer;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Go to slide " + (i + 1));
      dot.addEventListener("click", () => { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("active", di === index));
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    const nextBtn = root.querySelector(".carousel-arrow.next");
    const prevBtn = root.querySelector(".carousel-arrow.prev");
    if (nextBtn) nextBtn.addEventListener("click", () => { next(); resetTimer(); });
    if (prevBtn) prevBtn.addEventListener("click", () => { prev(); resetTimer(); });

    function startTimer() { timer = setInterval(next, 4500); }
    function resetTimer() { clearInterval(timer); startTimer(); }

    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", startTimer);

    startTimer();
  });
})();
