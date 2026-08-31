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
