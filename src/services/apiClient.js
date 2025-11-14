/**
 * Generic API Client
 * Handles HTTP requests with error handling and CORS support
 */

const API_BASE_URL = "https://payadmin.ismartghana.com/auth-service/api";

/**
 * Generic API request handler with error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Handle response based on status
    if (!response.ok) {
      let errorMessage = "Request failed.";
      let rawErrorData = null;

      try {
        const responseText = await response.text();
        rawErrorData = responseText;
        const errorData = responseText ? JSON.parse(responseText) : {};
        const message = errorData.message || errorData.error || "";

        console.log("🔍 API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        });

        // Handle specific error cases
        if (response.status === 500 && message === "Invalid credentials") {
          errorMessage = "Invalid email or password.";
        } else if (response.status === 401) {
          errorMessage = "Invalid email or password.";
        } else if (response.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (response.status >= 500) {
          // Check for specific server error messages before generic fallback
          if (message && message.includes("already exists")) {
            errorMessage =
              "An account with this email or phone number already exists. Please use a different email address or phone number.";
          } else if (message && message.includes("duplicate")) {
            errorMessage =
              "This information is already registered. Please use different details.";
          } else {
            errorMessage = "Server error. Please try again later.";
          }
        } else if (message) {
          errorMessage = message;
        }
      } catch (parseError) {
        console.error("❌ Failed to parse error response:", parseError);
        console.log("Raw error response:", rawErrorData);

        if (response.status === 401) {
          errorMessage = "Invalid email or password.";
        } else if (response.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (response.status >= 500) {
          // Check raw response text for specific error patterns
          if (rawErrorData && rawErrorData.includes("already exists")) {
            errorMessage =
              "An account with this email or phone number already exists. Please use a different email address or phone number.";
          } else if (rawErrorData && rawErrorData.includes("duplicate")) {
            errorMessage =
              "This information is already registered. Please use different details.";
          } else {
            errorMessage = "Server error. Please try again later.";
          }
        } else {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
      }

      console.log("🚨 Throwing error:", errorMessage);
      throw new Error(errorMessage);
    }

    // Robust parse: handle empty or non-JSON responses gracefully
    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_parseErr) {
      data = {};
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
      throw new Error(
        "Unable to connect to the server. Please try again in a moment."
      );
    } else if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    } else if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error(
        "You appear to be offline. Check your internet connection."
      );
    }

    throw err;
  }
};

export default apiRequest;
