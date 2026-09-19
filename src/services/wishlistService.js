import api from "./api";


// Get wishlist
export async function getWishlist() {
  const response = await api.get(
    "/wishlist"
  );

  return response.data;
}


// Add product
export async function addToWishlist(productId, collectionId) {
  const response = await api.post(
    "/wishlist",
    { productId, collectionId }
  );

  return response.data;
}


// Remove wishlist item
export async function removeFromWishlist(
  itemId
) {
  const response = await api.delete(
    `/wishlist/${itemId}`
  );

  return response.data;
}

export async function getWishlistCollections() {
  const response = await api.get("/wishlist/collections");
  return response.data;
}

export async function createWishlistCollection(name) {
  const response = await api.post("/wishlist/collections", { name });
  return response.data;
}

export async function updateWishlistCollection(id, name) {
  const response = await api.put(`/wishlist/collections/${id}`, { name });
  return response.data;
}

export async function deleteWishlistCollection(id) {
  const response = await api.delete(`/wishlist/collections/${id}`);
  return response.data;
}

export async function updateWishlistAlerts(id, alertSettings) {
  const response = await api.patch(`/wishlist/${id}/alerts`, alertSettings);
  return response.data;
}