"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider"; // Added auth hook import

// UI Components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Filter,
  ListFilter,
  LayoutGrid,
  LayoutList,
  Menu as MenuIcon,
  HomeIcon,
  CheckCircle,
  XCircle,
  Settings,
  Layers,
  Eye,
  FileEdit,
  FilePlus,
  FileX,
  Lock,
  LockOpen,
  Users,
  ArrowDown,
  ArrowUp,
  Link as LinkIcon,
  SquareArrowOutUpRight,
  Group,
  FileText,
  Tag,
  PanelRight,
  Palette,
  Package,
  ShoppingBag,
  Star,
  Phone,
  Activity,
  Building
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";
import { MenuSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

// Actions
import {
  createMenu,
  deleteMenuById,
  getMenus,
  toggleMenuStatus,
  updateMenu,
  getMenuHierarchy,
  getMenuById,
  setMenuPermission,
} from "@/actions/menu";
import { getAdmins2 } from "@/actions/admin"; // Import admin actions to fetch staff
import { toast } from "sonner";

const MenuPage = () => {
  const { admin, isAdmin } = useAuth(); // Use auth context
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    display_name: "",
    path: "",
    icon: "",
    parent_id: null,
    sort_order: 0,
    is_submenu: false,
    is_header: false,
  });
  const [permissionsData, setPermissionsData] = useState({
    menu_id: null,
    menu_name: "",
    admins: [],
    selectedAdmin: null,
    permissions: {
      can_view: true,
      can_create: false,
      can_edit: false,
      can_delete: false,
    },
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [availableIcons, setAvailableIcons] = useState([
    "HomeIcon",
    "LayoutDashboard",
    "Layers",
    "FileText",
    "Tag",
    "PanelRight",
    "Palette",
    "Package",
    "ShoppingBag",
    "Users",
    "Settings",
    "Star",
    "Phone",
    "Menu",
    "Activity",
    "Building"
  ]);
  const [parentMenus, setParentMenus] = useState([]);

  const itemsPerPage = 15;
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    // If admin isn't loaded or user isn't admin, redirect
    if (admin === null) {
      // Will be handled by AuthProvider's own redirect logic
      return;
    }
  }, [admin, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(MenuSchema),
  });

  const {
    data: menu,
    loading: isCreating,
    error: createError,
    fn: createMenuFn,
  } = useFetch(createMenu);

  const {
    data: updatedMenu,
    loading: isUpdating,
    error: updateError,
    fn: updateMenuFn,
  } = useFetch(updateMenu);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await getMenus({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setMenus(response.menus);
      setTotalPages(response.totalPages);

      // Extract parent menus for dropdown
      const parents = response.menus.filter(
        (m) => !m.is_submenu && (m.is_header || !m.parent_id)
      );
      setParentMenus(parents);
    } catch (error) {
      console.error("Failed to fetch menus:", error);
      toast.error("Failed to load menus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [searchQuery, currentPage, sortBy]);

  useEffect(() => {
    if (menu) {
      toast.success("Menu created successfully");
      setShowCreateModal(false);
      reset();
      fetchMenus();
    }
  }, [menu]);

  useEffect(() => {
    if (showCreateModal) {
      const loadParentMenus = async () => {
        try {
          const response = await getMenus({
            limit: 100, // Get more items to ensure we have all potential parents
          });
          
          // Filter out submenu items (shouldn't be parents)
          const potentialParents = response.menus.filter(menu => !menu.is_submenu);
          setParentMenus(potentialParents);
        } catch (error) {
          console.error("Failed to fetch potential parent menus:", error);
          toast.error("Failed to load parent menu options");
        }
      };
      
      loadParentMenus();
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (updatedMenu) {
      toast.success("Menu updated successfully");
      setShowEditModal(false);
      fetchMenus();
    }
  }, [updatedMenu]);

  const onSubmitCreate = async (data) => {
    await createMenuFn(data);
  };

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    await updateMenuFn(formData);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("order");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const toggleActive = async (id) => {
    try {
      setActionLoading(id);
      const result = await toggleMenuStatus(id);
      if (result.id) {
        fetchMenus();
        toast.success("Menu status updated");
      }
    } catch (error) {
      toast.error("Failed to update menu status");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteMenuById(deleteConfirmId);
      if (result.success) {
        toast.success("Menu deleted successfully");
        fetchMenus();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete menu");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async (item) => {
    setFormData({
      id: item.id,
      name: item.name,
      display_name: item.display_name,
      path: item.path,
      icon: item.icon || "",
      parent_id: item.parent_id || null,
      sort_order: item.sort_order,
      is_submenu: item.is_submenu,
      is_header: item.is_header,
    });
    
    // Fetch all potential parent menus (excluding the current menu being edited)
    try {
      const response = await getMenus({
        limit: 100, // Get more items to ensure we have all potential parents
      });
      
      // Filter out the current menu (can't be its own parent) and any submenu items (shouldn't be parents)
      const potentialParents = response.menus.filter(
        (menu) => menu.id !== item.id && !menu.is_submenu
      );
      
      setParentMenus(potentialParents);
    } catch (error) {
      console.error("Failed to fetch potential parent menus:", error);
      toast.error("Failed to load parent menu options");
    }
    
    setShowEditModal(true);
  };

  const handleManagePermissions = async (item) => {
    try {
      setActionLoading(item.id);

      // Fetch real admin data instead of using mock data
      const adminResult = await getAdmins2();
      const adminsData = adminResult.admins || [];

      setPermissionsData({
        menu_id: item.id,
        menu_name: item.display_name,
        admins: adminsData.filter((a) => a.user_type === "staff"), // Only staff need permissions
        selectedAdmin:
          adminsData.filter((a) => a.user_type === "staff")[0]?.id || null,
        permissions: {
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
        },
      });

      setShowPermissionsModal(true);
    } catch (error) {
      toast.error("Failed to load permissions data");
      console.error("Error fetching admin data:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const savePermissions = async () => {
    try {
      const { menu_id, selectedAdmin, permissions } = permissionsData;

      if (!menu_id || !selectedAdmin) {
        toast.error("Missing required data");
        return;
      }

      setActionLoading("permissions");

      const data = {
        admin_id: selectedAdmin,
        menu_id: menu_id,
        ...permissions,
      };

      const result = await setMenuPermission(data);

      if (result) {
        toast.success("Permissions updated successfully");
        setShowPermissionsModal(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update permissions");
    } finally {
      setActionLoading(null);
    }
  };

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="animate-pulse">
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-full"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/30 rounded mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="flex justify-center space-x-2">
              <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
              <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
              <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
            </div>
          </td>
        </tr>
      ));
  };

  const renderGridSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <Card
          key={`grid-skeleton-${index}`}
          className="border-gray-400 dark:border-blue-900/30 animate-pulse"
        >
          <CardHeader className="p-4">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
            <div className="h-6 w-24 bg-blue-100 dark:bg-blue-900/30 rounded mb-4"></div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end">
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-md mr-2"></div>
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-md mr-2"></div>
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
          </CardFooter>
        </Card>
      ));
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "HomeIcon":
        return <HomeIcon size={18} />;
      case "LayoutDashboard":
        return <LayoutGrid size={18} />;
      case "Layers":
        return <Layers size={18} />;
      case "FileText":
        return <FileText size={18} />;
      case "Tag":
        return <Tag size={18} />;
      case "PanelRight":
        return <PanelRight size={18} />;
      case "Palette":
        return <Palette size={18} />;
      case "Package":
        return <Package size={18} />;
      case "ShoppingBag":
        return <ShoppingBag size={18} />;
      case "Users":
        return <Users size={18} />;
      case "Settings":
        return <Settings size={18} />;
      case "Star":
        return <Star size={18} />;
      case "Phone":
        return <Phone size={18} />;
      case "Menu":
        return <MenuIcon size={18} />;
      case "Activity":
        return <Activity size={18} />;
      case "Building":
        return <Building size={18} />;
      default:
        return <MenuIcon size={18} />;
    }
  };

  const getMenuTypeLabel = (item) => {
    if (item.is_header) return "Section Header";
    if (item.is_submenu) return "Submenu Item";
    if (item.parent?.is_header) return "Parent Menu";
    return "Standard Menu";
  };

  const getMenuTypeColor = (item) => {
    if (item.is_header)
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/40";
    if (item.is_submenu)
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40";
    if (item.parent?.is_header)
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40";
  };

  // If not authenticated, don't render anything (AuthProvider will handle redirects)
  if (!admin) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <MenuIcon size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Menu Management
            </h1>
          </div>
          <Breadcrumb className="text-sm text-slate-500 dark:text-slate-400">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <HomeIcon size={14} />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/menu">Menus</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "grid" : "table")
                  }
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  {viewMode === "table" ? (
                    <LayoutGrid size={16} />
                  ) : (
                    <LayoutList size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{viewMode === "table" ? "Grid View" : "Table View"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className={`border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                    showFilters
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  <Filter size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus size={16} />
            New Menu
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="text-sm font-medium mb-1 block">
                  Search menus
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, display name, or path..."
                    className="pl-10 border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-1 block">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="order">Display Order</SelectItem>
                    <SelectItem value="name">Menu Name</SelectItem>
                    <SelectItem value="latest">Latest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 mt-2 md:mt-0"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === "table" ? (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50/80 dark:bg-blue-900/20 border-b border-gray-400 dark:border-blue-900/30">
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Menu
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Type
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Path
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : menus.length > 0 ? (
                  menus.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            {item.icon ? (
                              getIconComponent(item.icon)
                            ) : (
                              <MenuIcon size={18} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {item.display_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <Badge
                          variant="outline"
                          className={cn(getMenuTypeColor(item))}
                        >
                          {getMenuTypeLabel(item)}
                        </Badge>
                        {item.parent && !item.is_header && (
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Parent: {item.parent.display_name}
                          </div>
                        )}
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                          {item.path || "-"}
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex justify-center items-center">
                          <Switch
                            checked={item.status === "active"}
                            onCheckedChange={() => toggleActive(item.id)}
                            disabled={actionLoading === item.id}
                            className={cn(
                              item.status === "active"
                                ? "bg-blue-600"
                                : "bg-slate-200 dark:bg-slate-700"
                            )}
                          />
                          <span className="ml-2 text-sm">
                            {actionLoading === item.id ? (
                              <span className="text-slate-500 dark:text-slate-400">
                                Updating...
                              </span>
                            ) : item.status === "active" ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
                              >
                                Inactive
                              </Badge>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 h-9 w-9 p-0"
                          >
                            <Pencil size={16} />
                          </Button>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleManagePermissions(item)}
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === item.id}
                                  className="rounded-lg border-purple-200 hover:border-purple-300 dark:border-purple-900/50 dark:hover:border-purple-800 bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 h-9 w-9 p-0"
                                >
                                  {actionLoading === item.id ? (
                                    <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    <Lock size={16} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Manage Permissions</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Button
                            onClick={() => setDeleteConfirmId(item.id)}
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === item.id}
                            className="rounded-lg border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 h-9 w-9 p-0"
                          >
                            {actionLoading === item.id ? (
                              <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <MenuIcon
                            size={32}
                            className="text-blue-300 dark:text-blue-700"
                          />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          No menus found
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new menu or try changing your search filters
                        </p>
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          <Plus size={16} className="mr-1" />
                          Add New Menu
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            renderGridSkeletons()
          ) : menus.length > 0 ? (
            menus.map((item) => (
              <Card
                key={item.id}
                className="border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow overflow-hidden"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {item.icon ? (
                          getIconComponent(item.icon)
                        ) : (
                          <MenuIcon size={18} />
                        )}
                      </div>
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {item.display_name}
                      </CardTitle>
                    </div>
                    <Switch
                      checked={item.status === "active"}
                      onCheckedChange={() => toggleActive(item.id)}
                      disabled={actionLoading === item.id}
                      className={cn(
                        item.status === "active"
                          ? "bg-blue-600"
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  </div>
                  <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                    Name: {item.name}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant="outline"
                      className={cn("w-fit", getMenuTypeColor(item))}
                    >
                      {getMenuTypeLabel(item)}
                    </Badge>

                    {item.parent && !item.is_header && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Parent: {item.parent.display_name}
                      </div>
                    )}

                    {item.is_header ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Contains: {item.children?.length || 0} menus
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Path: {item.path || "-"}
                      </div>
                    )}
                  </div>
                </CardContent>

                <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                <CardFooter className="p-3 flex justify-end gap-2">
                  <Button
                    onClick={() => handleEdit(item)}
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 h-9 w-9 p-0"
                  >
                    <Pencil size={16} />
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleManagePermissions(item)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === item.id}
                          className="rounded-lg border-purple-200 hover:border-purple-300 dark:border-purple-900/50 dark:hover:border-purple-800 bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 h-9 w-9 p-0"
                        >
                          {actionLoading === item.id ? (
                            <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Lock size={16} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Manage Permissions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    onClick={() => setDeleteConfirmId(item.id)}
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === item.id}
                    className="rounded-lg border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 h-9 w-9 p-0"
                  >
                    {actionLoading === item.id ? (
                      <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-gray-400 dark:border-blue-900/30">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <MenuIcon
                  size={40}
                  className="text-blue-300 dark:text-blue-700"
                />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">
                No menus found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add a new menu or try changing your search filters
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add New Menu
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && menus.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={`${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  } border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30`}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className={
                      currentPage === i + 1
                        ? "bg-blue-600 hover:bg-blue-700 border-blue-600"
                        : "border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    }
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={`${
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  } border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Menu Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Create New Menu
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Add a new menu item to the navigation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4 grid grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="options">Advanced Options</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Menu Name (Internal)
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. products, dashboard, etc."
                    {...register("name")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                      errors.name
                        ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="display_name"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Display Name
                  </Label>
                  <Input
                    id="display_name"
                    placeholder="e.g. Products, Dashboard, etc."
                    {...register("display_name")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                      errors.display_name
                        ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.display_name && (
                    <p className="text-sm text-red-500">
                      {errors.display_name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="path"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Menu Path
                  </Label>
                  <Input
                    id="path"
                    placeholder="e.g. /admin/products"
                    {...register("path")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                      errors.path
                        ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.path && (
                    <p className="text-sm text-red-500">
                      {errors.path?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="icon"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Icon (Optional)
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("icon", value === "_none" ? null : value)
                    }
                    defaultValue="_none"
                  >
                    <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-400 dark:border-blue-900 max-h-60">
                      <SelectItem value="_none">No Icon</SelectItem>
                      {availableIcons.map((icon) => (
                        <SelectItem
                          key={icon}
                          value={icon}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {getIconComponent(icon)}
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="parent_id"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Parent Menu (Optional)
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue(
                        "parent_id",
                        value === "none" ? null : parseInt(value)
                      )
                    }
                    defaultValue="none"
                  >
                    <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                      <SelectValue placeholder="Select parent menu" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-400 dark:border-blue-900">
                      <SelectItem value="none">No Parent</SelectItem>
                      {parentMenus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id.toString()}>
                          {menu.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="sort_order"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Sort Order
                  </Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("sort_order", { valueAsNumber: true })}
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_header"
                      onCheckedChange={(checked) => {
                        setValue("is_header", !!checked);
                        if (checked) {
                          setValue("is_submenu", false);
                        }
                      }}
                      className="border-blue-200 dark:border-blue-900/50"
                    />
                    <Label
                      htmlFor="is_header"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Is Section Header
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_submenu"
                      onCheckedChange={(checked) => {
                        setValue("is_submenu", !!checked);
                        if (checked) {
                          setValue("is_header", false);
                        }
                      }}
                      className="border-blue-200 dark:border-blue-900/50"
                    />
                    <Label
                      htmlFor="is_submenu"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Is Submenu Item
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-1" />
                    Create Menu
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Edit Menu
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update the menu information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitUpdate} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4 grid grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="options">Advanced Options</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit_name"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Menu Name (Internal)
                  </Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_display_name"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Display Name
                  </Label>
                  <Input
                    id="edit_display_name"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_path"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Menu Path
                  </Label>
                  <Input
                    id="edit_path"
                    value={formData.path}
                    onChange={(e) =>
                      setFormData({ ...formData, path: e.target.value })
                    }
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_icon"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Icon
                  </Label>
                  <Select
                    value={formData.icon || "_none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        icon: value === "_none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-400 dark:border-blue-900 max-h-60">
                      <SelectItem value="_none">No Icon</SelectItem>
                      {availableIcons.map((icon) => (
                        <SelectItem
                          key={icon}
                          value={icon}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {getIconComponent(icon)}
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit_parent_id"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Parent Menu
                  </Label>
                  <Select
                    value={
                      formData.parent_id
                        ? formData.parent_id.toString()
                        : "none"
                    }
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        parent_id: value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                      <SelectValue placeholder="Select parent menu" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-400 dark:border-blue-900">
                      <SelectItem value="none">No Parent</SelectItem>
                      {parentMenus
                        .filter((menu) => menu.id !== formData.id) // Can't be its own parent
                        .map((menu) => (
                          <SelectItem key={menu.id} value={menu.id.toString()}>
                            {menu.display_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_sort_order"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Sort Order
                  </Label>
                  <Input
                    id="edit_sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit_is_header"
                      checked={formData.is_header}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          is_header: !!checked,
                          is_submenu: checked ? false : formData.is_submenu,
                        });
                      }}
                      className="border-blue-200 dark:border-blue-900/50"
                    />
                    <Label
                      htmlFor="edit_is_header"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Is Section Header
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit_is_submenu"
                      checked={formData.is_submenu}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          is_submenu: !!checked,
                          is_header: checked ? false : formData.is_header,
                        });
                      }}
                      className="border-blue-200 dark:border-blue-900/50"
                    />
                    <Label
                      htmlFor="edit_is_submenu"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Is Submenu Item
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {isUpdating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil size={16} className="mr-1" />
                    Update Menu
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog
        open={showPermissionsModal}
        onOpenChange={setShowPermissionsModal}
      >
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Manage Permissions: {permissionsData.menu_name}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Control which staff members can access this menu and what actions
              they can perform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="select_admin"
                className="text-slate-700 dark:text-slate-300"
              >
                Select Staff Member
              </Label>
              <Select
                value={permissionsData.selectedAdmin?.toString() || ""}
                onValueChange={(value) =>
                  setPermissionsData({
                    ...permissionsData,
                    selectedAdmin: parseInt(value),
                  })
                }
              >
                <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent className="border-gray-400 dark:border-blue-900">
                  {permissionsData.admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4 bg-blue-100 dark:bg-blue-900/30" />

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Permissions
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                    <Label
                      htmlFor="perm_view"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      View Access
                    </Label>
                  </div>
                  <Switch
                    id="perm_view"
                    checked={permissionsData.permissions.can_view}
                    onCheckedChange={(checked) =>
                      setPermissionsData({
                        ...permissionsData,
                        permissions: {
                          ...permissionsData.permissions,
                          can_view: checked,
                        },
                      })
                    }
                    className={cn(
                      permissionsData.permissions.can_view
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FilePlus
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                    <Label
                      htmlFor="perm_create"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Create Access
                    </Label>
                  </div>
                  <Switch
                    id="perm_create"
                    checked={permissionsData.permissions.can_create}
                    onCheckedChange={(checked) =>
                      setPermissionsData({
                        ...permissionsData,
                        permissions: {
                          ...permissionsData.permissions,
                          can_create: checked,
                        },
                      })
                    }
                    className={cn(
                      permissionsData.permissions.can_create
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileEdit
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                    <Label
                      htmlFor="perm_edit"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Edit Access
                    </Label>
                  </div>
                  <Switch
                    id="perm_edit"
                    checked={permissionsData.permissions.can_edit}
                    onCheckedChange={(checked) =>
                      setPermissionsData({
                        ...permissionsData,
                        permissions: {
                          ...permissionsData.permissions,
                          can_edit: checked,
                        },
                      })
                    }
                    className={cn(
                      permissionsData.permissions.can_edit
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileX
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                    <Label
                      htmlFor="perm_delete"
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Delete Access
                    </Label>
                  </div>
                  <Switch
                    id="perm_delete"
                    checked={permissionsData.permissions.can_delete}
                    onCheckedChange={(checked) =>
                      setPermissionsData({
                        ...permissionsData,
                        permissions: {
                          ...permissionsData.permissions,
                          can_delete: checked,
                        },
                      })
                    }
                    className={cn(
                      permissionsData.permissions.can_delete
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={savePermissions}
                disabled={
                  actionLoading === "permissions" ||
                  !permissionsData.selectedAdmin
                }
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500"
              >
                {actionLoading === "permissions" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Lock size={16} className="mr-1" />
                    Save Permissions
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent className="border border-red-200 dark:border-red-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-200">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This action cannot be undone. This will permanently delete the
              menu and any associated permissions.
              {menus.find((m) => m.id === deleteConfirmId)?.children?.length >
                0 && (
                <div className="mt-2 text-red-500 font-medium">
                  Warning: This menu has child items. Please delete them first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuPage;
