import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="landing-page">

      {/* =========================
          HERO
      ========================== */}

      <section className="landing-hero">

        <div className="landing-navbar">

          <Link
            to="/"
            className="landing-logo"
          >
            <span className="logo-mark">I</span>
            Inventory
          </Link>

          <div className="landing-nav-actions">

            <Link
              to="/customer/login"
              className="landing-login-link"
            >
              Customer Login
            </Link>

            <Link
              to="/vendor/login"
              className="landing-vendor-link"
            >
              Vendor Portal
            </Link>

          </div>

        </div>


        <div className="landing-hero-content">

          <div className="landing-badge">
            Inventory Management Platform
          </div>

          <h1>
            Everything you need to
            <span> manage inventory.</span>
          </h1>

          <p>
            A simple and powerful platform for
            customers and vendors to manage
            products, orders, carts and inventory
            in one place.
          </p>


          <div className="landing-actions">

            <Link
              to="/customer/register"
              className="btn landing-primary-btn"
            >
              Start Shopping
              <span>→</span>
            </Link>

            <Link
              to="/vendor/register"
              className="btn landing-secondary-btn"
            >
              Become a Vendor
            </Link>

          </div>

        </div>


        {/* Dashboard Preview */}

        <div className="landing-preview">

          <div className="preview-topbar">

            <div className="preview-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span>
              Inventory Dashboard
            </span>

          </div>


          <div className="preview-body">

            <div className="preview-sidebar">

              <div className="preview-sidebar-logo">
                Inventory
              </div>

              <div className="preview-sidebar-item active">
                Dashboard
              </div>

              <div className="preview-sidebar-item">
                Products
              </div>

              <div className="preview-sidebar-item">
                Orders
              </div>

              <div className="preview-sidebar-item">
                Analytics
              </div>

            </div>


            <div className="preview-content">

              <div className="preview-title">
                <div>
                  <strong>
                    Good morning 👋
                  </strong>

                  <small>
                    Here's your inventory overview
                  </small>
                </div>
              </div>


              <div className="preview-stats">

                <div>
                  <small>
                    Total Products
                  </small>

                  <strong>
                    128
                  </strong>
                </div>

                <div>
                  <small>
                    Orders
                  </small>

                  <strong>
                    42
                  </strong>
                </div>

                <div>
                  <small>
                    Revenue
                  </small>

                  <strong>
                    ₹48.5K
                  </strong>
                </div>

              </div>


              <div className="preview-chart">

                <div className="chart-label">
                  Sales Overview
                </div>

                <div className="chart-bars">

                  <span style={{ height: "35%" }}></span>
                  <span style={{ height: "55%" }}></span>
                  <span style={{ height: "45%" }}></span>
                  <span style={{ height: "75%" }}></span>
                  <span style={{ height: "60%" }}></span>
                  <span style={{ height: "90%" }}></span>
                  <span style={{ height: "72%" }}></span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          FEATURES
      ========================== */}

      <section className="landing-features">

        <div className="landing-section-heading">

          <span>
            BUILT FOR YOUR WORKFLOW
          </span>

          <h2>
            Everything in one place
          </h2>

          <p>
            Manage your complete inventory
            workflow without unnecessary complexity.
          </p>

        </div>


        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              📦
            </div>

            <h3>
              Product Management
            </h3>

            <p>
              Vendors can create and manage
              their products and inventory
              quantities.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              🛒
            </div>

            <h3>
              Easy Shopping
            </h3>

            <p>
              Customers can browse products,
              add items to their cart and
              place orders.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ❤️
            </div>

            <h3>
              Wishlist
            </h3>

            <p>
              Save products for later and
              quickly access your favorite
              items.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              📊
            </div>

            <h3>
              Order Tracking
            </h3>

            <p>
              Keep track of customer orders
              and monitor your sales workflow.
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          CTA
      ========================== */}

      <section className="landing-cta">

        <div>

          <h2>
            Ready to get started?
          </h2>

          <p>
            Choose your account type and
            start using the inventory platform.
          </p>

        </div>


        <div className="landing-cta-actions">

          <Link
            to="/customer/register"
            className="btn landing-cta-white"
          >
            Customer Account
          </Link>

          <Link
            to="/vendor/register"
            className="btn landing-cta-outline"
          >
            Vendor Account
          </Link>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================== */}

      <footer className="landing-footer">

        <div>
          <strong>
            Inventory
          </strong>

          <span>
            Inventory management made simple.
          </span>
        </div>

        <span>
          © {new Date().getFullYear()}
          {" "}Inventory Management System
        </span>

      </footer>

    </div>
  );
}

export default Home;