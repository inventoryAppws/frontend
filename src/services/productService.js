import api from "./api";

// =============================
// PUBLIC PRODUCTS & SEARCH
// =============================

export async function getPublicProducts(
  page = 1,
  limit = 20,
  search = "",
  category = "",
  vendor = "",
  scope = "all",
  sortBy = "newest",
  inStock = false,
  extraParams = {}
) {
  // Support either positional arguments or options object
  let options = {};
  if (typeof page === "object" && page !== null) {
    options = page;
  } else {
    options = {
      page,
      limit,
      search,
      category,
      vendor,
      scope,
      sortBy,
      inStock,
      ...extraParams
    };
  }

  const response = await api.get("/products/public", {
    params: {
      page: options.page || 1,
      limit: options.limit || 20,
      q: options.search || undefined,
      category: options.category && options.category !== "All" ? options.category : undefined,
      vendors:
        Array.isArray(options.vendors) && options.vendors.length > 0
          ? options.vendors.join(",")
          : typeof options.vendors === "string" && options.vendors !== ""
          ? options.vendors
          : undefined,
      vendor: options.vendor && options.vendor !== "All" ? options.vendor : undefined,
      scope: options.scope && options.scope !== "all" ? options.scope : undefined,
      sortBy: options.sortBy || undefined,
      inStock: options.inStock ? "true" : undefined,
      minPrice: options.minPrice !== undefined && options.minPrice !== "" ? options.minPrice : undefined,
      maxPrice: options.maxPrice !== undefined && options.maxPrice !== "" ? options.maxPrice : undefined,
      availability: options.availability && options.availability !== "all" ? options.availability : undefined,
      minRating: options.minRating !== undefined && options.minRating !== "" ? options.minRating : undefined
    },
  });

  return response.data;
}

export async function getProductById(productId) {
  const response = await api.get(`/products/public/${productId}`);
  return response.data;
}

export async function getProductReviews(productId) {
  const response = await api.get(`/products/${productId}/reviews`);
  return response.data;
}

export async function addProductReview(productId, reviewData) {
  const response = await api.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
}

export async function updateProductReview(productId, reviewId, reviewData) {
  const response = await api.put(`/products/${productId}/reviews/${reviewId}`, reviewData);
  return response.data;
}

export async function deleteProductReview(productId, reviewId) {
  const response = await api.delete(`/products/${productId}/reviews/${reviewId}`);
  return response.data;
}

export async function getProductSearchMeta(q = "") {
  const response = await api.get("/products/search-meta", {
    params: {
      q: q ? q.trim() : undefined,
    },
  });

  return response.data;
}

export async function getPublicBanners() {
  const response = await api.get("/products/public-banners");
  return response.data;
}

export async function getPublicPromotions() {
  const response = await api.get("/products/public-promotions");
  return response.data;
}

export async function getPublicCoupons() {
  const response = await api.get("/products/public-coupons");
  return response.data;
}

// =============================
// VENDOR PRODUCTS
// =============================

export async function getVendorProducts(
  page = 1,
  limit = 20,
  search = "",
  category = "",
  stockStatus = "",
  sortBy = "newest"
) {
  let options = {};
  if (typeof page === "object" && page !== null) {
    options = page;
  } else {
    options = { page, limit, search, category, stockStatus, sortBy };
  }

  const response = await api.get("/products", {
    params: {
      page: options.page || 1,
      limit: options.limit || 20,
      q: options.search || undefined,
      category: options.category && options.category !== "All" ? options.category : undefined,
      stockStatus: options.stockStatus || undefined,
      sortBy: options.sortBy || undefined
    },
  });

  return response.data;
}

export async function createProduct(data) {
  const response = await api.post("/products", data);
  return response.data;
}

export async function deleteProduct(productId) {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
}

export async function updateProduct(productId, data) {
  const response = await api.patch(`/products/${productId}`, data);
  return response.data;
}

export async function adjustProductStock(productId, data) {
  const response = await api.patch(`/products/${productId}/stock`, data);
  return response.data;
}

export async function getProductHistory(productId) {
  const response = await api.get(`/products/${productId}/history`);
  return response.data;
}
