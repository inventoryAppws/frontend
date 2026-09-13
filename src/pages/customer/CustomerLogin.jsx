import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerLogin, sendOtp, verifyOtpLogin, forgotPassword, resetPasswordWithOtp } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mode: 'password' | 'otp' | 'forgot'
  const [authMode, setAuthMode] = useState("password");

  // Form states
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // OTP login state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp & new password

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  // Standard Password Login
  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await customerLogin(form);
      if (!data?.token) throw new Error("Login succeeded but no token was returned.");

      toast.success("Logged in successfully!");
      login(data.token, "customer");
      navigate("/customer");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Send Login OTP
  const handleSendLoginOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail) {
      toast.error("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await sendOtp({ email: otpEmail, userType: "customer", purpose: "login" });
      setOtpSent(true);
      toast.success(`Verification code sent to ${otpEmail}! Check your inbox.`);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify Login OTP
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error("Please enter 6-digit OTP code");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await verifyOtpLogin({ email: otpEmail, otp: otpCode, userType: "customer" });
      if (!data?.token) throw new Error("Verification succeeded but no session created.");

      toast.success("OTP Verified! Logged in successfully.");
      login(data.token, "customer", data.user);
      navigate("/customer");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Send Forgot Password OTP
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your registered email");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await forgotPassword({ email: forgotEmail, userType: "customer" });
      setForgotStep(2);
      toast.success(`Reset code sent to ${forgotEmail}! Check your email.`);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPasswordWithOtp({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword,
        userType: "customer"
      });
      toast.success("Password reset successfully! Please login with your new password.");
      setAuthMode("password");
      setForm({ email: forgotEmail, password: "" });
      setForgotStep(1);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header-block">
          <h1>Customer Portal</h1>
          <p className="auth-subtitle">
            {authMode === "password" && "Sign in with your email & password"}
            {authMode === "otp" && "Passwordless login with instant Email OTP"}
            {authMode === "forgot" && "Reset your customer account password"}
          </p>
        </div>

        {/* Tab switcher: Password vs Email OTP */}
        {authMode !== "forgot" && (
          <div className="auth-tabs-toggle">
            <button
              type="button"
              className={`auth-tab-btn ${authMode === "password" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("password");
                setError("");
              }}
            >
              <Lock size={15} />
              <span>Password</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${authMode === "otp" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("otp");
                setError("");
              }}
            >
              <Mail size={15} />
              <span>Email OTP</span>
            </button>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {/* MODE 1: Standard Password Login */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setAuthMode("forgot");
                    setError("");
                    setForgotEmail(form.email || "");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* MODE 2: Email OTP Login */}
        {authMode === "otp" && (
          <div className="auth-otp-flow">
            {!otpSent ? (
              <form onSubmit={handleSendLoginOtp} className="form">
                <div className="form-group">
                  <label>Your Registered Email</label>
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLoginOtp} className="form">
                <div className="form-group">
                  <label>Enter 6-Digit Code sent to <strong>{otpEmail}</strong></label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="otp-input-field"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={handleSendLoginOtp}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE 3: Forgot / Reset Password */}
        {authMode === "forgot" && (
          <div className="auth-forgot-flow">
            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotOtp} className="form">
                <div className="form-group">
                  <label>Enter your registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send Reset Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="form">
                <div className="form-group">
                  <label>6-Digit Code sent to {forgotEmail}</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="otp-input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password & Login"}
                </button>
              </form>
            )}

            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setAuthMode("password");
                  setError("");
                }}
              >
                ← Back to Password Login
              </button>
            </div>
          </div>
        )}

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/customer/register">Register</Link>
        </p>

        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default CustomerLogin;