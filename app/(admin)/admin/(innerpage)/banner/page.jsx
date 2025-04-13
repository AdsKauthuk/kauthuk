"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import * as z from "zod";

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
  Image as ImageIcon,
  HomeIcon,
  CheckCircle,
  XCircle,
  Upload,
  FileImage,
  Layout,
  Link as LinkIcon,
  Layers,
  ArrowRight,
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

// Actions - You'll need to create these
import {
  createBanner,
  deleteBannerById,
  getBanners,
  toggleBanner,
  updateBanner,
} from "@/actions/banner";
import { toast } from "sonner";

// Validation schema for banner
const BannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  buttonTitle: z.string().optional(),
  buttonLink: z.string().optional(),
  displayPage: z.enum(["home", "detail", "success"], {
    required_error: "Please select a display page",
  }),
  priority: z.coerce.number().int().min(0).default(0),
  image: z.any().optional(),
});

const BannerPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [filterPage, setFilterPage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    subtitle: "",
    buttonTitle: "",
    buttonLink: "",
    displayPage: "",
    priority: 0,
    image: null,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  const itemsPerPage = 15;
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm({
    resolver: zodResolver(BannerSchema),
    defaultValues: {
      priority: 0,
    },
  });

  const {
    data: banner,
    loading: isCreating,
    error: createError,
    fn: createBannerFN,
  } = useFetch(createBanner);

  const {
    data: updatedBanner,
    loading: isUpdating,
    error: updateError,
    fn: updateBannerFN,
  } = useFetch(updateBanner);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await getBanners({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        displayPage: filterPage || undefined,
      });
      setBanners(response.banners);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [searchQuery, currentPage, sortBy, filterPage]);

  useEffect(() => {
    if (banner) {
      toast.success("Banner created successfully");
      setShowCreateModal(false);
      reset();
      setImagePreview(null);
      fetchBanners();
    }
  }, [banner]);

  useEffect(() => {
    if (updatedBanner) {
      toast.success("Banner updated successfully");
      setShowEditModal(false);
      setEditImagePreview(null);
      fetchBanners();
    }
  }, [updatedBanner]);

  // Watch for image changes in create form
  const watchImage = watch("image");
  useEffect(() => {
    if (watchImage && watchImage[0]) {
      const file = watchImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [watchImage]);

  const onSubmitCreate = async (data) => {
    await createBannerFN(data);
  };

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    // Convert FormData for server action
    const formDataObj = new FormData();
    formDataObj.append("id", formData.id);
    formDataObj.append("title", formData.title);
    formDataObj.append("subtitle", formData.subtitle || "");
    formDataObj.append("buttonTitle", formData.buttonTitle || "");
    formDataObj.append("buttonLink", formData.buttonLink || "");
    formDataObj.append("displayPage", formData.displayPage);
    formDataObj.append("priority", formData.priority);

    if (formData.image && formData.image[0]) {
      formDataObj.append("image", formData.image[0]);
    }

    await updateBannerFN(formDataObj);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("priority");
    setFilterPage("");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const toggleActive = async (id) => {
    try {
      setActionLoading(id);
      const result = await toggleBanner(id);
      if (result.id) {
        fetchBanners();
        toast.success("Banner status updated");
      }
    } catch (error) {
      toast.error("Failed to update banner status");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteBannerById(deleteConfirmId);
      if (result.success) {
        toast.success("Banner deleted successfully");
        fetchBanners();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete banner");
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
      title: item.title,
      subtitle: item.subtitle || "",
      buttonTitle: item.buttonTitle || "",
      buttonLink: item.buttonLink || "",
      displayPage: item.displayPage,
      priority: item.priority,
      image: null,
    });
    setEditImagePreview(
      item.image ? `https://greenglow.in/kauthuk_test/${item.image}` : null
    );
    setShowEditModal(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, image: e.target.files });
    }
  };

  const getPageBadgeColor = (page) => {
    switch (page) {
      case "home":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40";
      case "detail":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40";
      case "success":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/40";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-900/40";
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
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2 mx-auto"></div>
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
          <div className="h-40 bg-blue-100 dark:bg-blue-900/30"></div>
          <CardHeader className="p-4">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2"></div>
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

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Banner Management
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
                <BreadcrumbLink href="/admin/banner">
                  Banners
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
            New Banner
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">
                  Search banners
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by title..."
                    className="pl-10 border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-1 block">
                  Filter by page
                </label>
                <Select value={filterPage} onValueChange={setFilterPage}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="All pages" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="">All pages</SelectItem>
                    <SelectItem value="home">Homepage</SelectItem>
                    <SelectItem value="detail">Detail Page</SelectItem>
                    <SelectItem value="success">Success Page</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="priority">Priority (High to Low)</SelectItem>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
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
                    Banner Information
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Display Page
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
                ) : banners.length > 0 ? (
                  banners.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center">
                          {item.image && (
                            <div className="h-16 w-28 mr-3 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                              <img
                                src={`https://greenglow.in/kauthuk_test/${item.image}`}
                                alt={item.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder-image.jpg";
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {item.subtitle}
                              </div>
                            )}
                            {item.buttonTitle && (
                              <div className="mt-1 flex items-center gap-1">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs py-0 h-5 rounded-sm"
                                >
                                  {item.buttonTitle}
                                </Badge>
                                {item.buttonLink && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    <ArrowRight size={10} className="inline" /> {item.buttonLink.substring(0, 20)}{item.buttonLink.length > 20 ? '...' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <Badge
                          variant="outline"
                          className={getPageBadgeColor(item.displayPage)}
                        >
                          {item.displayPage === "home" && "Homepage"}
                          {item.displayPage === "detail" && "Detail Page"}
                          {item.displayPage === "success" && "Success Page"}
                        </Badge>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Priority: {item.priority}
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
                      colSpan={4}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <Layers
                            size={32}
                            className="text-blue-300 dark:text-blue-700"
                          />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          No banners found
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new banner or try changing your search filters
                        </p>
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          <Plus size={16} className="mr-1" />
                          Add New Banner
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
  ) : banners.length > 0 ? (
    banners.map((item) => (
      <Card
        key={item.id}
        className="border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow overflow-hidden"
      >
        <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 relative">
          {item.image ? (
            <img
              src={`https://greenglow.in/kauthuk_test/${item.image}`}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder-image.jpg";
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon
                size={48}
                className="text-gray-300 dark:text-gray-600"
              />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className={`${getPageBadgeColor(item.displayPage)} bg-opacity-90 backdrop-blur-sm`}
            >
              {item.displayPage === "home" && "Homepage"}
              {item.displayPage === "detail" && "Detail Page"}
              {item.displayPage === "success" && "Success Page"}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {item.title}
              </CardTitle>
              {item.subtitle && (
                <CardDescription className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.subtitle}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40">
                Priority: {item.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1">
          <div className="flex flex-wrap gap-2 mb-2">
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
            <span className="text-sm">
              {actionLoading === item.id ? (
                <span className="text-slate-500 dark:text-slate-400">
                  Updating...
                </span>
              ) : (
                <Badge
                  variant="outline"
                  className={
                    item.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                      : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
                  }
                >
                  {item.status === "active" ? "Active" : "Inactive"}
                </Badge>
              )}
            </span>
          </div>

          {item.buttonTitle && (
            <div className="flex items-center gap-2 mt-3 text-xs">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                {item.buttonTitle}
              </Badge>
              {item.buttonLink && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                  <LinkIcon size={10} className="inline mr-1" />
                  {item.buttonLink}
                </span>
              )}
            </div>
          )}
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Created {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </CardContent>

        <Separator className="bg-blue-100 dark:bg-blue-900/30" />

        <CardFooter className="p-4 flex justify-end gap-2">
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
        </CardFooter>
      </Card>
    ))
  ) : (
    <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-gray-400 dark:border-blue-900/30">
      <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
        <Layers size={40} className="text-blue-300 dark:text-blue-700" />
      </div>
      <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">
        No banners found
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
        Add a new banner or try changing your search filters
      </p>
      <Button
        onClick={() => setShowCreateModal(true)}
        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        <Plus size={16} className="mr-1" />
        Add New Banner
      </Button>
    </div>
  )}
</div>
      )}

      {/* Pagination */}
      {!loading && banners.length > 0 && totalPages > 1 && (
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

      {/* Create Banner Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Create New Banner
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Add a new banner to be displayed on your website
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-slate-700 dark:text-slate-300"
              >
                Banner Title*
              </Label>
              <Input
                id="title"
                placeholder="Enter banner title"
                {...register("title")}
                className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                  errors.title
                    ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title?.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="subtitle"
                className="text-slate-700 dark:text-slate-300"
              >
                Subtitle (Optional)
              </Label>
              <Input
                id="subtitle"
                placeholder="Enter banner subtitle"
                {...register("subtitle")}
                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="buttonTitle"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Button Text (Optional)
                </Label>
                <Input
                  id="buttonTitle"
                  placeholder="e.g., Shop Now"
                  {...register("buttonTitle")}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="buttonLink"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Button Link (Optional)
                </Label>
                <Input
                  id="buttonLink"
                  placeholder="e.g., /products/featured"
                  {...register("buttonLink")}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="displayPage"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Display Page*
                </Label>
                <Controller
                  name="displayPage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger
                        className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                          errors.displayPage
                            ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select page" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-400 dark:border-blue-900">
                        <SelectItem value="home">Homepage</SelectItem>
                        <SelectItem value="detail">Detail Page</SelectItem>
                        <SelectItem value="success">Success Page</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.displayPage && (
                  <p className="text-sm text-red-500">{errors.displayPage?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="priority"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Priority (Optional)
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  placeholder="0 (lowest) to 100 (highest)"
                  {...register("priority")}
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Higher numbers appear first (default: 0)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="image"
                className="text-slate-700 dark:text-slate-300"
              >
                Banner Image (Optional)
              </Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <Input
                      id="image"
                      type="file"
                      accept="image/png, image/jpeg"
                      {...register("image")}
                      className="border-0 p-0"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Recommended size: 1200×400px. Supported formats: JPG, PNG. Maximum size: 2MB.
                    </p>
                  </div>
                </div>

                {/* Image preview */}
                <div className="w-full md:w-1/3">
                  <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                        <ImageIcon size={40} className="mb-2" />
                        <span className="text-xs">Image preview</span>
                      </div>
                    )}
                  </div>
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
                    Create Banner
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Banner Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Edit Banner
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update the banner information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit-title"
                className="text-slate-700 dark:text-slate-300"
              >
                Banner Title*
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-subtitle"
                className="text-slate-700 dark:text-slate-300"
              >
                Subtitle (Optional)
              </Label>
              <Input
                id="edit-subtitle"
                value={formData.subtitle || ""}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-buttonTitle"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Button Text (Optional)
                </Label>
                <Input
                  id="edit-buttonTitle"
                  value={formData.buttonTitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonTitle: e.target.value })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-buttonLink"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Button Link (Optional)
                </Label>
                <Input
                  id="edit-buttonLink"
                  value={formData.buttonLink || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonLink: e.target.value })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-displayPage"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Display Page*
                </Label>
                <Select
                  value={formData.displayPage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, displayPage: value })
                  }
                >
                  <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="home">Homepage</SelectItem>
                    <SelectItem value="detail">Detail Page</SelectItem>
                    <SelectItem value="success">Success Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-priority"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Priority
                </Label>
                <Input
                  id="edit-priority"
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value),
                    })
                  }
                  className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Higher numbers appear first
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-image"
                className="text-slate-700 dark:text-slate-300"
              >
                Banner Image
              </Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <Input
                      id="edit-image"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleEditImageChange}
                      className="border-0 p-0"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Leave empty to keep current image. Recommended size: 1200×400px.
                    </p>
                  </div>
                </div>

                {/* Image preview */}
                <div className="w-full md:w-1/3">
                  <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {editImagePreview ? (
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-image.jpg";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                        <ImageIcon size={40} className="mb-2" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
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
                    Update Banner
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
              banner from your website.
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

export default BannerPage;