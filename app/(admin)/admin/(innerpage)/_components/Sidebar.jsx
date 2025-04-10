"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Layers,
  ShoppingBag,
  Tag,
  PanelRight,
  FileText,
  Package,
  Palette,
  Activity,
  Box,
  Star,
  Phone,
  Menu as MenuIcon,
  HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getMenuForSidebar } from "@/actions/menu";

// Fallback menu data for initial render and error cases
const fallbackMenuData = [
  {
    section: "Home",
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        href: "/admin/dashboard",
      },
    ],
  },
  {
    section: "Content",
    items: [
      {
        label: "Sliders",
        icon: "Layers",
        subMenu: [
          { label: "View All", href: "/admin/slider/list-sliders" },
          { label: "Add New", href: "/admin/slider/add-slider" },
        ],
      },
    ],
  },
];

// Map icon names from database to Lucide component
const iconMap = {
  HomeIcon: <HomeIcon size={18} />,
  LayoutDashboard: <LayoutDashboard size={18} />,
  Layers: <Layers size={18} />,
  FileText: <FileText size={18} />,
  Tag: <Tag size={18} />,
  PanelRight: <PanelRight size={18} />,
  Palette: <Palette size={18} />,
  Package: <Package size={18} />,
  ShoppingBag: <ShoppingBag size={18} />,
  Users: <Users size={18} />,
  Settings: <Settings size={18} />,
  Star: <Star size={18} />,
  Phone: <Phone size={18} />,
  Menu: <MenuIcon size={18} />,
  Activity: <Activity size={18} />,
};

// Component to render the appropriate icon
const getIconComponent = (iconName) => {
  return iconMap[iconName] || <MenuIcon size={18} />;
};

const MenuIconWrapper = ({ icon, isActive }) => (
  <div
    className={cn(
      "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
      isActive
        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400"
        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/40"
    )}
  >
    {typeof icon === "string" ? getIconComponent(icon) : icon}
  </div>
);

