import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedType }) {
  const { token, userType } = useAuth();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to={`/${allowedType}/login`}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (userType !== allowedType) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;