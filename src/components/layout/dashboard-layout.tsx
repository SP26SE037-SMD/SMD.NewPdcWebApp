"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NotificationPanel } from "./NotificationPanel";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Signature,
  BookOpen,
  Globe,
  User,
  Power,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserRoundCheck,
  CalendarCheck2,
  Box,
  LayoutGrid,
  Layers,
  Network,
  Rocket,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { logoutAction } from "@/store/slices/authSlice";

interface SidebarItemProps {
  href: string;
  icon: React.ElementType | string;
  label: string;
  active: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  isHoPDC?: boolean;
  subItems?: {
    href: string;
    label: string;
    active: boolean;
  }[];
}

const SidebarItem = ({
  href,
  icon,
  label,
  active,
  collapsed,
  disabled,
  isHoPDC,
  subItems,
}: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(
    active || subItems?.some((s) => s.active),
  );
  const Icon = typeof icon === "string" ? null : icon;
  const hasSubItems = subItems && subItems.length > 0;
  const isAnySubActive = subItems?.some((s) => s.active);

  const content = (
    <div
      className={`relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${active || (hasSubItems && isAnySubActive)
          ? isHoPDC || true // We want the clean white/green look for VP too
            ? "bg-white shadow-[0_4px_20px_rgba(45,52,43,0.06)] border border-black/5 text-[#1d5c42]"
            : "bg-primary text-white shadow-lg shadow-primary/20"
          : disabled
            ? "text-zinc-300 cursor-not-allowed"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 shadow-none hover:translate-x-1"
        }`}
      onClick={() => hasSubItems && setIsOpen(!isOpen)}
    >
      <div className="flex items-center gap-3">
        {/* Icon Rendering */}
        {typeof icon === "string" ? (
          <span
            className={`material-symbols-outlined transition-all duration-300 ${active || isAnySubActive
                ? "text-[#2d6a4f]"
                : !disabled
                  ? "group-hover:scale-110 text-zinc-400 group-hover:text-[#2d6a4f]"
                  : "text-zinc-300"
              }`}
            style={{
              fontSize: "22px",
              fontVariationSettings:
                active || isAnySubActive ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            {icon}
          </span>
        ) : Icon ? (
          <Icon
            size={20}
            className={`${active || isAnySubActive ? (isHoPDC || true ? "text-[#2d6a4f]" : "text-white") : !disabled ? "group-hover:scale-110 transition-transform" : ""}`}
          />
        ) : null}

        {/* Label */}
        {!collapsed && (
          <span
            className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-colors ${active || isAnySubActive
                ? "font-bold text-[#1d5c42]"
                : "font-semibold text-zinc-500"
              }`}
          >
            {label}
          </span>
        )}
      </div>

      {/* Chevron for sub-items */}
      {hasSubItems && !collapsed && (
        <ChevronRight
          size={14}
          className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""} ${active || isAnySubActive ? "text-[#2d6a4f]" : "text-zinc-400"}`}
        />
      )}

      {/* Active Indicator (Hidden for the new clean VP design as it uses shadow instead) */}
      {(active || (hasSubItems && isAnySubActive)) && !collapsed && !isHoPDC && false && (
        <motion.div
          layoutId="active-indicator"
          className="right-0 w-1 h-6 bg-white rounded-l-full"
        />
      )}
    </div>
  );

  if (disabled) {
    return content;
  }

  return (
    <div className="space-y-1">
      {hasSubItems ? (
        <div className="cursor-pointer">{content}</div>
      ) : (
        <Link href={href}>{content}</Link>
      )}

      <AnimatePresence>
        {hasSubItems && isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden flex flex-col gap-1 pr-1"
          >
            {subItems.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className={`flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${sub.active
                    ? "text-primary bg-primary/5"
                    : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
              >
                <div
                  className={`w-1 h-1 rounded-full ${sub.active ? "bg-primary" : "bg-zinc-200"}`}
                />
                {sub.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getNavigation = () => {
    if (user?.role === "HOCFDC") {
      return [
        {
          group: "Framework Architecture",
          items: [
            {
              href: "/dashboard/hocfdc",
              icon: LayoutDashboard,
              label: "General",
            },
            {
              href: "/dashboard/hocfdc/subjects",
              icon: Box,
              label: "Subjects",
              subItems: [
                {
                  href: "/dashboard/hocfdc/subjects",
                  label: "Subject Management",
                  active: pathname === "/dashboard/hocfdc/subjects",
                },
                {
                  href: "/dashboard/hocfdc/prerequisites",
                  label: "Prerequisites",
                  active: pathname === "/dashboard/hocfdc/prerequisites",
                },
              ],
            },
            {
              href: "/dashboard/hocfdc/curriculums",
              icon: BookOpen,
              label: "Curriculums",
            },
          ],
        },
        {
          group: "Settings",
          items: [
            { href: "/dashboard/hocfdc/profile", icon: User, label: "Profile" },
          ],
        },
      ];
    }

    if (user?.role === "VP") {
      return [
        {
          group: "Core Management",
          items: [

            {
              href: "/dashboard/vice-principal/manage-majors",
              icon: "school",
              label: "Manage Majors",
            },
            {
              href: "/dashboard/vice-principal/digital-enactment",
              icon: "draw",
              label: "Digital Enactment",
            },
          ],
        },
      ];
    }

    if (user?.role === "HOPDC") {
      return [
        {
          group: "Main Menu",
          items: [
            {
              href: "/dashboard/hopdc",
              icon: "dashboard",
              label: "Overview",
            },
          ],
        },
        {
          group: "Strategic Operations",
          items: [
            {
              href: "/dashboard/hopdc/sprint-management",
              icon: "event_available",
              label: "Receive Sprints",
            },
          ],
        },
        {
          group: "Settings",
          items: [
            {
              href: "/dashboard/hopdc/profile",
              icon: "person",
              label: "Profile",
            },
          ],
        },
      ];
    }

    // Default or other roles
    const rolePath =
      user?.role === "HoPDC"
        ? "hopdc"
        : user?.role === "PDCM"
          ? "pdcm"
          : "collaborator";
    return [
      {
        group: "Operations",
        items: [
          {
            href: `/dashboard/${rolePath}`,
            icon: LayoutDashboard,
            label: "Dashboard",
          },
        ],
      },
    ];
  };

  const navigation = getNavigation();

  const handleLogout = async () => {
    await dispatch(logoutAction());
    // Redirection is handled via state change/middleware or just window location for clean refresh
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-background font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 88 }}
        className={`relative ${user?.role === 'VP' ? 'bg-[#f8f9fa]' : 'bg-white'} border-r border-border flex flex-col z-30 shadow-sm`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center text-muted hover:text-foreground transition-colors shadow-sm z-40"
        >
          {isSidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>

        {/* Logo Section */}
        <div className="p-6 mb-4">
          {user?.role === "VP" && isSidebarOpen ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-[#2d6a4f] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#2d6a4f]/20">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-[#1d5c42] leading-tight whitespace-nowrap">
                  Office of the VP
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Academic Affairs
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center justify-center lg:justify-start"
            >
              <img
                src="/icon-with-name.png"
                alt="SMD System"
                className={
                  isSidebarOpen
                    ? "h-10 w-auto object-contain"
                    : "h-10 w-10 object-contain"
                }
              />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 no-scrollbar">
          {navigation.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {isSidebarOpen && (
                <h3 className="px-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">
                  {group.group}
                </h3>
              )}
              {group.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                  collapsed={!isSidebarOpen}
                  isHoPDC={user?.role === "HOPDC"}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border/50 space-y-2">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 group"
          >
            <Power
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {isSidebarOpen && (
              <span className="text-sm font-semibold">Sign Out</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-8">
            <div className="relative w-[600px] h-10 bg-zinc-50 border border-zinc-100 rounded-full flex items-center px-4 overflow-hidden group">
              <div
                className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 shadow-lg shadow-primary/20 flex-shrink-0"
                style={{ fontFamily: "var(--font-plus-jakarta)" }}
              >
                <Rocket size={12} strokeWidth={3} />
                <span>System Live</span>
              </div>

              <div className="flex-1 overflow-hidden relative ml-4 h-full flex items-center">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: "-100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 45,
                    ease: "linear",
                  }}
                  className="whitespace-nowrap text-xs font-bold text-zinc-500 flex items-center gap-12"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sprint 4 Syllabuses are now open for Peer Review. Deadline:
                    April 15th.
                  </span>
                  <span className="flex items-center gap-2 text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    New Feature: You can now track revision history in the
                    Review Cycle Logs.
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    System Maintenance scheduled for Sunday (April 10) at 02:00
                    AM UTC.
                  </span>
                  <span
                    className="flex items-center gap-2 text-primary"
                    style={{ fontFamily: "var(--font-plus-jakarta)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Welcome to SMD PDC Management System. Ensuring Global
                    Syllabus Standards.
                  </span>
                </motion.div>

                {/* Fade effect at both ends */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-50 to-transparent z-[5]"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-50 to-transparent z-[5]"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <NotificationPanel />
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground">
                  {user?.fullName}
                </p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {user?.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-background to-white border border-border flex items-center justify-center overflow-hidden">
                <User size={20} className="text-muted" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
