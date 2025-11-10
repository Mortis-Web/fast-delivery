// ✅ Global Cart System — Runs on All Pages
document.addEventListener("DOMContentLoaded", () => {
  /* ========== CART CORE ========== */
  const cart = {
    items: JSON.parse(localStorage.getItem("cartItems")) || [],
    deliveryFee: 10, // EGP (you can change dynamically)
    serviceFee: 3.99, // EGP fixed or dynamic

    // ✅ Save cart state to localStorage + update UI
    save() {
      localStorage.setItem("cartItems", JSON.stringify(this.items));
      this.saveSummary();
      updateCartUI();
      updateCartCounter();
      updateTotalPayAmount();
    },

    // ✅ Save price summary (used in checkout)
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

    // ✅ Calculate subtotal
    getSubtotal() {
      return this.items.reduce((sum, item) => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, "")) || 0;
        return sum + price * item.amount;
      }, 0);
    },

    // ✅ Add new item or increase existing
    addItem(item) {
      const existing = this.items.find((i) => i.name === item.name);
      if (existing) existing.amount += 1;
      else this.items.push({ ...item, amount: 1 });
      this.save();
    },

    // ✅ Remove an item completely
    removeItem(name) {
      this.items = this.items.filter((i) => i.name !== name);
      this.save();
    },

    // ✅ Increase quantity
    increaseItem(name) {
      const existing = this.items.find((i) => i.name === name);
      if (existing) {
        existing.amount += 1;
        this.save();
      }
    },

    // ✅ Decrease quantity
    decreaseItem(name) {
      const existing = this.items.find((i) => i.name === name);
      if (!existing) return;
      existing.amount -= 1;
      if (existing.amount <= 0) this.removeItem(name);
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
    const cartHolder = document.querySelector("#cartHolder");
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
      cartHolder.style.position = "sticky"
      inCart.style.display = "none";
      cart.saveSummary();
      return;
    }

    empty.style.display = "none";
    cartHolder.style.position = "static"
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
        cart.increaseItem(item.name);
      article.querySelector(".decrease").onclick = () =>
        cart.decreaseItem(item.name);
      article.querySelector(".removeCartItem").onclick = () =>
        cart.removeItem(item.name);
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
  function initAddToCartButtons() {
    const buttons = document.querySelectorAll(".addToCartBtn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemEl = btn.closest(".foodItem");
        if (!itemEl) return;
        const name = itemEl.querySelector(".foodName")?.textContent.trim();
        const price = itemEl.querySelector(".foodNewPrice")?.textContent.trim();
        if (name && price) cart.addItem({ name, price });
      });
    });
  }

  /* ========== CHECKOUT PAGE LOADER ========== */
  function loadCheckoutSummary() {
    if (!window.location.pathname.includes("checkout")) return;
    const stored = localStorage.getItem("cartSummary");
    if (!stored) return;
    const { subtotal, delivery, service, total } = JSON.parse(stored);
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
  initAddToCartButtons();
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
