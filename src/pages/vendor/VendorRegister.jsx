import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  vendorRegister,
} from "../../services/authService";

import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";

function VendorRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!/^[^\s@]+@gmail\.com$/i.test(form.email.trim())) {
      const msg = "Please use a valid Gmail address ending with @gmail.com.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      await vendorRegister(form);

      const msg = "Vendor account created successfully. Redirecting to login...";
      setSuccess(msg);
      toast.success(msg);

      setTimeout(() => {
        navigate("/vendor/login");
      }, 1000);

    } catch (error) {
      const errMsg = getErrorMessage(error);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Vendor Registration</h1>

        <p className="auth-subtitle">
          Create your vendor account
        </p>


        {error && (
          <div className="error-box">
            {error}
          </div>
        )}


        {success && (
          <div className="success-box">
            {success}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="form"
        >

          <div className="form-group">

            <label>
              Name
            </label>

            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />

          </div>


          <div className="form-group">

            <label>
              Email
            </label>

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your Gmail address"
              pattern="^[^\s@]+@gmail\.com$"
              required
            />

          </div>


          <div className="form-group">

            <label>
              Password
            </label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              minLength={6}
              required
            />

          </div>


          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Register"}
          </button>

        </form>


        <p className="auth-footer">
          Already have a vendor account?{" "}

          <Link to="/vendor/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default VendorRegister;