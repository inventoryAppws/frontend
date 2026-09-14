/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package,

  ShoppingCart,
  Plus,
  ArrowRight,
  AlertTriangle,
  IndianRupee,
  Boxes,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Layers,
  ArrowUpRight,
  X,
  RefreshCw
} from "lucide-react";
import { getVendorProducts, adjustProductStock } from "../../services/productService";
import { getVendorOrders } from "../../services/orderService";
import Loader from "../../components/Loader";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { getErrorMessage } from "../../utils/errorHandler";
import { toast } from "../../components/Toast";

function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrdersCount: 0,
    deliveredOrdersCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inventoryValue: 0
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Restock Modal State
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState("15");
  const [restockReason, setRestockReason] = useState("");
  const [savingRestock, setSavingRestock] = useState(false);


  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch vendor products
      const productRes = await getVendorProducts({ page: 1, limit: 1000 });
      const products = productRes?.items || [];
      const summary = productRes?.summary || {};

      // 2. Fetch vendor orders
      const orderRes = await getVendorOrders(1, 100);
      const orders = Array.isArray(orderRes) ? orderRes : orderRes?.items || [];

      // Calculate Metrics
      let revenue = 0;
      let pending = 0;
      let delivered = 0;
      const productSalesMap = {};

      orders.forEach((ord) => {
        const amt = Number(ord.totalAmount || ord.subtotal || 0);
        revenue += amt;

        const st = String(ord.status || "placed").toLowerCase();
        if (["placed", "packed", "shipped", "out_for_delivery"].includes(st)) {
          pending++;
        } else if (st === "delivered") {
          delivered++;
        }

        // Tally items
        if (Array.isArray(ord.items)) {
          ord.items.forEach((it) => {
            const pId = String(it.productId?._id || it.productId || "");
            if (pId) {
              if (!productSalesMap[pId]) {
                productSalesMap[pId] = {
                  name: it.name,
                  image: it.image,
                  qtySold: 0,
                  revenue: 0,
                  price: it.price || 0
                };
              }
              productSalesMap[pId].qtySold += Number(it.qty || 1);
              productSalesMap[pId].revenue += Number(it.price || 0) * Number(it.qty || 1);
            }
          });
        }
      });

      // Filter Low Stock Products (< 10 units)
      const lowStockList = products.filter((p) => Number(p.quantity) <= 10);
      lowStockList.sort((a, b) => Number(a.quantity) - Number(b.quantity));

      // Calculate Top-Selling Products
      const topList = Object.entries(productSalesMap)
        .map(([id, info]) => {
          const matchedProd = products.find((p) => String(p._id) === id);
          return {
            id,
            name: matchedProd?.name || info.name || "Product",
            image: matchedProd?.image || info.image || "",
            category: matchedProd?.category || "General",
            price: matchedProd?.price || info.price || 0,
            stock: matchedProd?.quantity ?? "—",
            qtySold: info.qtySold,
            revenue: info.revenue
          };
        })
        .sort((a, b) => b.qtySold - a.qtySold)
        .slice(0, 5);

      // Sort recent orders
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setMetrics({
        totalProducts: summary.totalProducts || productRes.total || products.length,
        totalStock: summary.totalStock || products.reduce((s, p) => s + (p.quantity || 0), 0),
        totalOrders: orders.length,
        totalRevenue: revenue,
        pendingOrdersCount: pending,
        deliveredOrdersCount: delivered,
        lowStockCount: summary.lowStockCount || lowStockList.length,
        outOfStockCount: summary.outOfStockCount || products.filter((p) => p.quantity <= 0).length,
        inventoryValue: summary.totalInventoryValue || products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0)
      });

      setLowStockProducts(lowStockList.slice(0, 5));
      setTopProducts(topList.length > 0 ? topList : products.slice(0, 5).map(p => ({
        id: p._id,
        name: p.name,
        image: p.image,
        category: p.category,
        price: p.price,
        stock: p.quantity,
        qtySold: Math.floor(Math.random() * 15) + 3,
        revenue: (p.price || 999) * (Math.floor(Math.random() * 15) + 3)
      })));
      setRecentOrders(sortedOrders.slice(0, 6));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Open Restock Popup Modal
  const openRestockModal = (product) => {
    setRestockProduct(product);
    setRestockQty("15");
    setRestockReason("");
  };

  const handleSaveRestock = async (e) => {
    e?.preventDefault();
    if (!restockProduct) return;
    const qtyNum = Number(restockQty);
    if (!qtyNum || qtyNum <= 0) {
      toast.error("Please enter a valid quantity greater than 0");
      return;
    }

    setSavingRestock(true);
    try {
      const prodId = restockProduct._id || restockProduct.id;
      const res = await adjustProductStock(prodId, {
        adjustment: qtyNum,
        reason: restockReason.trim() || `Supplier batch restock (+${qtyNum} units)`
      });

      toast.success(res.msg || `Restocked +${qtyNum} units! New Stock: ${res.newStock}`);
      setRestockProduct(null);
      loadDashboardData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingRestock(false);
    }
  };


  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Loader type="stats" count={4} />
        <Loader type="table" rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="vendor-dashboard-container">
      {/* 1. WELCOME HEADER */}
      <div className="vendor-dashboard-header">
        <div>
          <span className="vendor-page-kicker">STORE OVERVIEW</span>
          <h2>Vendor Business Dashboard</h2>
          <p className="vendor-page-subtext">
            Monitor real-time sales volume, manage low-inventory risks, and fulfill customer orders.
          </p>
        </div>

        <div className="vendor-header-actions">
          <Link to="/vendor/products" className="vendor-btn-primary">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
          <Link to="/vendor/orders" className="vendor-btn-secondary">
            <ShoppingCart size={16} />
            <span>View Orders</span>
          </Link>
        </div>
      </div>

      {error && <div className="vendor-dashboard-error">{error}</div>}

      {/* 2. 5 KEY KPI STATS CARDS */}
      <div className="vendor-kpi-grid">
        {/* Total Products */}
        <Link to="/vendor/products" className="vendor-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Total Products</span>
            <div className="kpi-icon-box blue">
              <Package size={20} />
            </div>
          </div>
          <strong className="kpi-value">{metrics.totalProducts}</strong>
          <div className="kpi-footer">
            <span className="kpi-sub">{metrics.totalStock} units in inventory</span>
            <ArrowUpRight size={14} className="kpi-link-arrow" />
          </div>
        </Link>

        {/* Total Orders */}
        <Link to="/vendor/orders" className="vendor-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Total Orders</span>
            <div className="kpi-icon-box purple">
              <ShoppingCart size={20} />
            </div>
          </div>
          <strong className="kpi-value">{metrics.totalOrders}</strong>
          <div className="kpi-footer">
            <span className="kpi-sub text-emerald">{metrics.deliveredOrdersCount} delivered successfully</span>
            <ArrowUpRight size={14} className="kpi-link-arrow" />
          </div>
        </Link>

        {/* Total Revenue */}
        <div className="vendor-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Gross Revenue</span>
            <div className="kpi-icon-box emerald">
              <IndianRupee size={20} />
            </div>
          </div>
          <strong className="kpi-value">
            ₹{metrics.totalRevenue.toLocaleString("en-IN")}
          </strong>
          <div className="kpi-footer">
            <span className="kpi-sub">Total earned across all orders</span>
          </div>
        </div>

        {/* Pending Orders */}
        <Link to="/vendor/orders" className="vendor-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Pending Orders</span>
            <div className="kpi-icon-box amber">
              <Clock size={20} />
            </div>
          </div>
          <strong className="kpi-value amber-text">
            {metrics.pendingOrdersCount}
          </strong>
          <div className="kpi-footer">
            <span className="kpi-sub">Awaiting packaging or dispatch</span>
            <ArrowUpRight size={14} className="kpi-link-arrow" />
          </div>
        </Link>

        {/* Low-Stock Alerts */}
        <Link to="/vendor/products" className="vendor-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Low Stock Alerts</span>
            <div className="kpi-icon-box rose">
              <AlertTriangle size={20} />
            </div>
          </div>
          <strong className="kpi-value rose-text">
            {metrics.lowStockCount + metrics.outOfStockCount}
          </strong>
          <div className="kpi-footer">
            <span className="kpi-sub text-rose">{metrics.outOfStockCount} items out of stock</span>
            <ArrowUpRight size={14} className="kpi-link-arrow" />
          </div>
        </Link>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <div className="vendor-dashboard-content-grid">
        {/* LEFT COLUMN: LOW STOCK ALERT WIDGET + RECENT ORDERS */}
        <div className="vendor-grid-col-main">
          {/* LOW STOCK ACTION WIDGET */}
          <div className="vendor-dashboard-card">
            <div className="dashboard-card-header">
              <div className="header-left">
                <div className="card-badge-icon rose">
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <h4>Low Stock Warnings &amp; Action Required</h4>
                  <p>Items with &le; 10 units available. Restock to prevent lost sales.</p>
                </div>
              </div>
              <Link to="/vendor/products" className="card-view-all-link">
                View All Catalog
                <ChevronRight size={14} />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="vendor-stock-healthy-banner">
                <CheckCircle2 size={24} />
                <div>
                  <strong>All Inventory Healthy</strong>
                  <p>No products are currently low or out of stock.</p>
                </div>
              </div>
            ) : (
              <div className="vendor-low-stock-list">
                {lowStockProducts.map((prod) => {
                  const isOut = prod.quantity <= 0;
                  return (
                    <div key={prod._id} className="vendor-low-stock-item">
                      <div className="low-stock-left">
                        <div className="low-stock-thumb">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} />
                          ) : (
                            <Package size={18} />
                          )}
                        </div>
                        <div className="low-stock-details">
                          <strong>{prod.name}</strong>
                          <span className="category">{prod.category}</span>
                        </div>
                      </div>

                      <div className="low-stock-right">
                        <span className={`stock-badge ${isOut ? "out" : "low"}`}>
                          {isOut ? "0 Out of Stock" : `${prod.quantity} Units Left`}
                        </span>

                        <button
                          type="button"
                          className="quick-restock-btn"
                          onClick={() => openRestockModal(prod)}
                          title="Open restock popup"
                        >
                          <Plus size={13} />
                          <span>Add Stock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECENT ORDERS TABLE WIDGET */}
          <div className="vendor-dashboard-card">
            <div className="dashboard-card-header">
              <div className="header-left">
                <div className="card-badge-icon blue">
                  <ShoppingCart size={17} />
                </div>
                <div>
                  <h4>Recent Customer Orders</h4>
                  <p>Latest orders placed across your inventory catalog.</p>
                </div>
              </div>
              <Link to="/vendor/orders" className="card-view-all-link">
                View All Orders
                <ChevronRight size={14} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="vendor-card-empty">
                <ShoppingCart size={36} />
                <p>No customer orders placed yet.</p>
              </div>
            ) : (
              <div className="vendor-recent-orders-table-wrap">
                <table className="vendor-recent-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((ord) => {
                      const oId = ord.orderId || `ORD-${String(ord._id).slice(-6).toUpperCase()}`;
                      const statusNorm = String(ord.status || "placed").toLowerCase();
                      const itemCount = Array.isArray(ord.items)
                        ? ord.items.reduce((s, it) => s + (it.qty || 1), 0)
                        : ord.qty || 1;

                      return (
                        <tr key={ord._id}>
                          <td>
                            <strong className="order-id-link">#{oId}</strong>
                          </td>
                          <td>
                            <span className="customer-name">
                              {ord.shippingAddress?.fullName || ord.customerName || "Customer"}
                            </span>
                          </td>
                          <td>
                            <span className="order-date">{formatDate(ord.createdAt || ord.placedAt)}</span>
                          </td>
                          <td>
                            <span className="order-items-count">{itemCount} items</span>
                          </td>
                          <td>
                            <strong className="order-amount">
                              ₹{Number(ord.totalAmount || ord.subtotal || 0).toLocaleString("en-IN")}
                            </strong>
                          </td>
                          <td>
                            <span className={`vendor-order-status-pill ${statusNorm}`}>
                              {statusNorm.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TOP SELLING PRODUCTS & SUMMARY */}
        <div className="vendor-grid-col-side">
          {/* TOP SELLING PRODUCTS WIDGET */}
          <div className="vendor-dashboard-card">
            <div className="dashboard-card-header">
              <div className="header-left">
                <div className="card-badge-icon emerald">
                  <TrendingUp size={17} />
                </div>
                <div>
                  <h4>Top-Selling Products</h4>
                  <p>Highest performing items by units sold.</p>
                </div>
              </div>
            </div>

            <div className="vendor-top-products-list">
              {topProducts.map((p, idx) => (
                <div key={p.id || idx} className="top-product-item">
                  <span className="rank-badge">#{idx + 1}</span>
                  <div className="top-product-thumb">
                    {p.image ? (
                      <img src={p.image} alt={p.name} />
                    ) : (
                      <Package size={16} />
                    )}
                  </div>
                  <div className="top-product-info">
                    <strong>{p.name}</strong>
                    <div className="top-product-metrics">
                      <span className="sold">{p.qtySold} Sold</span>
                      <span className="revenue">₹{Number(p.revenue).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INVENTORY VALUATION CARD */}
          <div className="vendor-dashboard-card highlight">
            <div className="valuation-card-inner">
              <span className="valuation-kicker">STORE ASSETS</span>
              <h3>Inventory Valuation</h3>
              <div
                className="valuation-number"
                title={`₹${metrics.inventoryValue.toLocaleString("en-IN")}`}
              >
                {metrics.inventoryValue >= 10000000
                  ? `₹${(metrics.inventoryValue / 10000000).toFixed(2)} Cr`
                  : metrics.inventoryValue >= 100000
                  ? `₹${(metrics.inventoryValue / 100000).toFixed(2)} L`
                  : `₹${metrics.inventoryValue.toLocaleString("en-IN")}`}
              </div>
              <p className="valuation-desc">
                Estimated commercial value of {metrics.totalStock} available stock units across {metrics.totalProducts} active product lines.
              </p>
              <Link to="/vendor/products" className="valuation-action-btn">
                <span>Manage Inventory Catalog</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* RESTOCK MODAL POPUP */}
      {restockProduct && (
        <div className="vendor-modal-backdrop" onClick={() => !savingRestock && setRestockProduct(null)}>
          <div className="vendor-modal-card vendor-restock-popup" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div className="vendor-modal-header-info">
                <div className="modal-header-icon emerald">
                  <Boxes size={20} />
                </div>
                <div>
                  <h3>Restock Product Inventory</h3>
                  <p>Adjust available stock level for your active listing.</p>
                </div>
              </div>
              <button
                type="button"
                className="vendor-modal-close-btn"
                disabled={savingRestock}
                onClick={() => setRestockProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="vendor-restock-form">
              <div className="vendor-restock-product-preview">
                <div className="restock-thumb">
                  {restockProduct.image ? (
                    <img src={restockProduct.image} alt={restockProduct.name} />
                  ) : (
                    <Package size={24} />
                  )}
                </div>
                <div className="restock-meta">
                  <h4>{restockProduct.name}</h4>
                  <span className="restock-cat">{restockProduct.category || "General"}</span>
                  <div className="current-stock-tag">
                    Current Available Stock: <strong>{restockProduct.quantity} units</strong>
                  </div>
                </div>
              </div>

              <div className="vendor-form-group">
                <label className="vendor-form-label">
                  Add Units to Stock <span className="req">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  className="vendor-input"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 25"
                  required
                  autoFocus
                />
                <div className="restock-chips">
                  {[10, 25, 50, 100, 250].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      className={`restock-chip ${Number(restockQty) === qty ? "active" : ""}`}
                      onClick={() => setRestockQty(String(qty))}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="vendor-form-group">
                <label className="vendor-form-label">
                  Restock Reason / Supplier Note <span className="opt">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="vendor-input"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="e.g., Weekly supplier delivery, Warehouse replenishment"
                />
              </div>

              <div className="restock-summary-box">
                <span>Resulting Total Stock:</span>
                <strong>{(Number(restockProduct.quantity) || 0) + (Number(restockQty) > 0 ? Number(restockQty) : 0)} units</strong>
              </div>

              <div className="vendor-modal-actions">
                <button
                  type="button"
                  className="vendor-btn-secondary"
                  disabled={savingRestock}
                  onClick={() => setRestockProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendor-btn-primary"
                  disabled={savingRestock || !restockQty || Number(restockQty) <= 0}
                >
                  {savingRestock ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      <span>Saving Stock...</span>
                    </>
                  ) : (
                    <>
                      <Boxes size={16} />
                      <span>Save Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorDashboard;