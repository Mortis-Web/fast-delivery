/* ========== Dropdown Toggle for Each Food List ========== */
const dropDownBtns = document.querySelectorAll(".dropDownBtn");
dropDownBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const parent = btn.closest(".foodList");
    if (!parent) return;

    const title = parent.querySelector(".foodListTitle");
    const dropdown = parent.querySelector(".foodDrowdown");

    title?.classList.toggle("active");
    dropdown?.classList.toggle("active");

    btn.style.pointerEvents = "none";
    setTimeout(() => {
      btn.style.pointerEvents = "auto";
    }, 500);
  });
});

/* ========== Shopping Cart Popup ========== */
const cartShower = document.querySelector("#cartShower .submit");
const shoppingCartPopup = document.querySelector("#shoppingCart");
const cartHolder = document.querySelector("#cartHolder");
const closeCartBtn = document.querySelector("#closeCartBtn");

cartShower.addEventListener("click", () => {
  shoppingCartPopup.classList.add("is-visible");
  document.body.style.overflow = "hidden";
});

const closeCart = () => {
  shoppingCartPopup.classList.remove("is-visible");
  document.body.style.overflow = "auto";
};

closeCartBtn.addEventListener("click", closeCart);

shoppingCartPopup.addEventListener("click", (e) => {
  if (!cartHolder.contains(e.target)) {
    closeCart();
  }
});

/* ========== Live Search Filter for Food Items ========== */
const searchInput = document.getElementById("selectedShopSearcher");

searchInput.addEventListener("input", function () {
  const searchValue = this.value.trim().toLowerCase();

  // All items in all lists
  const allFoodItems = document.querySelectorAll(".foodItem");

  allFoodItems.forEach((item) => {
    const foodName =
      item.querySelector(".foodName")?.textContent.trim().toLowerCase() || "";

    // Show if name includes search value
    if (foodName.includes(searchValue)) {
      item.style.display = "flex"; // or "block" based on layout
    } else {
      item.style.display = "none";
    }
  });

  // Hide full foodList if all its items are hidden
  const allLists = document.querySelectorAll(".foodList");
  allLists.forEach((list) => {
    const items = list.querySelectorAll(".foodItem");
    const hasVisible = Array.from(items).some(
      (item) => item.style.display !== "none"
    );
    list.style.display = hasVisible ? "block" : "none";
  });
});


const foodImageModal = document.querySelector("#foodImageModal");
const foodImages = document.querySelectorAll(".foodImage img");

foodImages.forEach((img) => {
  img.addEventListener("mouseenter", () => {
    const rect = img.getBoundingClientRect();
    const modalWidth = foodImageModal.offsetWidth;
    const modalHeight = foodImageModal.offsetHeight;

    // X: left of the image with some margin
    let left = rect.left - modalWidth - 50;
    if (left < 10) left = rect.right + 50;

    // Y: start at viewport center
    let top = (window.innerHeight - modalHeight) / 2;

    // Adjust if the hovered image is near top or bottom
    const imageCenterY = rect.top + rect.height / 2;
    const arrowOffset = imageCenterY - top - 15; // arrow 15px half height

    // If arrow would go out of modal bounds, shift modal
    if (arrowOffset < 10) {
      top = imageCenterY - 15 - 10; // 10px padding
    } else if (arrowOffset > modalHeight - 30) {
      top = imageCenterY - modalHeight + 15 + 10; // 10px padding
    }

    // Position popup
    foodImageModal.style.left = left + "px";
    foodImageModal.style.top = top + "px";

    // Move arrow to point at hovered image
    foodImageModal.style.setProperty(
      "--arrow-top",
      imageCenterY - top - 15 + "px"
    );

    // Set the image
    foodImageModal.querySelector("img").src = img.src;

    // Show popup
    foodImageModal.classList.add("show");
  });

  img.addEventListener("mouseleave", () => {
    foodImageModal.classList.remove("show");
  });
});
