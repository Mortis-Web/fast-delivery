document.addEventListener("DOMContentLoaded", () => {
  let currentSort = null; // e.g. 'alphabet', 'fee', 'rating', etc.
  let sortDirection = "asc"; // or 'desc'
  const shops = [...document.querySelectorAll(".availableShop")];
  const pagination = document.getElementById("shopNavNums");
  const btnNext = document.getElementById("shopNavRight");
  const btnPrev = document.getElementById("shopNavLeft");
  const searchInput = document.getElementById("selectedShopSearcher");
  const noMatchFigure = document.getElementById("noShopsMatched");

  // Checkbox IDs in your HTML: rating, deliveryPrice, deliveryTime
  const filterRating = document.getElementById("filterRating"); // +4.0 checkbox
  const filterFree = document.getElementById("filterFree"); // free delivery checkbox
  const filterFast = document.getElementById("deliveryTime"); // <30 mins checkbox
  const filterBtn = document.getElementById("filterShopsBtn");

  let filteredShops = [...shops];
  const perPage = 8;
  let currentPage = 1;

  function updateURL(page) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page);
    window.history.replaceState({}, "", `${location.pathname}?${params}`);
  }

  function showPage(page) {
    const start = (page - 1) * perPage;
    const end = start + perPage;

    shops.forEach((shop) => {
      shop.style.display = "none";
      shop.classList.remove("show");
    });

    filteredShops.slice(start, end).forEach((shop, i) => {
      shop.style.display = "flex";
      shop.classList.add("hidden");
      setTimeout(() => {
        shop.classList.remove("hidden");
        shop.classList.add("show");
      }, i * 60);
    });

    document
      .querySelectorAll("#shopNavNums .page-btn")
      .forEach((btn) =>
        btn.classList.toggle("active", Number(btn.dataset.page) === page)
      );

    const totalPages = Math.ceil(filteredShops.length / perPage) || 1;
    btnPrev.style.display = page === 1 ? "none" : "inline-block";
    btnNext.style.display = page === totalPages ? "none" : "inline-block";

    noMatchFigure.style.display = filteredShops.length ? "none" : "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateURL(page);
  }

  function createPagination() {
    const totalPages = Math.ceil(filteredShops.length / perPage);
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const maxVisible = 6;

    function addButton(num, isActive) {
      const btn = document.createElement("button");
      btn.className = "page-btn";
      btn.textContent = num;
      btn.dataset.page = num;
      if (isActive) btn.classList.add("active");
      btn.onclick = () => {
        currentPage = num;
        createPagination();
        showPage(currentPage);
      };
      pagination.appendChild(btn);
    }

    function addDots() {
      const span = document.createElement("span");
      span.className = "dots";
      span.textContent = "...";
      pagination.appendChild(span);
    }

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) addButton(i, i === currentPage);
      return;
    }

    if (currentPage <= 4) {
      for (let i = 1; i <= maxVisible; i++) addButton(i, i === currentPage);
      addDots();
      addButton(totalPages);
      return;
    }

    if (currentPage >= totalPages - 3) {
      addButton(1);
      addDots();
      for (let i = totalPages - 5; i <= totalPages; i++)
        addButton(i, i === currentPage);
      return;
    }

    addButton(1);
    addDots();
    for (let i = currentPage - 2; i <= currentPage + 2; i++)
      addButton(i, i === currentPage);
    addDots();
    addButton(totalPages);
  }

  // Helper: check delivery price text for free or numeric
  function parseDeliveryPrice(text) {
    if (!text) return { isFree: false, price: null };
    const t = text.trim().toLowerCase();
    // detect Arabic "مجاني" or english "free"
    if (t.includes("مجاني") || t.includes("free"))
      return { isFree: true, price: 0 };
    // try to extract number (supports "100.00" or "100")
    const match = t.match(/(\d+[\.,]?\d*)/);
    if (match) {
      const num = parseFloat(match[1].replace(",", "."));
      return { isFree: num === 0, price: num };
    }
    return { isFree: false, price: null };
  }

  // Helper: parse delivery time. Prefer .timer span, else parse any number in text
  function parseDeliveryTime(shop) {
    const timerSpan = shop.querySelector(".timer");
    if (timerSpan) {
      const n = parseInt(timerSpan.textContent.trim());
      return Number.isNaN(n) ? null : n;
    }
    const timeText =
      shop.querySelector(".deliveryTime")?.textContent ||
      shop.querySelector(".delivery-time")?.textContent ||
      "";
    const match = timeText.match(/(\d+)\s*/);
    if (match) return parseInt(match[1]);
    return null;
  }

  // Main filter combining search + checkboxes
  function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();

    filteredShops = shops.filter((shop) => {
      const name =
        shop
          .querySelector(".availableShopName")
          ?.textContent.trim()
          .toLowerCase() || "";

      // 1) Filter by search (shop name)
      if (query && !name.includes(query)) return false;

      // 2) Filter by Rating - Very Good only
      const ratingText =
        shop.querySelector(".shopRating")?.textContent.trim() || "";
      if (filterRating?.checked) {
        const r = ratingText.toLowerCase().replace(/\s+/g, "");
        const isVeryGood =
          r.includes("verygood") ||
          r.includes("جيدجداً") ||
          r.includes("جيدجدا");

        if (!isVeryGood) return false;
      }

      // 3) Filter by Delivery fee (Free only)
      const deliveryPaymentText =
        shop.querySelector(".delieveryPayment")?.textContent.trim() || "";
      const { isFree, price } = parseDeliveryPrice(deliveryPaymentText);
      if (filterFree?.checked && !isFree) return false;

      // 4) Filter by Fast delivery (≤ 30 mins)
      const timeNum = parseDeliveryTime(shop);
      if (filterFast?.checked && (timeNum === null || timeNum > 30))
        return false;

      return true; // ✅ Passes filters
    });

    currentPage = 1;
    createPagination();
    showPage(currentPage);
  }

  function setActiveSort(sortId) {
    document
      .querySelectorAll(".filterCategory")
      .forEach((el) => el.classList.remove("active"));

    if (currentSort === sortId) {
      // If clicking same sort → reverse direction
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortDirection = "asc";
    }

    currentSort = sortId;
    document.getElementById(sortId).classList.add("active");
  }

  function getFirstLetter(shop) {
    const name =
      shop
        .querySelector(".availableShopName")
        ?.textContent.trim()
        .toLowerCase() || "";
    return name.charAt(0);
  }

  function getShopName(shop) {
  return shop.querySelector(".availableShopName")?.textContent.trim().toLowerCase() || "";
}

