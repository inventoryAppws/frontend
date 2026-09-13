import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const {
    userType,
    isAuthenticated,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">

      <div className="navbar-inner">

        <Link
          to="/"
          className="navbar-brand"
        >
          Inventory
        </Link>


        <div className="navbar-links">

          {!isAuthenticated && (
            <>
              <Link to="/customer/login">
                Customer Login
              </Link>

              <Link to="/customer/register">
                Customer Register
              </Link>

              <Link to="/vendor/login">
                Vendor Login
              </Link>

              <Link to="/vendor/register">
                Vendor Register
              </Link>
            </>
          )}


          {isAuthenticated &&
            userType === "customer" && (
              <>
                <Link to="/customer">
                  Products
                </Link>

                <Link to="/customer/wishlist">
                  Wishlist
                </Link>

                <Link to="/customer/cart">
                  Cart
                </Link>

                <Link to="/customer/orders">
                  Orders
                </Link>

                <Link to="/customer/settings">
                  Settings
                </Link>

                <button
                  className="nav-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}


          {isAuthenticated &&
            userType === "vendor" && (
              <>
                <Link to="/vendor">
                  Dashboard
                </Link>

                <Link to="/vendor/products">
                  Products
                </Link>

                <Link to="/vendor/orders">
                  Orders
                </Link>

                <button
                  className="nav-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}

        </div>

      </div>

    </nav>
  );
}

export default Navbar;
