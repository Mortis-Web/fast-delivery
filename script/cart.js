// ======= CART SYSTEM =======
const cart = {
  items: JSON.parse(localStorage.getItem("cartItems")) || [],
  deliveryFee: 0, // change dynamically if you read from shop
  save() {
    localStorage.setItem("cartItems", JSON.stringify(this.items));
    updateCartUI();
    updateCartCounter(); // update the counter whenever cart changes
  },
  addItem(item) {
    const existing = this.items.find((i) => i.name === item.name);
    if (existing) {
      existing.amount += 1;
    } else {
      this.items.push({ ...item, amount: 1 });
    }
    this.save();
  },
  removeItem(name) {
    this.items = this.items.filter((i) => i.name !== name);
    this.save();
  },
  increaseItem(name) {
    const existing = this.items.find((i) => i.name === name);
    if (existing) {
      existing.amount += 1;
      this.save();
    }
  },
  decreaseItem(name) {
    const existing = this.items.find((i) => i.name === name);
    if (existing) {
      existing.amount -= 1;
      if (existing.amount <= 0) this.removeItem(name);
      else this.save();
    }
  },
};

// ======= CART ICON COUNTER =======
function updateCartCounter() {
  const cartItemsNumber = document.querySelector("#cartItemsNumber");
  if (!cartItemsNumber) return;
  const totalItems = cart.items.reduce((sum, item) => sum + item.amount, 0);
  cartItemsNumber.textContent = totalItems;
}

// ======= UPDATE CART UI =======
function updateCartUI() {
  const inCartItems = document.querySelector("#inCartItems");
  const emptyCart = document.querySelector("#emptyCart");
  const subtotalEl = document.querySelector(".subtotalAmount");
  const totalEl = document.querySelector(".totalAmount");
  const deliveryEl = document.querySelector(".deliveryFee");

  // Remove old wrapper if exists
  const oldWrapper = inCartItems.querySelector(".orderedItemsWrapper");
  if (oldWrapper) oldWrapper.remove();

  if (cart.items.length === 0) {
    emptyCart.style.display = "flex";
    inCartItems.style.display = "none";
    return;
  } else {
    emptyCart.style.display = "none";
    inCartItems.style.display = "flex";
  }

  // Create wrapper div for ordered items
  const wrapper = document.createElement("div");
  wrapper.classList.add("orderedItemsWrapper");
  inCartItems.insertBefore(
    wrapper,
    inCartItems.querySelector(".preDeliveryFeeAmount")
  );

  // Add items to wrapper
  let subtotal = 0;
  cart.items.forEach((item) => {
    const totalPrice =
      parseFloat(item.price.replace(/[^\d.]/g, "")) * item.amount;
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
      <span class="removeCartItem">-</span>
    `;
    wrapper.appendChild(article);

    // Handlers
    article.querySelector(".increase").addEventListener("click", () => {
      cart.increaseItem(item.name);
    });
    article.querySelector(".decrease").addEventListener("click", () => {
      cart.decreaseItem(item.name);
    });
    article.querySelector(".removeCartItem").addEventListener("click", () => {
      cart.removeItem(item.name);
    });
  });

  subtotalEl.textContent = subtotal.toLocaleString() + " ج.م";
  deliveryEl.textContent = cart.deliveryFee.toLocaleString() + " ج.م";
  totalEl.textContent = (subtotal + cart.deliveryFee).toLocaleString() + " ج.م";

  // Update the counter
  updateCartCounter();
}

// ======= ADD TO CART BUTTONS =======
const addToCartBtns = document.querySelectorAll(".addToCartBtn");

addToCartBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const foodItem = btn.closest(".foodItem");
    const name = foodItem.querySelector(".foodName").textContent.trim();
    const price = foodItem.querySelector(".foodNewPrice").textContent.trim();
    cart.addItem({ name, price });
  });
});

// ======= INIT =======
updateCartUI();
