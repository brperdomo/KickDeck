import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Calendar,
  Settings,
  Users,
  Home,
  LogOut,
  FileText,
  Building2,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  onLogout: () => void;
  currentPath: string;
}

export function MobileNavigation({ onLogout, currentPath }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { icon: Home, label: "Dashboard", href: "/admin" },
    { icon: Calendar, label: "Events", href: "/admin/events" },
    { icon: Users, label: "Teams", href: "/admin/teams" },
    { icon: Building2, label: "Complexes", href: "/admin/complexes" },
    { icon: MessageSquare, label: "Chat", href: "/admin/chat" },
    { icon: FileText, label: "Reports", href: "/admin/reports" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 p-2 bg-background border rounded-lg shadow-lg md:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Menu */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? "0%" : "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-background border-l shadow-xl z-50 md:hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) {
            setIsOpen(false);
          }
        }}
      >
        <div className="flex flex-col h-full pt-16 pb-6 px-4">
          <nav className="flex-1 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors mt-auto"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </motion.div>
    </>
  );
}
