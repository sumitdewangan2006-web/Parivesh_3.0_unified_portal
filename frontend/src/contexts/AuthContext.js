"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";

// ── Auth Context ─────────────────────────────────────────────────────
// Provides user state, login/register/logout, and role checks app-wide

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      api
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          Cookies.remove("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    Cookies.set("token", data.token, { expires: 1, sameSite: "lax" });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    Cookies.set("token", data.token, { expires: 1, sameSite: "lax" });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    Cookies.remove("token");
    setUser(null);
    window.location.href = "/auth/login";
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const { data } = await api.put("/auth/profile", profileData);
    setUser(data);
    return data;
  }, []);

  // Role check helpers
  const hasRole = useCallback(
    (roleName) => user?.role?.name === roleName,
    [user]
  );

  const isAdmin = user?.role?.name === "admin";
  const isProponent = user?.role?.name === "project_proponent";
  const isScrutiny = user?.role?.name === "scrutiny_team";
  const isMom = user?.role?.name === "mom_team";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        hasRole,
        isAdmin,
        isProponent,
        isScrutiny,
        isMom,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
