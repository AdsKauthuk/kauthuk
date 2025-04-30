"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { format } from "date-fns";

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
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  HomeIcon,
  CheckCircle,
  XCircle,
  PercentIcon,
  DollarSign,
  Ticket,
  CalendarIcon,
  Tag as TagIcon,
  Users,
  AlertCircle,
  Info,
  ShoppingCart,
  Clock,
  Repeat,
  ArrowUpDown,
  FileCheck,
  User,
  Layers,
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { CouponSchema } from "@/lib/validators";
import { toast } from "sonner";

// Actions
import {
  createCoupon,
  deleteCouponById,
  getCoupons,
  toggleCouponStatus,
  updateCoupon,
} from "@/actions/coupon";

// Helper function to format dates
function formatDate(date) {
  if (!date) return 'Never';
  return format(new Date(date), "MMM d, yyyy");
}

const CouponPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    min_order_value: 0,
    max_discount: 0,
    start_date: new Date(),
    end_date: null,
    usage_limit: null,
    user_usage_limit: null,
    is_first_order: false,
    product_ids: "",
    category_ids: "",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const itemsPerPage = 15;
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(CouponSchema),
    defaultValues: {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: 0,
      max_discount: 0,
      usage_limit: null,
      user_usage_limit: null,
      is_first_order: false,
      product_ids: "",
      category_ids: "",
    }
  });

  // Watching discount type to conditionally show max discount
  const watchDiscountType = watch("discount_type");

  const {
    data: coupon,
    loading: isCreating,
    error: createError,
    fn: createCouponFn,
  } = useFetch(createCoupon);

  const {
    data: updatedCoupon,
    loading: isUpdating,
    error: updateError,
    fn: updateCouponFn,
  } = useFetch(updateCoupon);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await getCoupons({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        status: statusFilter
      });
      setCoupons(response.coupons);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchQuery, currentPage, sortBy, statusFilter]);

  useEffect(() => {
    if (coupon) {
      toast.success("Coupon created successfully");
      setShowCreateModal(false);
      reset();
      fetchCoupons();
    }
  }, [coupon]);

  useEffect(() => {
    if (updatedCoupon) {
      toast.success("Coupon updated successfully");
      setShowEditModal(false);
      fetchCoupons();
    }
  }, [updatedCoupon]);

  const onSubmitCreate = async (data) => {
    await createCouponFn(data);
  };

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    await updateCouponFn(formData);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setStatusFilter("all");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const toggleStatus = async (id) => {
    try {
      setActionLoading(id);
      const result = await toggleCouponStatus(id);
      if (result.id) {
        fetchCoupons();
        toast.success("Coupon status updated");
      }
    } catch (error) {
      toast.error("Failed to update coupon status");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteCouponById(deleteConfirmId);
      if (result.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      code: item.code,
      description: item.description || "",
      discount_type: item.discount_type,
      discount_value: parseFloat(item.discount_value),
      min_order_value: item.min_order_value ? parseFloat(item.min_order_value) : 0,
      max_discount: item.max_discount ? parseFloat(item.max_discount) : 0,
      start_date: item.start_date ? new Date(item.start_date) : new Date(),
      end_date: item.end_date ? new Date(item.end_date) : null,
      usage_limit: item.usage_limit,
      user_usage_limit: item.user_usage_limit,
      is_first_order: item.is_first_order,
      product_ids: item.product_ids || "",
      category_ids: item.category_ids || "",
    });
    setShowEditModal(true);
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
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/4"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/4"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/30 rounded mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="flex justify-center space-x-2">
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
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-6 w-24 bg-blue-100 dark:bg-blue-900/30 rounded mb-4"></div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end">
            <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md mr-2"></div>
            <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
          </CardFooter>
        </Card>
      ));
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}%${coupon.max_discount ? ` (max ${coupon.currency === "INR" ? "₹" : "$"}${coupon.max_discount})` : ''}`;
    } else {
      return `${coupon.currency === "INR" ? "₹" : "$"}${coupon.discount_value}`;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Ticket size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Coupon Management
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
                <BreadcrumbLink href="/admin/coupons">
                  Coupons
                </BreadcrumbLink>
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
            New Coupon
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Search coupons
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by code or description..."
                    className="pl-10 border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="all">All Coupons</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="code_asc">Code (A-Z)</SelectItem>
                    <SelectItem value="code_desc">Code (Z-A)</SelectItem>
                    <SelectItem value="expiry_soon">Expiry Soon</SelectItem>
                    <SelectItem value="discount_high">Highest Discount</SelectItem>
                    <SelectItem value="usage_high">Most Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 mt-2"
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
                    Code
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Discount
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Min. Order
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Expiry
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
                ) : coupons.length > 0 ? (
                  coupons.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center">
                          <div className="h-8 w-8 mr-3 rounded-md overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            {item.discount_type === "percentage" ? 
                              <PercentIcon size={16} /> : 
                              <DollarSign size={16} />
                            }
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {item.code}
                            </div>
                            {item.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                            {item.is_first_order && (
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/40">
                                  First Order Only
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center">
                          <Badge variant="outline" className={cn(
                            "font-medium",
                            item.discount_type === "percentage"
                              ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/40"
                              : "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                          )}>
                            {getDiscountDisplay(item)}
                          </Badge>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        {item.min_order_value ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40">
                            {item.currency === "INR" ? "₹" : "$"}{item.min_order_value}
                          </Badge>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 text-sm">None</span>
                        )}
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center">
                          <span className={cn(
                            "text-sm",
                            item.end_date && new Date(item.end_date) < new Date() 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-slate-600 dark:text-slate-400"
                          )}>
                            {item.end_date ? formatDate(item.end_date) : 'Never'}
                          </span>
                          {item.end_date && new Date(item.end_date) < new Date() && (
                            <Badge variant="outline" className="ml-2 bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex justify-center items-center">
                          <Switch
                            checked={item.status === "active"}
                            onCheckedChange={() => toggleStatus(item.id)}
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
                            className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          >
                            <Pencil size={16} className="mr-1" />
                            Edit
                          </Button>

                          <Button
                            onClick={() => setDeleteConfirmId(item.id)}
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === item.id}
                            className="rounded-lg border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          >
                            {actionLoading === item.id ? (
                              <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-1"></span>
                            ) : (
                              <Trash2 size={16} className="mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <Ticket
                            size={32}
                            className="text-blue-300 dark:text-blue-700"
                          />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          No coupons found
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new coupon or try changing your search filters
                        </p>
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          <Plus size={16} className="mr-1" />
                          Add New Coupon
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
          ) : coupons.length > 0 ? (
            coupons.map((item) => (
              <Card
                key={item.id}
                className="border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow overflow-hidden"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                      <div className="h-7 w-7 mr-2 rounded-md overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {item.discount_type === "percentage" ? 
                          <PercentIcon size={14} /> : 
                          <DollarSign size={14} />
                        }
                      </div>
                      {item.code}
                    </CardTitle>
                    <Switch
                      checked={item.status === "active"}
                      onCheckedChange={() => toggleStatus(item.id)}
                      disabled={actionLoading === item.id}
                      className={cn(
                        item.status === "active"
                          ? "bg-blue-600"
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {item.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium",
                        item.discount_type === "percentage"
                          ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/40"
                          : "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                      )}
                    >
                      {getDiscountDisplay(item)}
                    </Badge>
                    
                    <Badge
                      variant="outline"
                      className={cn(
                        item.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
                      )}
                    >
                      {actionLoading === item.id
                        ? "Updating..."
                        : item.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </Badge>

                    {item.is_first_order && (
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/40">
                        First Order Only
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {item.min_order_value > 0 && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <ShoppingCart size={12} className="mr-1" />
                        <span>Min: {item.currency === "INR" ? "₹" : "$"}{item.min_order_value}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <CalendarIcon size={12} className="mr-1" />
                      <span className={cn(
                        item.end_date && new Date(item.end_date) < new Date() 
                          ? "text-red-600 dark:text-red-400" 
                          : ""
                      )}>
                        {item.end_date ? formatDate(item.end_date) : 'No expiry'}
                      </span>
                    </div>
                    
                    {item.usage_limit && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <Repeat size={12} className="mr-1" />
                        <span>Limit: {item.usage_limit} uses</span>
                      </div>
                    )}
                    
                    {item.user_usage_limit && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <User size={12} className="mr-1" />
                        <span>User limit: {item.user_usage_limit}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                <CardFooter className="p-4 flex justify-between">
                  <Button
                    onClick={() => toggleStatus(item.id)}
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading === item.id}
                    className="p-0 text-blue-600 dark:text-blue-400 hover:bg-transparent hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {actionLoading === item.id ? (
                      <>
                        <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1"></span>
                        Updating...
                      </>
                    ) : item.status === "active" ? (
                      <>
                        <XCircle size={16} className="mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-1" />
                        Activate
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 h-9 w-9 p-0"
                    >
                      <Pencil size={16} />
                    </Button>

                    <Button
                      onClick={() => setDeleteConfirmId(item.id)}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === item.id}
                      className="rounded-lg border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 h-9 w-9 p-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-gray-400 dark:border-blue-900/30">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Ticket size={40} className="text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">
                No coupons found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add a new coupon or try changing your search filters
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add New Coupon
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && coupons.length > 0 && totalPages > 1 && (
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

      {/* Create Coupon Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md md:max-w-xl border-gray-400 dark:border-blue-900/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Create New Coupon
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Add a new discount coupon for your customers
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Coupon Code*
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. SUMMER20"
                  {...register("code")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 uppercase ${
                    errors.code
                      ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="e.g. Summer sale discount"
                  {...register("description")}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Discount Type & Value*
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="discount_type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="percentage" 
                          id="percentage" 
                          className="text-blue-600 border-blue-300 dark:border-blue-700"
                        />
                        <Label htmlFor="percentage" className="cursor-pointer flex items-center">
                          <PercentIcon size={14} className="mr-1" />
                          Percentage
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="fixed" 
                          id="fixed" 
                          className="text-blue-600 border-blue-300 dark:border-blue-700"
                        />
                        <Label htmlFor="fixed" className="cursor-pointer flex items-center">
                          <DollarSign size={14} className="mr-1" />
                          Fixed Amount
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={watchDiscountType === "percentage" ? "e.g. 10" : "e.g. 100"}
                    {...register("discount_value", { valueAsNumber: true })}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                      errors.discount_value
                        ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {watchDiscountType === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>
              {errors.discount_value && (
                <p className="text-sm text-red-500">{errors.discount_value?.message}</p>
              )}
            </div>

            {watchDiscountType === "percentage" && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="max_discount"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Maximum Discount Amount
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          For percentage discounts, set a maximum amount that can be discounted.
                          Leave at 0 for no limit.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="max_discount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Maximum discount amount (optional)"
                    {...register("max_discount", { valueAsNumber: true })}
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">$</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center">
                <Label
                  htmlFor="min_order_value"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Minimum Order Value
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Minimum cart value required to use this coupon.
                        Leave at 0 for no minimum.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="min_order_value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Minimum order amount (optional)"
                  {...register("min_order_value", { valueAsNumber: true })}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">$</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="start_date"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Start Date
                  </Label>
                </div>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-blue-200 dark:border-blue-900/50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="end_date"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    End Date
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Leave empty for a coupon that never expires
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-blue-200 dark:border-blue-900/50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>No expiration</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="usage_limit"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Usage Limit
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Total number of times this coupon can be used.
                          Leave empty for unlimited uses.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="usage_limit"
                  type="number"
                  min="0"
                  placeholder="Total usage limit (optional)"
                  {...register("usage_limit", { 
                    setValueAs: v => v === "" ? null : parseInt(v, 10)
                  })}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="user_usage_limit"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Per-User Limit
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Number of times each user can use this coupon.
                          Leave empty for unlimited uses per user.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="user_usage_limit"
                  type="number"
                  min="0"
                  placeholder="Per-user limit (optional)"
                  {...register("user_usage_limit", { 
                    setValueAs: v => v === "" ? null : parseInt(v, 10) 
                  })}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-start space-x-3 py-2">
              <Controller
                name="is_first_order"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_first_order"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 text-blue-600 border-blue-300 dark:border-blue-700 rounded focus:ring-blue-500"
                  />
                )}
              />
              <div>
                <label
                  htmlFor="is_first_order"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  First-order customers only
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This coupon will only be valid for customers making their first purchase
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="product_ids"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Product Restrictions
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Optional. Enter product IDs separated by commas to restrict
                          this coupon to specific products.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="product_ids"
                  placeholder="e.g. 1,2,3 (optional)"
                  {...register("product_ids")}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter product IDs separated by commas
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="category_ids"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Category Restrictions
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Optional. Enter category IDs separated by commas to restrict
                          this coupon to specific categories.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="category_ids"
                  placeholder="e.g. 1,2,3 (optional)"
                  {...register("category_ids")}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter category IDs separated by commas
                </p>
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
                    Create Coupon
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md md:max-w-xl border-gray-400 dark:border-blue-900/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Edit Coupon
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update the coupon details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="editCode"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Coupon Code*
                </Label>
                <Input
                  id="editCode"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="editDescription"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Description
                </Label>
                <Input
                  id="editDescription"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Discount Type & Value*
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RadioGroup
                  value={formData.discount_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="percentage" 
                      id="editPercentage" 
                      className="text-blue-600 border-blue-300 dark:border-blue-700"
                    />
                    <Label htmlFor="editPercentage" className="cursor-pointer flex items-center">
                      <PercentIcon size={14} className="mr-1" />
                      Percentage
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="fixed" 
                      id="editFixed" 
                      className="text-blue-600 border-blue-300 dark:border-blue-700"
                    />
                    <Label htmlFor="editFixed" className="cursor-pointer flex items-center">
                      <DollarSign size={14} className="mr-1" />
                      Fixed Amount
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                    }
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {formData.discount_type === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>
            </div>

            {formData.discount_type === "percentage" && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editMaxDiscount"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Maximum Discount Amount
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          For percentage discounts, set a maximum amount that can be discounted.
                          Leave at 0 for no limit.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="editMaxDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })
                    }
                    className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">$</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center">
                <Label
                  htmlFor="editMinOrderValue"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Minimum Order Value
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Minimum cart value required to use this coupon.
                        Leave at 0 for no minimum.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="editMinOrderValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_order_value || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || 0 })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">$</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editStartDate"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Start Date
                  </Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-blue-200 dark:border-blue-900/50"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(new Date(formData.start_date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, start_date: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editEndDate"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    End Date
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Leave empty for a coupon that never expires
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-blue-200 dark:border-blue-900/50"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(new Date(formData.end_date), "PPP") : <span>No expiration</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-2 flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData({ ...formData, end_date: null })}
                        className="text-xs"
                      >
                        Clear date
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={formData.end_date ? new Date(formData.end_date) : undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, end_date: date })
                      }
                      initialFocus
                      disabled={(date) => 
                        formData.start_date && date < new Date(formData.start_date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editUsageLimit"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Usage Limit
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Total number of times this coupon can be used.
                          Leave empty for unlimited uses.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="editUsageLimit"
                  type="number"
                  min="0"
                  value={formData.usage_limit || ""}
                  onChange={(e) =>{
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      usage_limit: val === "" ? null : parseInt(val)
                    });
                  }}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editUserUsageLimit"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Per-User Limit
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Number of times each user can use this coupon.
                          Leave empty for unlimited uses per user.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="editUserUsageLimit"
                  type="number"
                  min="0"
                  value={formData.user_usage_limit || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData,
                      user_usage_limit: val === "" ? null : parseInt(val)
                    });
                  }}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-start space-x-3 py-2">
              <Checkbox
                id="editIsFirstOrder"
                checked={formData.is_first_order}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_first_order: !!checked })
                }
                className="mt-1 text-blue-600 border-blue-300 dark:border-blue-700 rounded focus:ring-blue-500"
              />
              <div>
                <label
                  htmlFor="editIsFirstOrder"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  First-order customers only
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This coupon will only be valid for customers making their first purchase
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editProductIds"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Product Restrictions
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Optional. Enter product IDs separated by commas to restrict
                          this coupon to specific products.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="editProductIds"
                  value={formData.product_ids || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, product_ids: e.target.value })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter product IDs separated by commas
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="editCategoryIds"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Category Restrictions
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Optional. Enter category IDs separated by commas to restrict
                          this coupon to specific categories.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="editCategoryIds"
                  value={formData.category_ids || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category_ids: e.target.value })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter category IDs separated by commas
                </p>
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
                    Update Coupon
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
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
              coupon and it will no longer be available for use.
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
              {actionLoading === deleteConfirmId ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CouponPage;