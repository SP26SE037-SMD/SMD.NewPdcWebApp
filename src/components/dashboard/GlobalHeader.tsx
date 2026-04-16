import React from "react";
import { Bell } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface GlobalHeaderProps {
  title?: string;
}

export default function GlobalHeader({ title = "" }: GlobalHeaderProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-border z-50 flex items-center justify-between px-6 lg:px-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      {/* Left side: Page Title */}
      <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">
        {title}
      </h1>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-6">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-background text-muted hover:bg-zinc-100 hover:text-foreground transition-colors">
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-background"></span>
        </button>

        <div className="hidden sm:flex items-center gap-4 border-l border-border pl-6">
          <div className="text-right flex flex-col justify-center">
            <span className="text-[15px] font-extrabold text-foreground leading-tight">
              {user?.fullName || "System Administrator"}
            </span>
            <span className="text-xs font-semibold text-muted">
              {user?.role || "Superadmin"}
            </span>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-black shadow-lg shadow-secondary/30">
            {user
              ? user.fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "SA"}
          </div>
        </div>
      </div>
    </div>
  );
}
