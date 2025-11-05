"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type UserState = { userId: string; username: string } | null;

interface UserContextValue {
  user: UserState;
  login: (user: { userId: string; username: string }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState>(null);

  // Load user from localStorage on first mount
  useEffect(() => {
    const savedUser = localStorage.getItem("app_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (data: { userId: string; username: string }) => {
    const newUser = { userId: data.userId, username: data.username };
    setUser(newUser);
    localStorage.setItem("app_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("app_user");
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
