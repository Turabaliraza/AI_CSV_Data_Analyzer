import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Login failed.");
        return;
      }

      /*
        Clear any legacy authentication key
        from older versions of the application.
      */
      localStorage.removeItem("access_token");

      /*
        Store the JWT using the application's
        current authentication key.
      */
      localStorage.setItem(
        "accessToken",
        data.access_token
      );

      /*
        Store the currently authenticated user.
      */
      if (data.user) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(data.user)
        );
      }

      navigate("/dashboard");

    } catch (error) {

      console.error("Login error:", error);

      setMessage(
        "Could not connect to backend."
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">

          <div className="auth-brand-icon">
            AI
          </div>

          <div>
            <h1>CSV Analyzer</h1>
            <p>Intelligent Data Analysis</p>
          </div>

        </div>


        <div className="auth-header">

          <h2>Welcome back</h2>

          <p>
            Sign in to continue analyzing your datasets.
          </p>

        </div>


        <form onSubmit={handleLogin}>

          <div className="auth-field">

            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
            />

          </div>


          <div className="auth-field">

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
            />

          </div>


          {message && (
            <div className="auth-error">
              {message}
            </div>
          )}


          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>


        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create an account
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;