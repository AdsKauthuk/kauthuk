"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

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
  Tag,
  HomeIcon,
  CheckCircle,
  XCircle,
  Upload,
  FileImage,
  Image,
  ImageIcon,
  ArrowUpDown,
  Link as LinkIcon,
  Info,
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";
import { CategorySchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

// Actions
import {
  createCategory,
  deleteCategoryById,
  getCategories,
  toggleCategory,
  updateCategory,
} from "@/actions/category";
import { toast } from "sonner";

// Helper function to generate slug preview (client-side version, must match server-side)
function generateSlugPreview(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // Remove non-word chars
    .replace(/\-\-+/g, "-")   // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "")       // Trim hyphens from start
    .replace(/-+$/, "");      // Trim hyphens from end
}

const CategoryPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    image: null,
    banner: null,
    order_no: 0,
    slug: "",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editBannerPreview, setEditBannerPreview] = useState(null);
  const [slugPreview, setSlugPreview] = useState("");
  const [editSlugPreview, setEditSlugPreview] = useState("");

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
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      order_no: 0,
    }
  });

  const {
    data: category,
    loading: isCreating,
    error: createError,
    fn: createCategoryFN,
  } = useFetch(createCategory);

  const {
    data: updatedCategory,
    loading: isUpdating,
    error: updateError,
    fn: updateCategoryFN,
  } = useFetch(updateCategory);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setCategories(response.categories);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [searchQuery, currentPage, sortBy]);

  useEffect(() => {
    if (category) {
      toast.success("Category created successfully");
      setShowCreateModal(false);
      reset();
      setImagePreview(null);
      setBannerPreview(null);
      setSlugPreview("");
      fetchCategories();
    }
  }, [category]);

  useEffect(() => {
    if (updatedCategory) {
      toast.success("Category updated successfully");
      setShowEditModal(false);
      setEditImagePreview(null);
      setEditBannerPreview(null);
      setEditSlugPreview("");
      fetchCategories();
    }
  }, [updatedCategory]);

  // Generate slug preview from title
  const watchTitle = watch("title");
  useEffect(() => {
    if (watchTitle) {
      setSlugPreview(generateSlugPreview(watchTitle));
    } else {
      setSlugPreview("");
    }
  }, [watchTitle]);

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

  // Watch for banner changes in create form
  const watchBanner = watch("banner");
  useEffect(() => {
    if (watchBanner && watchBanner[0]) {
      const file = watchBanner[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [watchBanner]);

  // Generate slug preview for edit form
  useEffect(() => {
    if (formData.title) {
      setEditSlugPreview(generateSlugPreview(formData.title));
    } else {
      setEditSlugPreview("");
    }
  }, [formData.title]);

  const onSubmitCreate = async (data) => {
    await createCategoryFN(data);
  };

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    // Convert FormData for server action
    const formDataObj = new FormData();
    formDataObj.append("id", formData.id);
    formDataObj.append("title", formData.title);
    formDataObj.append("description", formData.description || "");
    formDataObj.append("order_no", formData.order_no.toString());

    if (formData.image && formData.image[0]) {
      formDataObj.append("image", formData.image[0]);
    }

    if (formData.banner && formData.banner[0]) {
      formDataObj.append("banner", formData.banner[0]);
    }

    await updateCategoryFN(formDataObj);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const toggleActive = async (id) => {
    try {
      setActionLoading(id);
      const result = await toggleCategory(id);
      if (result.id) {
        fetchCategories();
        toast.success("Category status updated");
      }
    } catch (error) {
      toast.error("Failed to update category status");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteCategoryById(deleteConfirmId);
      if (result.success) {
        toast.success("Category deleted successfully");
        fetchCategories();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete category");
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
      title: item.catName,
      description: item.description || "",
      image: null,
      banner: null,
      order_no: item.order_no || 0,
      slug: item.slug || "",
    });
    setEditImagePreview(
      item.image ? `https://greenglow.in/kauthuk_test/${item.image}` : null
    );
    setEditBannerPreview(
      item.banner ? `https://greenglow.in/kauthuk_test/${item.banner}` : null
    );
    setEditSlugPreview(item.slug || generateSlugPreview(item.catName));
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

  const handleEditBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, banner: e.target.files });
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

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Tag size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Category Management
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
                <BreadcrumbLink href="/admin/category">
                  Categories
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
            New Category
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
                  Search categories
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
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                    <SelectItem value="order_asc">Display Order (Low-High)</SelectItem>
                    <SelectItem value="order_desc">Display Order (High-Low)</SelectItem>
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
                    Title
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Slug
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-center">
                      <span>Order</span>
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Show On Home
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : categories.length > 0 ? (
                  categories.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center">
                          {item.image && (
                            <div className="h-10 w-10 mr-3 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                              <img
                                src={`https://greenglow.in/kauthuk_test/${item.image}`}
                                alt={item.catName}
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
                              {item.catName}
                            </div>
                           
                            {item.banner && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40">
                                  Has Banner
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          <LinkIcon size={14} className="mr-1 text-slate-400" />
                          {item.slug || generateSlugPreview(item.catName)}
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                          {item.order_no !== undefined ? item.order_no : 0}
                        </Badge>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex justify-center items-center">
                          <Switch
                            checked={item.showHome === "active"}
                            onCheckedChange={() => toggleActive(item.id)}
                            disabled={actionLoading === item.id}
                            className={cn(
                              item.showHome === "active"
                                ? "bg-blue-600"
                                : "bg-slate-200 dark:bg-slate-700"
                            )}
                          />
                          <span className="ml-2 text-sm">
                            {actionLoading === item.id ? (
                              <span className="text-slate-500 dark:text-slate-400">
                                Updating...
                              </span>
                            ) : item.showHome === "active" ? (
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
                      colSpan={5}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <Tag
                            size={32}
                            className="text-blue-300 dark:text-blue-700"
                          />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          No categories found
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new category or try changing your search filters
                        </p>
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          <Plus size={16} className="mr-1" />
                          Add New Category
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
          ) : categories.length > 0 ? (
            categories.map((item) => (
              <Card
                key={item.id}
                className="border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow overflow-hidden"
              >
                <div className="h-36 overflow-hidden bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                  {item.image ? (
                    <img
                      src={`https://greenglow.in/kauthuk_test/${item.image}`}
                      alt={item.catName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <FileImage
                        size={48}
                        className="text-gray-300 dark:text-gray-600"
                      />
                    </div>
                  )}
                </div>

                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {item.catName}
                    </CardTitle>
                    <Switch
                      checked={item.showHome === "active"}
                      onCheckedChange={() => toggleActive(item.id)}
                      disabled={actionLoading === item.id}
                      className={cn(
                        item.showHome === "active"
                          ? "bg-blue-600"
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  </div>
                 
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        item.showHome === "active"
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
                      )}
                    >
                      {actionLoading === item.id
                        ? "Updating..."
                        : item.showHome === "active"
                        ? "Shown on Homepage"
                        : "Hidden from Homepage"}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                      <ArrowUpDown size={12} className="mr-1" />
                      Order: {item.order_no !== undefined ? item.order_no : 0}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <LinkIcon size={12} className="mr-1 text-slate-400" />
                    <span className="truncate">{item.slug || generateSlugPreview(item.catName)}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>

                <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                <CardFooter className="p-4 flex justify-between">
                  <Button
                    onClick={() => toggleActive(item.id)}
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
                    ) : item.showHome === "active" ? (
                      <>
                        <XCircle size={16} className="mr-1" />
                        Hide from Home
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-1" />
                        Show on Home
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
                <Tag size={40} className="text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">
                No categories found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add a new category or try changing your search filters
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add New Category
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && categories.length > 0 && totalPages > 1 && (
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
      {/* Create Category Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Create New Category
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Add a new category to organize your content
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-slate-700 dark:text-slate-300"
              >
                Category Title
              </Label>
              <Input
                id="title"
                placeholder="Enter category title"
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
              <Label htmlFor="slug-preview" className="flex items-center text-slate-700 dark:text-slate-300">
                <LinkIcon size={14} className="mr-1" />
                Slug Preview
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">The slug is automatically generated from the title and will be used in URLs. The final slug may be slightly different to ensure uniqueness.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="border rounded-md bg-gray-50 dark:bg-gray-800 p-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
                <span className="text-slate-400">/</span>
                {slugPreview || <span className="italic text-slate-400">Generated from title</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_no" className="flex items-center text-slate-700 dark:text-slate-300">
                <ArrowUpDown size={14} className="mr-1" />
                Display Order
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Controls the order of categories in listings. Lower numbers appear first.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="order_no"
                type="number"
                placeholder="0"
                {...register("order_no", { valueAsNumber: true })}
                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
              />
            </div>

            

            <Tabs defaultValue="thumbnail" className="w-full">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger
                  value="thumbnail"
                  className="flex items-center gap-1"
                >
                  <FileImage size={14} />
                  Thumbnail Image
                </TabsTrigger>
                <TabsTrigger value="banner" className="flex items-center gap-1">
                  <ImageIcon size={14} />
                  Banner Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="thumbnail" className="space-y-2">
                <Label
                  htmlFor="image"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Upload size={14} />
                  Category Thumbnail (Optional)
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
                        Supported formats: JPG, PNG. Maximum size: 2MB.
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
                          <FileImage size={40} className="mb-2" />
                          <span className="text-xs">Thumbnail preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="banner" className="space-y-2">
                <Label
                  htmlFor="banner"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Upload size={14} />
                  Category Banner (Optional)
                </Label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <Input
                        id="banner"
                        type="file"
                        accept="image/png, image/jpeg"
                        {...register("banner")}
                        className="border-0 p-0"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Banner image for category page (1200×300px recommended).
                        Supported formats: JPG, PNG.
                      </p>
                    </div>
                  </div>

                  {/* Banner preview */}
                  <div className="w-full md:w-1/3">
                    <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      {bannerPreview ? (
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                          <ImageIcon size={40} className="mb-2" />
                          <span className="text-xs">Banner preview</span>
                        </div>
                      )}
                    </div>
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
                    Create Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md border-gray-400 dark:border-blue-900/30">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Edit Category
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update the category information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="editTitle"
                className="text-slate-700 dark:text-slate-300"
              >
                Category Title
              </Label>
              <Input
                id="editTitle"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
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
              <Label htmlFor="edit-slug-preview" className="flex items-center text-slate-700 dark:text-slate-300">
                <LinkIcon size={14} className="mr-1" />
                Slug Preview
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">The slug will be regenerated from the title if you change it. The final slug may be slightly different to ensure uniqueness.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="border rounded-md bg-gray-50 dark:bg-gray-800 p-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
                <span className="text-slate-400">/</span>
                {editSlugPreview || <span className="italic text-slate-400">Generated from title</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="editOrderNo"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <ArrowUpDown size={14} className="mr-1" />
                Display Order
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Controls the order of categories in listings. Lower numbers display first.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="editOrderNo"
                type="number"
                min="0"
                value={formData.order_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_no: parseInt(e.target.value) || 0,
                  })
                }
                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
              />
            </div>

            

            <Tabs defaultValue="thumbnail" className="w-full">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger
                  value="thumbnail"
                  className="flex items-center gap-1"
                >
                  <FileImage size={14} />
                  Thumbnail Image
                </TabsTrigger>
                <TabsTrigger value="banner" className="flex items-center gap-1">
                  <ImageIcon size={14} />
                  Banner Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="thumbnail" className="space-y-2">
                <Label
                  htmlFor="editImage"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Upload size={14} />
                  Category Thumbnail
                </Label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <Input
                        id="editImage"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleEditImageChange}
                        className="border-0 p-0"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Leave empty to keep current image. Supported formats:
                        JPG, PNG.
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
                          <FileImage size={40} className="mb-2" />
                          <span className="text-xs">No thumbnail</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="banner" className="space-y-2">
                <Label
                  htmlFor="editBanner"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Upload size={14} />
                  Category Banner
                </Label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <Input
                        id="editBanner"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleEditBannerChange}
                        className="border-0 p-0"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Leave empty to keep current banner. Banner image for
                        category page (1200×300px recommended).
                      </p>
                    </div>
                  </div>

                  {/* Banner preview */}
                  <div className="w-full md:w-1/3">
                    <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      {editBannerPreview ? (
                        <img
                          src={editBannerPreview}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                          <ImageIcon size={40} className="mb-2" />
                          <span className="text-xs">No banner</span>
                        </div>
                      )}
                    </div>
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
                    Update Category
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
              category and may affect related products.
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

export default CategoryPage;