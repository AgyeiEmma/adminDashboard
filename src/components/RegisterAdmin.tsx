import React, { useState, useEffect } from "react";
import { Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

// Function to generate random 6-character password
const generatePassword = (): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
};

const RegisterAdmin: React.FC = () => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: generatePassword(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegeneratePassword = () => {
    setForm({ ...form, password: generatePassword() });
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(form.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch(
        "https://gateway.ismartghana.com/auth-service/api/publicauth/admin/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      // Only show error if email is already registered
      if (
        data.message &&
        data.message.includes("Unique constraint failed") &&
        data.message.includes("email")
      ) {
        setError(
          "This email is already registered. Please use a different email address."
        );
        setSuccess(false);
        return;
      }
      // Otherwise, show only success message
      setSuccess(true);
      setError(null);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: generatePassword(),
      });
      // After receiving the token from your login API response:
      //   localStorage.setItem("Registration_auth_token",data.data.tokens.accessToken);
    } catch (err: any) {
      setError(null);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="mt-1"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label htmlFor="password">Generated Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                readOnly
                className="mt-1 pr-24 bg-gray-50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 p-1"
                  onClick={handleCopyPassword}
                  tabIndex={-1}
                  aria-label="Copy password"
                  title="Copy password"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 p-1"
                  onClick={handleRegeneratePassword}
                  tabIndex={-1}
                  aria-label="Regenerate password"
                  title="Regenerate password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 p-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated 6-character password. Click refresh to generate a
              new one.
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Registering..." : "Register"}
          </Button>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          {success && !error && (
            <div className="text-green-600 text-sm mt-2">
              Registration successful!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterAdmin;
