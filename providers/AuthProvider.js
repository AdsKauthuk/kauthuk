"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // localStorage is only available in browser environment
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem("adminToken");
          if (token) {
            try {
              // Decode the JWT token
              const decoded = jwtDecode(token);
              
              // Check if token is expired
              const currentTime = Date.now() / 1000;
              if (decoded.exp && decoded.exp < currentTime) {
                console.log("Token expired, logging out");
                localStorage.removeItem("adminToken");
                setAdmin(null);
              } else {
                console.log("Valid token found, user authenticated:", decoded);
                setAdmin(decoded);
              }
            } catch (error) {
              console.error("Error decoding token:", error);
              localStorage.removeItem("adminToken");
              setAdmin(null);
            }
          }
        }
      } catch (e) {
        console.error("Error initializing auth:", e);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Redirect to login when not authenticated on protected routes
  useEffect(() => {
    if (!loading && initialized && !admin) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        // Check if this is an admin route (but not the login page)
        if (path.startsWith('/admin') && !path.includes('/admin/login')) {
          console.log("Unauthorized access attempt, redirecting to login");
          router.replace("/admin/login");
        }
      }
    }
  }, [admin, loading, initialized, router]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("adminToken");
      setAdmin(null);
      router.replace("/admin/login");
    }
  };

  // Helper functions to check user roles
  const isAdmin = () => {
    return admin?.user_type === "admin";
  };

  const isStaff = () => {
    return admin?.user_type === "staff";
  };

  // Check if user has active status
  const isActive = () => {
    return admin?.status === "active";
  };

  // Render loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  const authValue = {
    admin,
    logout,
    isAdmin,
    isStaff,
    isActive,
    loading
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};