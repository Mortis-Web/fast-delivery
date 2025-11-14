export function renderCheckoutArticles(cart) {
  const checkoutCart = document.querySelector("#checkoutCart");
  if (!checkoutCart) return;

  checkoutCart.innerHTML = "";

  if (cart.items.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "سلة التسوق فارغة!";
    checkoutCart.appendChild(emptyMsg);
    return;
  }

  // Group items by shop
  const itemsByShop = {};
  cart.items.forEach(item => {
    if (!itemsByShop[item.shopId]) itemsByShop[item.shopId] = { shopName: item.shopName, items: [] };
    itemsByShop[item.shopId].items.push(item);
  });

  Object.keys(itemsByShop).forEach(shopId => {
    const shopGroup = itemsByShop[shopId];

    const article = document.createElement("article");
    article.classList.add("checkoutBox");

    const titleDiv = document.createElement("div");
    titleDiv.classList.add("checkoutBoxTitle");

    // ✅ Pass shopId and shopAreaId in the link
    const shopAreaId = shopGroup.items[0].shopAreaId || "";
    titleDiv.innerHTML = `
      <h2>${shopGroup.shopName}</h2>
      <a href="shopPage.html?shopId=${shopId}&shopAreaId=${shopAreaId}">تعديل الطلب</a>
    `;
    article.appendChild(titleDiv);

    const orderInfo = document.createElement("div");
    orderInfo.classList.add("orderInfo");

    const labels = document.createElement("div");
    labels.classList.add("orderLabels");
    labels.innerHTML = `
      <span class="orderName">الصنف</span>
      <span class="specialOrder">طلب خاص </span>
      <span>الكمية</span>
      <span>السعر</span>
      <span>المجموع</span>
    `;
    orderInfo.appendChild(labels);

    shopGroup.items.forEach(item => {
      const totalPrice = (item.price * item.amount).toFixed(2);
      const row = document.createElement("div");
      row.classList.add("orderStats");
      row.innerHTML = `
        <span class="orderName">${item.name} <span class="specialOrder">حار</span></span>
        <span class="specialOrder">طلب خاص</span>
        <div class="cartItemAmountHandlers">
          <button class="decrease">-</button>
          <span class="itemAmount">${item.amount}</span>
          <button class="increase">+</button>
        </div>
        <span class="itemPrice">${item.price.toFixed(2)} ج.م</span>
        <span class="itemTotal">${totalPrice} ج.م</span>
        <button class="removeItem"><i class="fas fa-trash-alt"></i></button>
      `;
      orderInfo.appendChild(row);

      // Interactivity
      row.querySelector(".increase").onclick = () => {
        cart.increaseItem(item.id, item.shopId);
        renderCheckoutArticles(cart);
      };
      row.querySelector(".decrease").onclick = () => {
        cart.decreaseItem(item.id, item.shopId);
        renderCheckoutArticles(cart);
      };
      row.querySelector(".removeItem").onclick = () => {
        cart.removeItem(item.id, item.shopId);
        renderCheckoutArticles(cart);
      };
    });

    article.appendChild(orderInfo);
    checkoutCart.appendChild(article);
  });

  // ✅ Add TOTAL AMOUNT article
  const summary = JSON.parse(localStorage.getItem("cartSummary")) || {
    subtotal: 0,
    delivery: cart.deliveryFee,
    total: 0
  };

  const totalArticle = document.createElement("article");
  totalArticle.classList.add("checkoutBox", "totalAmountBox");
  totalArticle.innerHTML = `
    <div class="checkoutBoxTitle">
      <h2>المجموع الكلي</h2>
    </div>
    <div class="orderInfo">
      <div class="orderStats">
        <span>المجموع الفرعي:</span>
        <span>${Number(summary.subtotal).toLocaleString()} ج.م</span>
      </div>
      <div class="orderStats">
        <span>رسوم التوصيل:</span>
        <span>${Number(summary.delivery).toFixed(2)} ج.م</span>
      </div>
      <div class="orderStats" style="font-weight: bold;">
        <span>المجموع النهائي:</span>
        <span>${Number(summary.total).toLocaleString()} ج.م</span>
      </div>
    </div>
  `;
  checkoutCart.appendChild(totalArticle);

  cart.saveSummary();
}
