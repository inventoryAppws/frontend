import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { customerRegister } from "../../services/authService";

import { getErrorMessage } from "../../utils/errorHandler";

function CustomerRegister() {
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
      setError("Please use a valid Gmail address ending with @gmail.com.");
      return;
    }

    setLoading(true);

    try {
      await customerRegister(form);

      setSuccess(
        "Registration successful. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/customer/login");
      }, 1000);

    } catch (error) {
      setError(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create Customer Account</h1>

        <p className="auth-subtitle">
          Register to shop and manage orders
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

            <label htmlFor="name">
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
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

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
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
          Already have an account?{" "}

          <Link to="/customer/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default CustomerRegister;