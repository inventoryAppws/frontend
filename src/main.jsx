import ReactDOM from "react-dom/client";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

import "./index.css";
import "./styles/discovery.css";
import "./styles/darwin.css";
import "leaflet/dist/leaflet.css";
import "./styles/address-map.css";
import "./styles/support-tickets.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);