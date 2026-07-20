"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-50 rounded-lg transition-colors text-sm font-medium border border-slate-700 hover:border-amber-600/50 disabled:opacity-50"
      title="Securely end session"
    >
      <LogOut size={16} className={isLoggingOut ? "animate-pulse text-amber-500" : "text-amber-500"} />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}