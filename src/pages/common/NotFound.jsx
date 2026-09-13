import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="center-page">

      <div className="empty-card">

        <h1>404</h1>

        <h2>Page Not Found</h2>

        <p>
          The page you are looking for
          does not exist.
        </p>

        <Link
          to="/"
          className="btn btn-primary"
        >
          Go Home
        </Link>

      </div>

    </div>
  );
}

export default NotFound;