// MenuItem component with consistent spacing
const MenuItem = ({
  item,
  isActive,
  isCollapsed,
  onClick,
  openMenus,
  toggleMenu,
}) => {
  const hasSubMenu = item.subMenu?.length > 0;
  const isOpen = openMenus[item.label];
  const pathname = usePathname();

  if (hasSubMenu) {
    return (
      <div className="w-full">
        <Collapsible
          open={isOpen}
          onOpenChange={() => toggleMenu(item.label)}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between p-2 h-auto my-1 group", // Added consistent my-1 margin
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-300",
                isOpen && "bg-blue-50/50 dark:bg-blue-900/20"
              )}
            >
              <div className="flex items-center gap-3">
                <MenuIconWrapper icon={item.icon} isActive={isActive} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform duration-200 text-slate-400",
                    isOpen && "rotate-180"
                  )}
                />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-12 pt-1 pb-1">
            {" "}
            {/* Adjusted padding */}
            {!isCollapsed &&
              item.subMenu.map((sub, index) => (
                <Link
                  key={sub.label}
                  href={sub.href}
                  className={cn(
                    "block py-1.5 px-3 my-1 rounded-md text-sm transition-colors", // Added consistent my-1 margin
                    sub.href === pathname
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30"
                      : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  )}
                >
                  {sub.label}
                </Link>
              ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <Link href={item.href || "#"} className="w-full block" onClick={onClick}>
      <div
        className={cn(
          "flex items-center justify-between p-2 my-1 rounded-lg group transition-colors", // Added consistent my-1 margin
          isActive
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
        )}
      >
        <div className="flex items-center gap-3">
          <MenuIconWrapper icon={item.icon} isActive={isActive} />
          {!isCollapsed && (
            <span className="text-sm font-medium">{item.label}</span>
          )}
        </div>
        {!isCollapsed && item.badge && (
          <Badge
            className={cn(
              "text-white text-xs",
              item.badgeColor || "bg-blue-500"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </div>
    </Link>
  );
};

const Sidebar = ({ className }) => {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { logout, admin } = useAuth();
  const router = useRouter();
  const [menuData, setMenuData] = useState(fallbackMenuData);
  const [loading, setLoading] = useState(true);

  // console.log("admin?.user_type",admin?.user_type)
  // Fetch menu data from server
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const response = await getMenuForSidebar();
  
        if (response.success && response.data) {
          let updatedData = [...response.data];
          
          // Only add the Menu item if the user is an admin
          if (admin?.user_type === 'admin') {
            // Find if Management section already exists
            const managementSectionIndex = response.data.findIndex(
              section => section.section === "Management"
            );
            
            if (managementSectionIndex !== -1) {
              // Add Menu item to existing Management section
              updatedData[managementSectionIndex].items = [
                ...updatedData[managementSectionIndex].items,
                {
                  label: "Menu",
                  icon: "LayoutDashboard",
                  href: "/admin/menu",
                }
              ];
            } else {
              // Create a new Management section with Menu item
              updatedData.push({
                section: "Management",
                items: [
                  {
                    label: "Menu",
                    icon: "LayoutDashboard",
                    href: "/admin/menu",
                  }
                ]
              });
            }
          }
          
          setMenuData(updatedData);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMenuData();
  }, [admin]); // Add admin as a dependency

  // Initialize open menus based on current route
  useEffect(() => {
    const initOpenMenus = {};

    menuData.forEach((section) => {
      section.items.forEach((item) => {
        if (item.subMenu) {
          const isInSubmenu = item.subMenu.some(
            (subItem) =>
              pathname === subItem.href || pathname.startsWith(subItem.href)
          );
          if (isInSubmenu) {
            initOpenMenus[item.label] = true;
          }
        }
      });
    });

    setOpenMenus(initOpenMenus);
  }, [pathname, menuData]);

  // Close mobile sidebar when navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => pathname === path;

  const isActiveSection = (menuItem) => {
    if (menuItem.href && isActive(menuItem.href)) {
      return true;
    }

    if (menuItem.subMenu) {
      return menuItem.subMenu.some(
        (subItem) =>
          pathname === subItem.href || pathname.startsWith(subItem.href)
      );
    }

    return false;
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-400 dark:border-blue-900 transition-all duration-300 shadow-sm",
        isCollapsed ? "w-16" : "md:w-64 w-72",
        isDesktop ? "translate-x-0" : "md:translate-x-full",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-400 dark:border-blue-900 h-16">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-16 h-16 relative">
              <Image
                src={"/assets/images/logo.png"}
                alt="Logo"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <h1 className="text-base font-semibold text-blue-700 dark:text-blue-400 truncate">
              Admin
            </h1>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Box size={20} />
          </div>
        )}

        {isDesktop && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronLeft size={16} />
          </Button>
        )}
      </div>

      {/* Menu Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {loading ? (
          // Show loading skeleton for menu
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16 mb-2"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                      {!isCollapsed && (
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-28"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Render actual menu data
          menuData.map((section, sectionIndex) => (
            <div
              key={section.section}
              className={cn("pb-4", sectionIndex !== 0 && "pt-2")}
            >
              {!isCollapsed && (
                <h3 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
                  {section.section}
                </h3>
              )}
              <div className="flex flex-col">
                {section.items.map((item) => (
                  <div key={item.label} className="w-full">
                    {isCollapsed ? (
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div>
                              <MenuItem
                                item={item}
                                isActive={isActiveSection(item)}
                                isCollapsed={isCollapsed}
                                toggleMenu={toggleMenu}
                                openMenus={openMenus}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-gray-400 dark:border-blue-900"
                          >
                            <div className="flex items-center gap-2">
                              {item.label}
                              {item.badge && (
                                <Badge
                                  className={cn(
                                    "text-white text-xs",
                                    item.badgeColor || "bg-blue-500"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <MenuItem
                        item={item}
                        isActive={isActiveSection(item)}
                        isCollapsed={isCollapsed}
                        toggleMenu={toggleMenu}
                        openMenus={openMenus}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Section with User Profile and Settings */}
      <div className="border-t border-gray-400 dark:border-blue-900 p-4">
        {!isCollapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2 bg-blue-50/70 dark:bg-blue-900/30 rounded-lg">
              <Avatar className="h-9 w-9 border-2 border-blue-200 dark:border-blue-800">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {admin?.username?.slice(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate">
                  {admin?.username || "Admin"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {admin?.email || "admin@example.com"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-slate-600 dark:text-slate-300 border-gray-400 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
                onClick={() => router.push("/admin/settings")}
              >
                <Settings className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                Settings
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800/50"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer border-2 border-blue-200 dark:border-blue-800">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {admin?.username?.slice(0, 2).toUpperCase() || "AD"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-gray-400 dark:border-blue-900"
                >
                  {admin?.username || "Admin"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex flex-col gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-gray-400 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400"
                      onClick={() => router.push("/admin/settings")}
                    >
                      <Settings size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-gray-400 dark:border-blue-900"
                  >
                    Settings
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                      onClick={logout}
                    >
                      <LogOut size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-gray-400 dark:border-blue-900"
                  >
                    Logout
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {isDesktop && isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="mt-4 h-8 w-8 mx-auto text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
