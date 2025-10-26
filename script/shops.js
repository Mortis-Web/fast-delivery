document.addEventListener("DOMContentLoaded", () => {
  const shops = [...document.querySelectorAll(".shop-card")];
  const pagination = document.getElementById("shopNavNums");
  const btnNext = document.getElementById("shopNavRight");
  const btnPrev = document.getElementById("shopNavLeft");
  const searchInput = document.getElementById("shopSearcher");
  const noMatchFigure = document.getElementById("noShopsMatched");

  let filteredShops = [...shops];
  const perPage = 30;
  let currentPage = 1;

  function updateURL(page) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page);
    window.history.replaceState({}, "", `${location.pathname}?${params}`);
  }

  function showPage(page) {
    const start = (page - 1) * perPage;
    const end = start + perPage;

    // Hide all first
    shops.forEach((shop) => {
      shop.style.display = "none";
      shop.classList.remove("show");
    });

    // Show only filtered shops for this page
    filteredShops.slice(start, end).forEach((shop, i) => {
      shop.style.display = "flex";
      shop.classList.add("hidden");
      setTimeout(() => {
        shop.classList.remove("hidden");
        shop.classList.add("show");
      }, i * 60);
    });

    // Update pagination active state
    document.querySelectorAll("#shopNavNums .page-btn").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.page) === page);
    });

    // Hide next/prev when needed
    const totalPages = Math.ceil(filteredShops.length / perPage);
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

  const maxVisible = 6; // Show up to 6 numbers before using "..."

  function addButton(pageNum, isActive = false) {
    const btn = document.createElement("button");
    btn.className = "page-btn";
    btn.textContent = pageNum;
    btn.dataset.page = pageNum;
    if (isActive) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = pageNum;
      createPagination(); // regenerate
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

  // ✅ Case 1: If total pages ≤ 6 → show all
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      addButton(i, i === currentPage);
    }
    return;
  }

  // ✅ Case 2: If current page is in first 4 → show "1 2 3 4 5 6 ... 20"
  if (currentPage <= 4) {
    for (let i = 1; i <= maxVisible; i++) {
      addButton(i, i === currentPage);
    }
    addDots();
    addButton(totalPages, currentPage === totalPages);
    return;
  }

  // ✅ Case 3: If current page in last 4 → show "1 ... 15 16 17 18 19 20"
  if (currentPage >= totalPages - 3) {
    addButton(1, currentPage === 1);
    addDots();
    for (let i = totalPages - 5; i <= totalPages; i++) {
      addButton(i, i === currentPage);
    }
    return;
  }

  // ✅ Case 4: Middle pages → "1 ... 8 9 10 11 12 ... 20"
  addButton(1);
  addDots();
  for (let i = currentPage - 2; i <= currentPage + 2; i++) {
    addButton(i, i === currentPage);
  }
  addDots();
  addButton(totalPages);
}

  // ✅ Fix here: use .shopName (not .shop-name)
function updateSearch() {
  const query = searchInput.value.trim().toLowerCase();

  filteredShops = shops.filter((card) =>
    card
      .querySelector(".shopName")
      .textContent.trim()
      .toLowerCase()
      .includes(query)
  );

  currentPage = 1;

  // ✅ If no shops match
  if (filteredShops.length === 0) {
    createPagination();
    showPage(currentPage);

    // Hide Next button, show Prev only for reset
    btnNext.style.display = "none";
    btnPrev.style.display = "inline-block";

    // ✅ Clicking Prev now resets input & shows all shops again
    btnPrev.onclick = () => {
      searchInput.value = ""; // clear input
      filteredShops = [...shops]; // reset data
      currentPage = 1;
      createPagination();
      showPage(currentPage);
    };

    return; // stop here
  }

  // ✅ Normal behavior if shops are found
  createPagination();
  showPage(currentPage);
}


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

  // Initial Load
  createPagination();
  showPage(currentPage);

  // Live search
  searchInput.addEventListener("input", updateSearch);
});
