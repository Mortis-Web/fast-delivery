// ✅ Global Cart System — Runs on All Pages

document.addEventListener("DOMContentLoaded", () => {


  const placeIdEl = document.querySelector("#placeId");
  const areaIdEl = document.querySelector("#areaId");
  let deliveryFeeEl = document.querySelector("#deliveryFee");
  const shopAreaIdEl = document.querySelector("#shopAreaId");
  const shopIdEl = document.querySelector("#shopId"); // you said id="shopId"

  const shopNameEl = document.querySelector("#shopName");

// if (shopAreaIdEl) {
//   localStorage.setItem("currentShopAreaId", shopAreaIdEl.textContent.trim());
// }
const areaDiscountEl = document.querySelector("#areaDiscountPercentage");
let GLOBAL_AREA_DISCOUNT = areaDiscountEl
  ? parseFloat(areaDiscountEl.textContent.trim().replace("%", "")) || 0
  : 0;

  let GLOBAL_PLACE_ID = placeIdEl ? placeIdEl.textContent.trim() : null;
  let GLOBAL_AREA_ID = areaIdEl ? areaIdEl.textContent.trim() : null;
  let GLOBAL_DELIVERY_FEE = deliveryFeeEl ? parseFloat(deliveryFeeEl.textContent.trim()) || 0 : 0;



  function showCartToast(message = "تمت الإضافة إلى السلة!", options = {}) {
    const {
      background = "#ffc119", // toast background
        color = "#fff", // text color
        icon = "success",
    } = options;

    const progressColor = icon === "success" ? "#a5dc86" : "#ffeb3b";

    // Responsive position & scale
    const isMobile = window.innerWidth <= 600;
    const position = isMobile ? "top" : "top-end";
    const width = isMobile ? "90%" : "auto";
    const customPadding = isMobile ? "0.5em" : "";

    Swal.fire({
      toast: true,
      position: position,
      icon: icon,
      title: message,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: background,
      color: color,
      width: width,
      padding: customPadding,
      customClass: {
        timerProgressBar: 'custom-toast-progress'
      },
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    // Inject custom style for this toast instance
    const style = document.createElement("style");
    style.textContent = `
    .swal2-container .custom-toast-progress {
      background: ${progressColor} !important;
    }
  `;
    document.head.appendChild(style);
  }


  const cart = {
    items: JSON.parse(localStorage.getItem("cartItems")) || [],
    deliveryFee: parseFloat(document.querySelector("#deliveryFee")?.textContent.trim()) || 0,

    save() {
      localStorage.setItem("cartItems", JSON.stringify(this.items));
      this.saveSummary();
      updateCartUI();
      updateCartCounter();
      updateTotalPayAmount();
    },


saveSummary() {
  const rawSubtotal = this.getSubtotal(); // raw sum of all items
  const delivery = this.deliveryFee || 0;

  // =====================================
  // 💥 DELIVERY DISCOUNT LOGIC
  // =====================================
  let discountAmount = 0;
  let discountedDelivery = delivery;

 const uniqueShops = [...new Set(this.items.map(i => i.shopId))];

// Apply discount to delivery ONLY if more than one shop
if (uniqueShops.length > 1) {
    discountAmount = delivery * (GLOBAL_AREA_DISCOUNT / 100);
    discountedDelivery = delivery - discountAmount;
}


  // =====================================

  const summary = {
    subtotal: rawSubtotal.toFixed(2),         // raw subtotal of items
    delivery: discountedDelivery.toFixed(2),  // delivery after discount
    total: (rawSubtotal + discountedDelivery).toFixed(2), // total includes discounted delivery
    discount: discountAmount.toFixed(2),      // only delivery discount
  };

  localStorage.setItem("cartSummary", JSON.stringify(summary));
}


,

    getSubtotal() {
      return this.items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        return sum + price * item.amount;
      }, 0);
    },


    addItem(item) {
      const currentShopId = localStorage.getItem("currentShopId");
      const currentShopName = localStorage.getItem("currentShopName");

      // Check if the shop already exists in the cart
      const shopExists = this.items.some(i => i.shopId === currentShopId);

      // ⚠️ Different shop, first product of a new shop
      if (!shopExists && this.items.length > 0) {
        const newItem = {
          ...item,
          amount: 1,
          placeId: GLOBAL_PLACE_ID,
          areaId: GLOBAL_AREA_ID,
          deliveryFee: GLOBAL_DELIVERY_FEE,
          shopId: currentShopId,
          shopName: currentShopName,
            shopAreaId: localStorage.getItem("currentShopAreaId"),
        };

        Swal.fire({
          title: "منتج من متجر مختلف",
          text: "هل تريد إضافة هذا المنتج من متجر آخر؟",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "نعم، أضف المنتج",
          cancelButtonText: "إلغاء",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            cart.items.push(newItem); // ✅ use cart instead of this
            cart.save(); // ✅ use cart.save()
            showCartToast("تم إضافة المنتج من متجر مختلف!");
          }
        });

        // Optional: update UI immediately
        updateCartUI();
        updateCartCounter();
        updateTotalPayAmount();


        console.log("Adding item to shop:", currentShopId, currentShopName);


        return;
      }



      // ✅ Normal flow: find existing item by both id and shopId
      const existing = this.items.find(i => i.id === item.id && i.shopId === currentShopId);
      if (existing) {
        existing.amount += 1;
      } else {
        this.items.push({
          ...item,
          amount: 1,
          placeId: GLOBAL_PLACE_ID,
          areaId: GLOBAL_AREA_ID,
          deliveryFee: GLOBAL_DELIVERY_FEE,
          shopId: currentShopId,
          shopName: currentShopName,
          shopAreaId: localStorage.getItem("currentShopAreaId"),

        });
      }

      this.save();
    },



    removeItem(id, shopId) {
      // Remove the specific product from a specific shop
      this.items = this.items.filter(i => !(i.id === id && i.shopId === shopId));
      this.save();
    },

    increaseItem(id, shopId) {
      const existing = this.items.find(i => i.id === id && i.shopId === shopId);
      if (existing) {
        existing.amount += 1;
        this.save();
      }
    },

    decreaseItem(id, shopId) {
      const existing = this.items.find(i => i.id === id && i.shopId === shopId);
      if (!existing) return;

      existing.amount -= 1;
      if (existing.amount <= 0) {
        this.removeItem(id, shopId);
      } else {
        this.save();
      }
    }

  };



  /* ========== COUNTER ========== */
  function updateCartCounter() {
    const counter = document.querySelector("#cartItemsNumber");
    if (!counter) return;
    const total = cart.items.reduce((sum, item) => sum + item.amount, 0);
    counter.textContent = total;
  }

  /* ========== TOTAL PAY (for mobile/cart icon bar) ========== */
  function updateTotalPayAmount() {
    const el = document.querySelector("#totalPayAmount");
    if (!el) return;

    // Use cart summary if exists
    const summary = JSON.parse(localStorage.getItem("cartSummary")) || {
      subtotal: 0,
      delivery: cart.deliveryFee,
      total: 0
    };

    el.textContent = "المجموع: EGP " + Number(summary.total).toFixed(2);
  }


  /* ========== MAIN CART UI (Popup Cart) ========== */
  function updateCartUI() {
    const inCart = document.querySelector("#inCartItems");
    const empty = document.querySelector("#emptyCart");
    if (!inCart || !empty) return;

    // Remove old wrapper if exists
    const oldWrapper = inCart.querySelector(".orderedItemsWrapper");
    if (oldWrapper) oldWrapper.remove();

    // Show empty message if cart is empty
    if (cart.items.length === 0) {
      empty.style.display = "flex";
      inCart.style.display = "none";
      cart.saveSummary();
      updateCartCounter();
      updateTotalPayAmount();
      return;
    }

    empty.style.display = "none";
    inCart.style.display = "flex";

    // Create wrapper for items
    const wrapper = document.createElement("div");
    wrapper.classList.add("orderedItemsWrapper");

    const preDeliveryEl = inCart.querySelector(".preDeliveryFeeAmount");
    if (preDeliveryEl) {
      inCart.insertBefore(wrapper, preDeliveryEl);
    } else {
      inCart.appendChild(wrapper);
    }

    // Group items by shopId
    const itemsByShop = {};
    cart.items.forEach(item => {
      if (!itemsByShop[item.shopId]) {
        itemsByShop[item.shopId] = {
          shopName: item.shopName || "المتجر",
          items: []
        };
      }
      itemsByShop[item.shopId].items.push(item);
    });

    // Render each shop group
    Object.keys(itemsByShop).forEach(shopId => {
      const group = itemsByShop[shopId];

      // Shop label
      const shopLabel = document.createElement("div");
      shopLabel.classList.add("cartShopLabel");
      shopLabel.textContent = group.shopName;
      wrapper.appendChild(shopLabel);

      // Render each product in shop
      group.items.forEach(item => {
        const priceNum = Number(item.price) || 0;
        const totalPrice = priceNum * item.amount;

        const article = document.createElement("article");
        article.classList.add("orderedItem");
        article.innerHTML = `
        <div class="cartItemAmountHandlers">
          <button class="decrease">-</button>
          <span class="itemAmount">${item.amount}</span>
          <button class="increase">+</button>
        </div>
        <span class="orderedItemName">${item.name}</span>
        <span class="totalItemPrice">${totalPrice.toLocaleString()} ج.م</span>
        <span class="removeCartItem">✕</span>
      `;
        wrapper.appendChild(article);

        // Buttons
        article.querySelector(".increase").onclick = () => cart.increaseItem(item.id, item.shopId);
        article.querySelector(".decrease").onclick = () => cart.decreaseItem(item.id, item.shopId);
        article.querySelector(".removeCartItem").onclick = () => cart.removeItem(item.id, item.shopId);
      });
    });

    // Update totals
    cart.saveSummary();
    updateCartCounter();
    updateTotalPayAmount();

    // Update subtotal, delivery,  total in the popup
    const summary = JSON.parse(localStorage.getItem("cartSummary")) || {
      subtotal: 0,
      delivery: cart.deliveryFee,
      total: 0
    };

    const subtotalEl = document.querySelector(".subtotalAmount");
    const deliveryEls = document.querySelectorAll(".deliveryFee");
    const totalEl = document.querySelector(".totalAmount");

    if (subtotalEl) subtotalEl.textContent = Number(summary.subtotal).toLocaleString() + " ج.م";
    if (deliveryEls.length >= 1) deliveryEls[0].textContent = Number(summary.delivery).toFixed(2) + " ج.م";
    if (totalEl) totalEl.textContent = Number(summary.total).toLocaleString() + " ج.م";
  }



  /* ========== ADD TO CART BUTTONS ========== */
  function initAddToCartByCard() {
    const foodItems = document.querySelectorAll(".foodItem");

    foodItems.forEach((itemEl) => {
      itemEl.addEventListener("click", (e) => {
        // Ignore clicks on buttons inside the item
        if (e.target.closest("button")) return;

        const id = itemEl.getAttribute("id");
        const name = itemEl.querySelector(".foodName")?.textContent.trim();
        const price = itemEl.querySelector(".foodNewPrice")?.textContent.trim();

        if (id && name && price) {
          // Load clicked IDs from localStorage
          let clickedIds = JSON.parse(localStorage.getItem("clickedProductIds")) || [];

          // Only add to clicked IDs if not already present
          const isNewClick = !clickedIds.includes(id);
          if (isNewClick) {
            clickedIds.push(id);
            localStorage.setItem("clickedProductIds", JSON.stringify(clickedIds));
          }

          // Add item to cart
          cart.addItem({
            id, // unique product ID
            name,
            price: parseFloat(price.replace(/[^\d.]/g, "")),
            placeId: GLOBAL_PLACE_ID,
            areaId: GLOBAL_AREA_ID,
            deliveryFee: GLOBAL_DELIVERY_FEE,
            shopId: localStorage.getItem("currentShopId"),

            shopName: localStorage.getItem("currentShopName"), // add this
          shopAreaId: localStorage.getItem("currentShopAreaId"),


          });


          // Show toast ONLY if first time clicked
          if (isNewClick) {
            showCartToast(`تم إضافة "${name}" إلى السلة!`);
          }

          console.log("Clicked product IDs:", clickedIds);
        }
      });
    });
  }


  // ✅ Function to empty the cart
  function attachEmptyCartButton(buttonSelector, options = {}) {
    const btn = document.querySelector(buttonSelector);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const doEmpty = () => {
        cart.items = [];
        cart.save();
        if (options.clearClickedIds) {
          localStorage.setItem("clickedProductIds", JSON.stringify([]));
        }
        if (options.toastMessage) {
          showCartToast(options.toastMessage);
        }
      };

      if (options.confirm) {
        Swal.fire({
          title: options.confirmMessage || "هل أنت متأكد أنك تريد تفريغ السلة؟",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "نعم، تفريغ",
          cancelButtonText: "إلغاء",
          reverseButtons: true
        }).then((result) => {
          if (result.isConfirmed) {
            doEmpty();
          }
        });
      } else {
        doEmpty();
      }
    });
  }

  attachEmptyCartButton("#emptyCartBtn", {
    confirm: true,
    confirmMessage: "هل أنت متأكد أنك تريد تفريغ السلة؟",
    toastMessage: "تم تفريغ السلة!",
    clearClickedIds: true,
  });


  /* ========== CHECKOUT PAGE LOADER ========== */
  function loadCheckoutSummary() {
    if (!window.location.pathname.includes("checkout")) return;
    const stored = localStorage.getItem("cartSummary");
    if (!stored) return;
    const {
      subtotal,
      delivery,
      total
    } = JSON.parse(stored);
    const subtotalEl = document.querySelector(".subtotalAmount");
    const deliveryEl = document.querySelectorAll(".deliveryFee")[0];
    const totalEl = document.querySelector(".totalAmount");
    if (subtotalEl) subtotalEl.textContent = subtotal + " ج.م";
    if (deliveryEl) deliveryEl.textContent = delivery + " ج.م";
    if (totalEl) totalEl.textContent = total + " ج.م";
  }

  function loadCheckoutSummary() {
    if (!window.location.pathname.includes("checkout")) return;

    const stored = localStorage.getItem("cartSummary");
    if (!stored) return;

    const {
      subtotal,
      delivery,
      total
    } = JSON.parse(stored);

    const subtotalEl = document.querySelector(".subtotalAmount");
    const deliveryEls = document.querySelectorAll(".deliveryFee");
    const totalEl = document.querySelector(".totalAmount");

    if (subtotalEl) subtotalEl.textContent = subtotal + " ج.م";
    if (deliveryEls.length >= 1) deliveryEls[0].textContent = delivery + " ج.م";
    if (totalEl) totalEl.textContent = total + " ج.م";
  }


  /* ========== INITIALIZE EVERYTHING ========== */
  initAddToCartByCard();
  updateCartUI();
  updateCartCounter();
  updateTotalPayAmount();
  loadCheckoutSummary();

  // Fallback for lazy DOM content
  setTimeout(() => {
    updateCartUI();
    updateCartCounter();
    updateTotalPayAmount();
  }, 300);

  // ✅ Make accessible globally for debugging
  // Make accessible globally for debugging
window.cart = cart;

// --- SMART CART ICON REDIRECT ---
const cartIcon = document.querySelector("#cartIcon");

function updateCartIconLink() {
  if (!cartIcon) return;

  if (cart.items.length === 0) {
    // Cart is empty
    const lastShopId = localStorage.getItem("currentShopId");

    if (lastShopId) {
      // Redirect to last visited shop
      cartIcon.setAttribute("href", `./shopPage.html?shopId=${lastShopId}`);
    } else {
      // No history → go to all shops
      cartIcon.setAttribute("href", "./allShops.html");
    }
  } else {
    // Cart has items → go to checkout
    cartIcon.setAttribute("href", "./checkout.html");
  }
}

// Run once on page load
updateCartIconLink();

// Optional: update link whenever cart changes
const originalSave = cart.save;
cart.save = function () {
  originalSave.call(cart);
  updateCartIconLink();
};





});
