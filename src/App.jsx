import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// =========================
// Common Pages
// =========================
import Home from "./pages/common/home";
import NotFound from "./pages/common/NotFound";

// =========================
// Customer Pages
// =========================
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import CustomerHome from "./pages/customer/CustomerHome";
import Wishlist from "./pages/customer/Wishlist";
import Cart from "./pages/customer/Cart";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerDetails from "./pages/customer/CustomerDetails";
import ProductDetails from "./pages/customer/ProductDetails";
import TrackOrder from "./pages/customer/TrackOrder";
import CompareProducts from "./pages/customer/CompareProducts";
import RepeatDelivery from "./pages/customer/RepeatDelivery";
import VirtualAvatar from "./pages/customer/VirtualAvatar";
import PriceHistoryPage from "./pages/customer/PriceHistoryPage";
import SharedCartPage from "./pages/customer/SharedCartPage";
import WarrantyVault from "./pages/customer/WarrantyVault";
import RewardsWallet from "./pages/customer/RewardsWallet";
import RecommendedProducts from "./pages/customer/RecommendedProducts";

// =========================
// Customer Checkout Pages
// =========================
import Checkout from "./pages/customer/checkout/Checkout";
import CheckoutAddress from "./pages/customer/checkout/CheckoutAddress";
import CheckoutDelivery from "./pages/customer/checkout/CheckoutDelivery";
import CheckoutPayment from "./pages/customer/checkout/CheckoutPayment";
import CheckoutReview from "./pages/customer/checkout/CheckoutReview";
import OrderSuccess from "./pages/customer/checkout/OrderSuccess";

// =========================
// Vendor Pages
// =========================
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorRegister from "./pages/vendor/VendorRegister";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorProductDetails from "./pages/vendor/VendorProductDetails";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorReturns from "./pages/vendor/VendorReturns";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorPayments from "./pages/vendor/VendorPayments";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorTickets from "./pages/vendor/VendorTickets";
import VendorWarrantyClaims from "./pages/vendor/VendorWarrantyClaims";

// =========================
// Layouts
// =========================
import CustomerLayout from "./layouts/CustomerLayout";
import VendorLayout from "./layouts/VendorLayout";

// =========================
// Route Protection
// =========================
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainer from "./components/Toast";
import GestureNavigation from "./components/GestureNavigation";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <GestureNavigation />
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ====================================================== */}

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* =========================
            CUSTOMER AUTH
        ========================== */}

        {/* Standard Login Alias */}
        <Route
          path="/login"
          element={<Navigate to="/customer/login" replace />}
        />

        <Route
          path="/customer/login"
          element={<CustomerLogin />}
        />

        <Route
          path="/customer/register"
          element={<CustomerRegister />}
        />

        {/* =========================
            VENDOR AUTH
        ========================== */}

        <Route
          path="/vendor/login"
          element={<VendorLogin />}
        />

        <Route
          path="/vendor/register"
          element={<VendorRegister />}
        />


        {/* =====================================================
            CUSTOMER PROTECTED ROUTES
        ====================================================== */}

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedType="customer" />
          }
        >
          <Route element={<CustomerLayout />}>

            {/* Customer Home */}
            <Route
              index
              element={<CustomerHome />}
            />

            {/* Product Details */}
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="product/:id" element={<ProductDetails />} />

            {/* Wishlist */}
            <Route
              path="wishlist"
              element={<Wishlist />}
            />

            {/* Cart */}
            <Route
              path="cart"
              element={<Cart />}
            />

            {/* Orders */}
            <Route
              path="orders"
              element={<CustomerOrders />}
            />

            <Route path="orders/:orderId/track" element={<TrackOrder />} />

            {/* Compare Products */}
            <Route
              path="compare"
              element={<CompareProducts />}
            />

            {/* Settings */}
            <Route path="settings" element={<CustomerDetails />} />
            <Route path="details" element={<Navigate to="/customer/settings" replace />} />

            {/* 7 Extended Features */}
            <Route path="repeat-delivery" element={<RepeatDelivery />} />
            <Route path="avatar" element={<VirtualAvatar />} />
            <Route path="price-history/:id" element={<PriceHistoryPage />} />
            <Route path="price-history" element={<PriceHistoryPage />} />
            <Route path="shared-cart" element={<SharedCartPage />} />
            <Route path="shared-cart/:cartId" element={<SharedCartPage />} />
            <Route path="warranties" element={<WarrantyVault />} />
            <Route path="warranty-vault" element={<Navigate to="/customer/warranties" replace />} />
            <Route path="rewards" element={<RewardsWallet />} />
            <Route path="recommended" element={<RecommendedProducts />} />
            <Route path="recommendations" element={<Navigate to="/customer/recommended" replace />} />


            {/* =================================================
                CHECKOUT
            ================================================== */}

            <Route
              path="checkout"
              element={<Checkout />}
            >

              {/* /customer/checkout
                  automatically redirects to address
              */}
              <Route
                index
                element={
                  <Navigate
                    to="address"
                    replace
                  />
                }
              />

              {/* Step 1 - Address */}
              <Route
                path="address"
                element={<CheckoutAddress />}
              />

              {/* Step 2 - Delivery */}
              <Route
                path="delivery"
                element={<CheckoutDelivery />}
              />

              {/* Step 3 - Payment */}
              <Route
                path="payment"
                element={<CheckoutPayment />}
              />

              {/* Step 4 - Review */}
              <Route
                path="review"
                element={<CheckoutReview />}
              />

              {/* Order Success */}
              <Route
                path="success"
                element={<OrderSuccess />}
              />

            </Route>

          </Route>
        </Route>


        {/* =====================================================
            VENDOR PROTECTED ROUTES
        ====================================================== */}

        <Route
          path="/vendor"
          element={
            <ProtectedRoute allowedType="vendor" />
          }
        >
          <Route element={<VendorLayout />}>

            {/* Vendor Dashboard */}
            <Route
              index
              element={<VendorDashboard />}
            />

            {/* Vendor Products */}
            <Route
              path="products"
              element={<VendorProducts />}
            />
            <Route
              path="products/:id"
              element={<VendorProductDetails />}
            />
            <Route
              path="product/:id"
              element={<VendorProductDetails />}
            />

            {/* Vendor Orders */}
            <Route
              path="orders"
              element={<VendorOrders />}
            />

            {/* Vendor Returns & Refunds */}
            <Route
              path="returns"
              element={<VendorReturns />}
            />

            {/* Vendor Warranty & RMA Claims */}
            <Route
              path="warranty-claims"
              element={<VendorWarrantyClaims />}
            />
            <Route
              path="claims"
              element={<Navigate to="/vendor/warranty-claims" replace />}
            />

            {/* Vendor Analytics */}
            <Route
              path="analytics"
              element={<VendorAnalytics />}
            />

            {/* Vendor Payments & Transactions */}
            <Route
              path="payments"
              element={<VendorPayments />}
            />
            <Route
              path="transactions"
              element={<Navigate to="/vendor/payments" replace />}
            />

            {/* Vendor Settings */}
            <Route
              path="settings"
              element={<VendorSettings />}
            />

            {/* Vendor Support & Helpdesk Tickets */}
            <Route
              path="tickets"
              element={<VendorTickets />}
            />

          </Route>
        </Route>


        {/* =====================================================
            404
        ====================================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
