"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Mail,
  Moon,
  Sun,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/providers/ThemeProvider";

const Header = () => {
  const pathname = usePathname();
  const { logout, admin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(3);

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").filter(Boolean);
    if (path.length === 1) return "Dashboard";

    // Format the last segment for display
    const lastSegment = path[path.length - 1];
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="sticky top-0 z-30 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex justify-between items-center h-16 px-4">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-72 border-r border-gray-400 dark:border-blue-900"
            >
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo and title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <LayoutDashboard size={18} />
          </div>
          <h1 className="md:text-xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent playfair-bold">
            Kauthuk
          </h1>
        </div>

        {/* Page title - desktop only */}
        <div className="hidden md:block">
          <h2 className="text-base font-medium text-slate-600 dark:text-slate-300 poppins-medium">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User profile dropdown */}
        <div className="ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 pl-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40"
              >
                <Avatar className="h-7 w-7 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 poppins-bold">
                    {admin?.username?.slice(0, 2).toUpperCase() || "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-sm">
                  <span className="font-medium leading-none poppins-semibold">
                    {admin?.username || "Admin"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-1 poppins-regular">
                    Administrator
                  </span>
                </div>
                <ChevronDown size={14} className="ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border border-gray-400 dark:border-blue-900"
            >
              <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 poppins-medium">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-100 dark:bg-blue-900" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer poppins-regular">
                  <User className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer poppins-regular">
                  <Settings className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer poppins-regular">
                  <Mail className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span>Messages</span>
                  <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-blue-100 dark:bg-blue-900" />
              <DropdownMenuItem
                onClick={logout}
                className="hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer poppins-medium"
              >
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;