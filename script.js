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


/* ---------------- Track Order page: mock lookup ---------------- */

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

  // Mock order database — simulates what a real order-management API would return.
  const ORDERS = {
    "ZR-48213076": {
      title: "Aria Wool Coat + Leather Belt",
      placed: "Aug 18, 2026",
      items: [
        { name: "Aria Wool Coat, Charcoal — Size M", qty: 1 },
        { name: "Leather Belt, Tan — 32in", qty: 1 },
      ],
      currentStep: 4,
      stepDates: ["Aug 18", "Aug 19", "Aug 21", "Aug 23", "Aug 24"],
      carrier: "Zephyr Express Logistics",
      trackingNum: "ZX88213409IN",
      shipTo: "Chennai, Tamil Nadu, IN",
      eta: "Delivered Aug 24, 2026",
      loc: "Delivered — front desk",
      badgeClass: "status-delivered",
      badgeText: "Delivered",
      help: "Delivered and signed for. Need a return? You have until Sep 23, 2026 under our 30-day policy.",
    },
    "ZR-77102934": {
      title: "Runner Sneakers, White",
      placed: "Aug 27, 2026",
      items: [{ name: "Runner Sneakers, White — Size 9", qty: 1 }],
      currentStep: 3,
      stepDates: ["Aug 27", "Aug 27", "Aug 28", "Today", ""],
      carrier: "Zephyr Express Logistics",
      trackingNum: "ZX55190273IN",
      shipTo: "Chennai, Tamil Nadu, IN",
      eta: "Today, by 8:00 PM",
      loc: "Out for delivery — local facility, Chennai",
      badgeClass: "status-transit",
      badgeText: "Out for delivery",
      help: "Your package is on its way with the local courier today. No action needed.",
    },
    "ZR-90042111": {
      title: "Weekender Bag, Zephyr Rewards Edition",
      placed: "Aug 30, 2026",
      items: [{ name: "Zephyr Rewards Weekender Bag, Navy", qty: 1 }],
      currentStep: 1,
      stepDates: ["Aug 30", "In progress", "", "", ""],
      carrier: "Not yet assigned",
      trackingNum: "Pending — assigned once shipped",
      shipTo: "Bengaluru, Karnataka, IN",
      eta: "Sep 5–7, 2026 (estimated)",
      loc: "Bengaluru Fulfillment Center",
      badgeClass: "status-processing",
      badgeText: "Processing",
      help: "Orders are typically processed within 1–2 business days. Tracking details will appear here once it ships.",
    },
    "ZR-10239485": {
      title: "Classic Oxford Shirt, Blue (x2)",
      placed: "Aug 26, 2026",
      items: [{ name: "Classic Oxford Shirt, Blue — Size L", qty: 2 }],
      currentStep: 2,
      stepDates: ["Aug 26", "Aug 26", "Aug 28", "", ""],
      carrier: "Zephyr Express Logistics",
      trackingNum: "ZX40218857IN",
      shipTo: "Mumbai, Maharashtra, IN",
      eta: "Sep 2–4, 2026 (estimated)",
      loc: "In transit — Mumbai sort facility",
      badgeClass: "status-shipped",
      badgeText: "Shipped",
      help: "Tracking can take 24–48 hours to update after a carrier scan. This is normal.",
    },
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

  function renderOrder(id, data) {
    document.getElementById("rOid").textContent = "ORDER " + id;
    document.getElementById("rTitle").textContent = data.title;
    document.getElementById("rMeta").textContent = "Placed " + data.placed;
    document.getElementById("rBadge").className = "status-badge " + data.badgeClass;
    document.getElementById("rBadgeText").textContent = data.badgeText;

    const itemsEl = document.getElementById("rItems");
    itemsEl.innerHTML = "";
    data.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `<span class="name">${item.name}</span><span class="qty">×${item.qty}</span>`;
      itemsEl.appendChild(row);
    });

    document.getElementById("rCarrier").textContent = data.carrier;
    document.getElementById("rTrackNum").textContent = data.trackingNum;
    document.getElementById("rShipTo").textContent = data.shipTo;
    document.getElementById("rEta").textContent = data.eta;
    document.getElementById("rLoc").textContent = data.loc;
    document.getElementById("rHelp").innerHTML = data.help + ' Questions? See our <a href="faq.html#tracking">tracking FAQ</a>.';

    renderTimeline(data.currentStep, data.stepDates);
  }

  function doLookup(rawId) {
    const id = rawId.trim().toUpperCase();

    resultBox.style.display = "none";
    notFound.style.display = "none";
    loading.style.display = "flex";

    // Simulated network fetch — mirrors calling a real order-status API.
    setTimeout(() => {
      loading.style.display = "none";
      const data = ORDERS[id];
      if (data) {
        renderOrder(id, data);
        resultBox.style.display = "block";
        resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        notFound.style.display = "block";
      }
    }, 750);
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
