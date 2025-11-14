import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import logo from "../assets/6a9a1923a3866d6050391544b559c9d12ee5b150.png";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        " https://gateway.ismartghana.com/auth-service/api/publicauth/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      console.log("Login response:", response);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Login failed. Please try again.");
      } else {
        const data = await response.json();
        console.log("Full login response:", data);

        // Try to extract token from different possible locations
        let token = null;
        if (data?.data?.tokens?.accessToken) {
          token = data.data.tokens.accessToken;
        } else if (data?.token) {
          token = data.token;
        } else if (data?.accessToken) {
          token = data.accessToken;
        }

        if (token) {
          console.log("Token found and saved:", token);
          localStorage.setItem("authToken", token);
          onLogin();
        } else {
          console.error("No token found in response:", data);
          setError(
            "Login successful but no token received. Please contact support."
          );
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={logo}
              alt="iSmartPay"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-center text-gray-900 mb-8">
            Sign In to Your Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center mb-2">
                {error}
              </div>
            )}
            {/* Email Input */}
            <div className="relative">
              <div
                className={`flex items-center border rounded-lg px-3 py-2.5 transition-colors ${
                  emailFocused
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Mail className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  required
                />
                {emailFocused && (
                  <span className="text-xs text-gray-500 bg-gray-800 text-white px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                    Please fill in this field.
                  </span>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white">
                <Lock className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Divider */}
            <div className="text-center text-sm text-gray-600 py-2">
              Don't have an account?
            </div>

            {/* Create Account Button */}
            <Button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-lg transition-colors"
            >
              Create New Account
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 iSmartPay. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
