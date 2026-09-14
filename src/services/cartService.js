import api from "./api";

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }
}

// Get cart
export async function getCart() {
  const response = await api.get("/cart");

  return response.data;
}


// Add item to cart
export async function addToCart(
  productId,
  qty = 1
) {
  const response = await api.post(
    "/cart",
    {
      productId,
      qty,
    }
  );

  notifyCartUpdated();
  return response.data;
}


// Update cart item
export async function updateCartItem(
  itemId,
  qty
) {
  const response = await api.patch(
    `/cart/${itemId}`,
    {
      qty,
    }
  );

  notifyCartUpdated();
  return response.data;
}


// Remove cart item
export async function removeCartItem(itemId) {
  const response = await api.delete(
    `/cart/${itemId}`
  );

  notifyCartUpdated();
  return response.data;
}


// Checkout
export async function checkoutCart(itemsOrPayload, maybeDetails = {}) {
  let body;
  if (itemsOrPayload && !Array.isArray(itemsOrPayload) && (itemsOrPayload.items || itemsOrPayload.addressId)) {
    body = itemsOrPayload;
  } else if (Array.isArray(itemsOrPayload)) {
    if (maybeDetails && typeof maybeDetails === "object" && !Array.isArray(maybeDetails)) {
      body = { items: itemsOrPayload, ...maybeDetails };
    } else {
      body = { items: itemsOrPayload };
    }
  } else {
    body = { ...itemsOrPayload, ...(typeof maybeDetails === "object" ? maybeDetails : {}) };
  }

  const response = await api.post("/cart/checkout", body);
  notifyCartUpdated();
  return response.data;
}
