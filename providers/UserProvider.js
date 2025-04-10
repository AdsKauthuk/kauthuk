"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  loginUser as loginUserAction,
  registerUser as registerUserAction,
  logoutUser as logoutUserAction,
  getUserProfile,
} from "@/actions/user";

// Routes that require authentication
const PROTECTED_ROUTES = [ "/my-account", "/orders", "/wishlist"];

// Create the authentication context
const UserAuthContext = createContext();

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Set isClient to true on mount - this helps prevent hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!isClient) return; // Skip on server-side rendering

      try {
        setError(null);
        const result = await getUserProfile();

        if (result.success && result.user) {
          setUser(result.user);
        } else {
          setUser(null);
          if (result.error) setError(result.error);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setError(error.message || "Authentication check failed");
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      checkAuth();
    }
  }, [isClient]);

  // Redirect to login if accessing protected routes without authentication
  useEffect(() => {
    if (!loading && !user && pathname && isClient) {
      const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute) {
        // Save the attempted URL to redirect back after login
        localStorage.setItem("redirectAfterLogin", pathname);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, loading, pathname, router, isClient]);

  // Login function
  const login = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // Create a copy of FormData to ensure values are properly sent
      const processedFormData = new FormData();

      // Ensure email and password are included and trimmed if needed
      const email = formData.get("email")?.trim();
      const password = formData.get("password");
      const captcha = formData.get("captcha");

      if (email) processedFormData.append("email", email);
      if (password) processedFormData.append("password", password);
      if (captcha) processedFormData.append("captcha", captcha);

      const result = await loginUserAction(processedFormData);

      if (result.success) {
        setUser(result.user);

        // Check if there's a redirect URL
        let redirectUrl = "/my-account";
        const storedRedirect = localStorage.getItem("redirectAfterLogin");
        if (storedRedirect) {
          redirectUrl = storedRedirect;
          localStorage.removeItem("redirectAfterLogin");
        }

        router.push(redirectUrl);
        return { success: true };
      } else {
        setError(result.error || "Login failed");
        return {
          success: false,
          error: result.error || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await registerUserAction(formData);

      if (result.success) {
        setUser(result.user);
        router.push("/my-account");
        return { success: true };
      } else {
        setError(result.error || "Registration failed");
        return {
          success: false,
          error: result.error || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logoutUserAction();
      setUser(null);
      router.push("/");
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      const errorMessage = error.message || "Logout failed";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get full profile data
  const getProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserProfile();

      if (result.success) {
        setUser(result.user);
        return { success: true, data: result.user };
      } else {
        setError(result.error || "Failed to fetch profile");
        return {
          success: false,
          error: result.error || "Failed to fetch profile",
        };
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Clear any authentication errors
  const clearError = () => {
    setError(null);
  };

  // Only show loading spinner on client-side to prevent hydration issues
  const shouldShowLoading = isClient && loading;

  return (
    <UserAuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        getProfile,
        isAuthenticated,
        loading: shouldShowLoading,
        error,
        clearError,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
};