function getMinPay(shop) {
  const text = shop.querySelector(".minPay")?.textContent || "";
  const num = parseFloat(text.match(/[\d.]+/)?.[0]);
  return isNaN(num) ? 0 : num;
}

function applySorting() {
  shops.sort((a, b) => {
    if (currentSort === "alphabeticOrder") {
      return sortDirection === "asc"
        ? getShopName(a).localeCompare(getShopName(b), "ar")
        : getShopName(b).localeCompare(getShopName(a), "ar");
    }

    if (currentSort === "minPayOrder") {
      return sortDirection === "asc"
        ? getMinPay(a) - getMinPay(b)
        : getMinPay(b) - getMinPay(a);
    }

    if (currentSort === "deliveryTimeOrder") {
      const tA = parseDeliveryTime(a) ?? 999;
      const tB = parseDeliveryTime(b) ?? 999;
      return sortDirection === "asc" ? tA - tB : tB - tA;
    }

    if (currentSort === "deliveryFeeOrder") {
      const feeA =
        parseDeliveryPrice(a.querySelector(".delieveryPayment")?.textContent)
          .price ?? 9999;
      const feeB =
        parseDeliveryPrice(b.querySelector(".delieveryPayment")?.textContent)
          .price ?? 9999;
      return sortDirection === "asc" ? feeA - feeB : feeB - feeA;
    }

    if (currentSort === "ratingOrder") {
      const rA =
        parseFloat(
          a.querySelector(".shopRating")?.textContent.match(/[\d.]+/)?.[0]
        ) || 0;
      const rB =
        parseFloat(
          b.querySelector(".shopRating")?.textContent.match(/[\d.]+/)?.[0]
        ) || 0;
      return sortDirection === "asc" ? rA - rB : rB - rA;
    }

    return 0;
  });

  // ✅ After sorting, update filtered list and apply filters
  filteredShops = [...shops];
  applyFilters();
}


  function sortAndShow(sortId) {
    setActiveSort(sortId); // toggle active & direction
    applySorting(); // sort filteredShops
    currentPage = 1;
    createPagination();
    showPage(currentPage);
  }

  document
    .getElementById("alphabeticOrder")
    .addEventListener("click", () => sortAndShow("alphabeticOrder"));
  document
    .getElementById("deliveryFeeOrder")
    .addEventListener("click", () => sortAndShow("deliveryFeeOrder"));
  document
    .getElementById("deliveryTimeOrder")
    .addEventListener("click", () => sortAndShow("deliveryTimeOrder"));
  document
    .getElementById("minPayOrder")
    .addEventListener("click", () => sortAndShow("minPayOrder"));
  document
    .getElementById("ratingOrder")
    .addEventListener("click", () => sortAndShow("ratingOrder"));

  // Event listeners
  searchInput?.addEventListener("input", applyFilters);
  filterBtn?.addEventListener("click", applyFilters);

  btnNext.onclick = () => {
    const totalPages = Math.ceil(filteredShops.length / perPage);
    if (currentPage < totalPages) {
      currentPage++;
      showPage(currentPage);
    }
  };

  btnPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      showPage(currentPage);
    }
  };

  // initial
  currentSort = "alphabeticOrder"; // ✅ default sort
  sortDirection = "asc";
  applySorting(); // ✅ sort first
  createPagination(); // ✅ after sorting
  showPage(1); // ✅ now show first page sorted A → Z
  document.getElementById("alphabeticOrder").classList.add("active");
});
