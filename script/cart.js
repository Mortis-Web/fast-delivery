// ✅ Global Cart System — Runs on All Pages

document.addEventListener("DOMContentLoaded", () => {
  let isSwalOpen = false;
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
    deliveryFee: 10,
    serviceFee: 3.99,

    save() {
      localStorage.setItem("cartItems", JSON.stringify(this.items));
      this.saveSummary();
      updateCartUI();
      updateCartCounter();
      updateTotalPayAmount();
    },

    saveSummary() {
      const subtotal = this.getSubtotal();
      const summary = {
        subtotal: subtotal.toFixed(2),
        delivery: this.deliveryFee.toFixed(2),
        service: this.serviceFee.toFixed(2),
        total: (subtotal + this.deliveryFee + this.serviceFee).toFixed(2),
      };
      localStorage.setItem("cartSummary", JSON.stringify(summary));
    },

    getSubtotal() {
      return this.items.reduce((sum, item) => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, "")) || 0;
        return sum + price * item.amount;
      }, 0);
    },



    addItem(item) {
      if (isSwalOpen) return;
      const currentShopId = localStorage.getItem("currentShopId");
      const cartShopId = localStorage.getItem("cartShopId");

      // ⚠️ If cart belongs to a different shop, confirm before replacing
      if (cartShopId && cartShopId !== currentShopId) {
          isSwalOpen = true;
        Swal.fire({
          title: "لا يمكنك الطلب من أكثر من متجر في نفس الوقت",
          text: "هل تريد تفريغ السلة وإضافة هذا المنتج؟",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "نعم، تفريغ السلة",
          cancelButtonText: "إلغاء",
          reverseButtons: true,
        }).then((result) => {
            isSwalOpen = false;
          if (result.isConfirmed) {
            // Empty cart, set new shop ID, add product
            this.items = [];
            localStorage.setItem("cartShopId", currentShopId);
            this.items.push({
              ...item,
              amount: 1
            });
            this.save();
            showCartToast("تم تفريغ السلة وإضافة المنتج الجديد!");
          } else {
            // Do nothing
            return;
          }
        });
        return;
      }

      // ✅ If first time or same shop, proceed normally
      if (!cartShopId) localStorage.setItem("cartShopId", currentShopId);

      const existing = this.items.find((i) => i.id === item.id);
      if (existing) existing.amount += 1;
      else this.items.push({
        ...item,
        amount: 1
      });
      this.save();
    },


    removeItem(id) {
      this.items = this.items.filter((i) => i.id !== id); // use id
      this.save();
    },

    increaseItem(id) {
      const existing = this.items.find((i) => i.id === id);
      if (existing) {
        existing.amount += 1;
        this.save();
      }
    },

    decreaseItem(id) {
      const existing = this.items.find((i) => i.id === id);
      if (!existing) return;
      existing.amount -= 1;
      if (existing.amount <= 0) this.removeItem(id);
      else this.save();
    },
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
    const subtotal = cart.getSubtotal();
    el.textContent =
      "المجموع: EGP " +
      (subtotal + cart.deliveryFee + cart.serviceFee).toFixed(2);
  }

  /* ========== MAIN CART UI (Popup Cart) ========== */
  function updateCartUI() {
    const inCart = document.querySelector("#inCartItems");
    const empty = document.querySelector("#emptyCart");
    const subtotalEl = document.querySelector(".subtotalAmount");
    const deliveryEl = document.querySelectorAll(".deliveryFee")[0];
    const serviceEl = document.querySelectorAll(".deliveryFee")[1];
    const totalEl = document.querySelector(".totalAmount");

    // If no UI (like checkout), just save summary
    if (!inCart || !empty) {
      cart.saveSummary();
      return;
    }

    // Remove old wrapper
    const oldWrapper = inCart.querySelector(".orderedItemsWrapper");
    if (oldWrapper) oldWrapper.remove();

    if (cart.items.length === 0) {
      empty.style.display = "flex";
      inCart.style.display = "none";
      cart.saveSummary();
      return;
    }

    empty.style.display = "none";
    inCart.style.display = "flex";

    const wrapper = document.createElement("div");
    wrapper.classList.add("orderedItemsWrapper");
    inCart.insertBefore(
      wrapper,
      inCart.querySelector(".preDeliveryFeeAmount")
    );

    let subtotal = 0;
    cart.items.forEach((item) => {
      const priceNum = parseFloat(item.price.replace(/[^\d.]/g, "")) || 0;
      const totalPrice = priceNum * item.amount;
      subtotal += totalPrice;

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

      // ✅ Handlers
      article.querySelector(".increase").onclick = () =>
        cart.increaseItem(item.id);
      article.querySelector(".decrease").onclick = () =>
        cart.decreaseItem(item.id);
      article.querySelector(".removeCartItem").onclick = () =>
        cart.removeItem(item.id);
    });

    if (subtotalEl)
      subtotalEl.textContent = subtotal.toLocaleString() + " ج.م";
    if (deliveryEl)
      deliveryEl.textContent = cart.deliveryFee.toLocaleString() + " ج.م";
    if (serviceEl)
      serviceEl.textContent = cart.serviceFee.toLocaleString() + " ج.م";
    if (totalEl)
      totalEl.textContent = (
        subtotal +
        cart.deliveryFee +
        cart.serviceFee
      ).toLocaleString() + " ج.م";

    // Sync summary for checkout
    cart.saveSummary();
    updateCartCounter();
    updateTotalPayAmount();
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
            id,
            name,
            price
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
      service,
      total
    } = JSON.parse(stored);
    const subtotalEl = document.querySelector(".subtotalAmount");
    const deliveryEl = document.querySelectorAll(".deliveryFee")[0];
    const serviceEl = document.querySelectorAll(".deliveryFee")[1];
    const totalEl = document.querySelector(".totalAmount");
    if (subtotalEl) subtotalEl.textContent = subtotal + " ج.م";
    if (deliveryEl) deliveryEl.textContent = delivery + " ج.م";
    if (serviceEl) serviceEl.textContent = service + " ج.م";
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
  window.cart = cart;
});
