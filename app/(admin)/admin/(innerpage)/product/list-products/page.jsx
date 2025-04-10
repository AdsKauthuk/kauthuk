"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// UI Components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  CheckCircle2,
  DollarSign,
  Eye,
  Filter,
  HomeIcon,
  ImageIcon,
  IndianRupee,
  Layers,
  LayoutGrid,
  LayoutList,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Star, // Added Star icon
  Tag,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

// Helpers
import { truncateText } from "@/helpers/multifunction";
import { cn } from "@/lib/utils";

// Actions
import { getCategories2 } from "@/actions/category";
import {
  deleteProductById,
  getProducts,
  toggleProductFeatured,
} from "@/actions/product";
import { toast } from "sonner";

const ListProductsPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState(""); // Added featured filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [categories, setCategories] = useState([]);

  const itemsPerPage = 50;
  const router = useRouter();

  // Fetch categories for filters
  const fetchCategories = async () => {
    try {
      const response = await getCategories2();
      setCategories(response.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        category: categoryFilter === "all" ? "" : categoryFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        featured: featuredFilter === "all" ? "" : featuredFilter, // Added featured filter
      });
      setProducts(response.products || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    searchQuery,
    currentPage,
    sortBy,
    categoryFilter,
    statusFilter,
    featuredFilter, // Added to dependency array
  ]);

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setCategoryFilter("all");
    setStatusFilter("all");
    setFeaturedFilter("all"); // Reset featured filter
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteProductById(deleteConfirmId);
      if (result.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };

  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="animate-pulse">
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-full"></div>
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2 mt-2"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-24 mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-24 mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-16 mx-auto"></div>
            <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded w-20 mx-auto mt-2"></div>
          </td>
          <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-16 mx-auto"></div>
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
          className="border-gray-400 dark:border-blue-900/30 animate-pulse overflow-hidden"
        >
          <div className="w-full h-48 bg-blue-100 dark:bg-blue-900/30"></div>
          <CardHeader className="p-4">
            <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-1/4"></div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-2/3"></div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end">
            <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md mr-2"></div>
            <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
            <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
          </CardFooter>
        </Card>
      ));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Product Management
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
                <BreadcrumbLink href="/admin/product/list-products">
                  Products
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

          <Link href="/admin/product/add-product">
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus size={16} />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Search products
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

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.catName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Added Featured Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Featured</label>
                <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="yes">Featured</SelectItem>
                    <SelectItem value="no">Not Featured</SelectItem>
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
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    Product
                  </th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Image
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Price (₹)
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Stock
                  </th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">
                    Featured
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
                ) : products.length > 0 ? (
                  products.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.title}
                        </div>
                        {item.hasVariants && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Layers size={12} />
                            {item.ProductVariants?.length || 0} variants
                          </div>
                        )}
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex flex-col">
                          <span className="text-slate-700 dark:text-slate-300">
                            {item.SubCategory?.Category?.catName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.SubCategory?.subcategory}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        {item.ProductImages && item.ProductImages.length > 0 ? (
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden mx-auto border border-gray-400 dark:border-blue-900/30 shadow-sm">
                            <Image
                              src={`https://greenglow.in/kauthuk_test/${item.ProductImages[0].image_path}`}
                              fill
                              alt={item.title}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto border border-gray-400 dark:border-blue-900/30">
                            <ImageIcon
                              size={24}
                              className="text-blue-300 dark:text-blue-700"
                            />
                          </div>
                        )}
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium">
                          <IndianRupee
                            size={14}
                            className="mr-1 text-blue-500 dark:text-blue-400"
                          />
                          {formatPrice(item.price_rupees)}
                        </div>
                        <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <DollarSign size={10} className="mr-0.5" />
                          {formatPrice(item.price_dollars)}
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.stock_count}
                        </div>
                        <div className="text-xs mt-1">
                          {item.stock_status === "yes" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                            >
                              In Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                            >
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {item.featured === "yes" ? (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 border-none">
                              <Star size={12} className="mr-1" />
                              Featured
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                            >
                              Standard
                            </Badge>
                          )}
                          <Button
                            onClick={async () => {
                              setActionLoading(`feature-${item.id}`);
                              try {
                                const result = await toggleProductFeatured(
                                  item.id,
                                  item.featured || "no" // Default to "no" if undefined
                                );
                                if (result.success) {
                                  toast.success(result.message);
                                  fetchProducts();
                                } else {
                                  toast.error(result.message);
                                }
                              } catch (error) {
                                toast.error(
                                  "An error occurred while updating featured status"
                                );
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === `feature-${item.id}`}
                            className="rounded-lg border-gray-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 text-xs"
                          >
                            {actionLoading === `feature-${item.id}` ? (
                              <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1"></span>
                            ) : (
                              <Star
                                size={12}
                                className={
                                  item.featured === "yes"
                                    ? "text-yellow-500 fill-yellow-500 mr-1"
                                    : "text-gray-400 mr-1"
                                }
                              />
                            )}
                            {item.featured === "yes"
                              ? "Remove featured"
                              : "Make featured"}
                          </Button>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        {item.status === "active" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 border-none">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                          >
                            Inactive
                          </Badge>
                        )}
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => setPreviewProduct(item)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>

                          <Button
                            onClick={() =>
                              router.push(
                                `/admin/product/edit-product/${item.id}`
                              )
                            }
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
                      colSpan={8}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <Package
                            size={32}
                            className="text-blue-300 dark:text-blue-700"
                          />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          No products found
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new product or try changing your search filters
                        </p>
                        <Link href="/admin/product/add-product">
                          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            <Plus size={16} className="mr-1" />
                            Create New Product
                          </Button>
                        </Link>
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
          ) : products.length > 0 ? (
            products.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow"
              >
                {/* Product Image */}
                <div className="relative w-full h-48 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-400 dark:border-blue-900/30">
                  {item.ProductImages && item.ProductImages.length > 0 ? (
                    <Image
                      src={`https://greenglow.in/kauthuk_test/${item.ProductImages[0].image_path}`}
                      fill
                      alt={item.title}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon
                        size={48}
                        className="text-blue-300 dark:text-blue-700"
                      />
                    </div>
                  )}

                  {/* Status and Featured badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {item.status === "active" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      >
                        Inactive
                      </Badge>
                    )}
                    
                    {item.featured === "yes" && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-none">
                        <Star size={12} className="mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {truncateText(item.title, 40)}
                    </CardTitle>
                    {item.hasVariants && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1"
                      >
                        <Layers size={12} />
                        {item.ProductVariants?.length || 0}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Tag
                      size={12}
                      className="text-blue-500 dark:text-blue-400"
                    />
                    {item.SubCategory?.Category?.catName} &gt;{" "}
                    {item.SubCategory?.subcategory}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                    {truncateText(item.description, 80)}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <IndianRupee
                        size={14}
                        className="text-blue-500 dark:text-blue-400"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatPrice(item.price_rupees)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {item.stock_status === "yes" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                        >
                          <CheckCircle2 size={12} className="mr-1" />
                          In Stock ({item.stock_count})
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                        >
                          <XCircle size={12} className="mr-1" />
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {item.free_shipping === "yes" && (
                      <span className="flex items-center">
                        <Truck size={12} className="mr-1" />
                        Free Shipping
                      </span>
                    )}
                    {item.cod === "yes" && (
                      <span className="flex items-center">
                        <ShoppingCart size={12} className="mr-1" />
                        COD Available
                      </span>
                    )}
                  </div>
                </CardContent>

                <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                <CardFooter className="p-4 pt-3 flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPreviewProduct(item)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                    
                    <Button
                      onClick={async () => {
                        setActionLoading(`feature-${item.id}`);
                        try {
                          const result = await toggleProductFeatured(
                            item.id,
                            item.featured || "no"
                          );
                          if (result.success) {
                            toast.success(result.message);
                            fetchProducts();
                          } else {
                            toast.error(result.message);
                          }
                        } catch (error) {
                          toast.error(
                            "An error occurred while updating featured status"
                          );
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === `feature-${item.id}`}
                      className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                    >
                      {actionLoading === `feature-${item.id}` ? (
                        <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1"></span>
                      ) : (
                        <Star size={16} className={item.featured === "yes" ? "text-yellow-500 fill-yellow-500 mr-1" : "text-gray-400 mr-1"} />
                      )}
                      {item.featured === "yes" ? "Unfeature" : "Feature"}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        router.push(`/admin/product/edit-product/${item.id}`)
                      }
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
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-gray-400 dark:border-blue-900/30">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Package
                  size={40}
                  className="text-blue-300 dark:text-blue-700"
                />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">
                No products found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add a new product or try changing your search filters
              </p>
              <Link href="/admin/product/add-product">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                  <Plus size={16} className="mr-1" />
                  Create New Product
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
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

              <PaginationItem>
                <span className="flex h-9 items-center justify-center text-sm font-medium px-4 text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>

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

      {/* Product Preview Dialog */}
      <Dialog
        open={!!previewProduct}
        onOpenChange={(open) => !open && setPreviewProduct(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border border-blue-200 dark:border-blue-900/50">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl text-slate-800 dark:text-slate-200">
              <span>{previewProduct?.title || "Product Preview"}</span>
              <div className="flex gap-2">
                {previewProduct?.status === "active" ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                  >
                    Inactive
                  </Badge>
                )}
                {previewProduct?.featured === "yes" && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Star size={12} className="mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center"
              >
                <Tag size={12} className="mr-1" />
                {previewProduct?.SubCategory?.Category?.catName} &gt;{" "}
                {previewProduct?.SubCategory?.subcategory}
              </Badge>
              {previewProduct?.hasVariants && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center"
                >
                  <Layers size={12} className="mr-1" />
                  Has Variants
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Product Images Gallery */}
          {previewProduct?.ProductImages &&
            previewProduct.ProductImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 my-3">
                {previewProduct.ProductImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative rounded-lg overflow-hidden border border-gray-400 dark:border-blue-900/30",
                      index === 0 ? "col-span-4 h-56" : "h-24"
                    )}
                  >
                    <Image
                      src={`https://greenglow.in/kauthuk_test/${image.image_path}`}
                      fill
                      alt={`Product image ${index + 1}`}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Price Information
              </h3>
              <div className="mt-1 space-y-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-gray-400 dark:border-blue-900/30">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Base Price:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewProduct?.base_price} ₹
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Price (₹):
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewProduct?.price_rupees} ₹
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Price ($):
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    ${previewProduct?.price_dollars}
                  </span>
                </div>
                {previewProduct?.tax && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Tax:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {previewProduct.tax}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Inventory Information
              </h3>
              <div className="mt-1 space-y-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-gray-400 dark:border-blue-900/30">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Stock:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewProduct?.stock_count} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Stock Status:
                  </span>
                  <span className="font-medium">
                    {previewProduct?.stock_status === "yes" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                      >
                        In Stock
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                      >
                        Out of Stock
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Quantity Limit:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewProduct?.quantity_limit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    HSN Code:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewProduct?.hsn_code || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Featured:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewProduct?.featured === "yes" ? (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Star size={12} className="mr-1" />
                        Yes
                      </Badge>
                    ) : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Shipping Information
            </h3>
            <div className="mt-1 flex flex-wrap gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-gray-400 dark:border-blue-900/30">
              <div className="flex items-center">
                <Truck
                  size={16}
                  className="text-blue-500 dark:text-blue-400 mr-2"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  {previewProduct?.free_shipping === "yes"
                    ? "Free Shipping"
                    : "Paid Shipping"}
                </span>
              </div>
              <div className="flex items-center">
                <ShoppingCart
                  size={16}
                  className="text-blue-500 dark:text-blue-400 mr-2"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  {previewProduct?.cod === "yes" ? "COD Available" : "No COD"}
                </span>
              </div>
              {previewProduct?.weight && (
                <div className="flex items-center">
                  <PackageOpen
                    size={16}
                    className="text-blue-500 dark:text-blue-400 mr-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Weight: {previewProduct.weight} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Description
            </h3>
            <div className="mt-1 text-slate-700 dark:text-slate-300 border border-gray-400 dark:border-blue-900/30 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 max-h-40 overflow-y-auto">
              {previewProduct?.description}
            </div>
          </div>

          {/* Product Attributes */}
          {previewProduct?.ProductAttributes &&
            previewProduct.ProductAttributes.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Product Attributes
                </h3>
                <Accordion type="single" collapsible className="mt-1">
                  <AccordionItem
                    value="attributes"
                    className="border-gray-400 dark:border-blue-900/30"
                  >
                    <AccordionTrigger className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                      View All Attributes
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {previewProduct.ProductAttributes.map((attr) => (
                          <div
                            key={attr.id}
                            className="border border-gray-400 dark:border-blue-900/30 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10"
                          >
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {attr.Attribute.display_name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {attr.ProductAttributeValues.map((attrValue) => (
                                <div
                                  key={attrValue.id}
                                  className="flex justify-between items-center"
                                >
                                  <span>
                                    {attrValue.AttributeValue.display_value}
                                  </span>
                                  {(attrValue.price_adjustment_rupees ||
                                    attrValue.price_adjustment_dollars) && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                      {attrValue.price_adjustment_rupees &&
                                        `+₹${attrValue.price_adjustment_rupees}`}
                                      {attrValue.price_adjustment_dollars &&
                                        ` / +$${attrValue.price_adjustment_dollars}`}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

          {/* Product Variants */}
          {previewProduct?.hasVariants &&
            previewProduct.ProductVariants &&
            previewProduct.ProductVariants.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Product Variants ({previewProduct.ProductVariants.length})
                </h3>
                <Accordion type="single" collapsible className="mt-1">
                  <AccordionItem
                    value="variants"
                    className="border-gray-400 dark:border-blue-900/30"
                  >
                    <AccordionTrigger className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                      View All Variants
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {previewProduct.ProductVariants.map((variant) => (
                          <Card
                            key={variant.id}
                            className="p-3 shadow-sm border-gray-400 dark:border-blue-900/30"
                          >
                            <div className="flex flex-col md:flex-row gap-3">
                              {/* Variant image if available */}
                              {variant.ProductImages &&
                                variant.ProductImages.length > 0 && (
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-400 dark:border-blue-900/30">
                                    <Image
                                      src={`https://greenglow.in/kauthuk_test/${variant.ProductImages[0].image_path}`}
                                      fill
                                      alt="Variant image"
                                      className="object-cover"
                                    />
                                  </div>
                                )}

                              <div className="flex-1">
                                <div className="flex justify-between">
                                <div className="font-medium text-slate-700 dark:text-slate-300">
                                    {variant.is_default && (
                                      <Badge
                                        variant="outline"
                                        className="mr-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                      >
                                        Default
                                      </Badge>
                                    )}
                                    SKU: {variant.sku}
                                  </div>
                                  <div className="flex items-center">
                                    {variant.stock_status === "yes" ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                      >
                                        In Stock ({variant.stock_count})
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">
                                      Price (₹):
                                    </span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {variant.price_rupees} ₹
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">
                                      Price ($):
                                    </span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      ${variant.price_dollars}
                                    </span>
                                  </div>
                                  {variant.weight && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-600 dark:text-slate-400">
                                        Weight:
                                      </span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {variant.weight} kg
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Variant attributes */}
                                {variant.VariantAttributeValues &&
                                  variant.VariantAttributeValues.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {variant.VariantAttributeValues.map(
                                        (attrValue) => (
                                          <Badge
                                            key={attrValue.id}
                                            variant="outline"
                                            className="bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
                                          >
                                            {
                                              attrValue.AttributeValue.Attribute
                                                .display_name
                                            }
                                            :{" "}
                                            {
                                              attrValue.AttributeValue
                                                .display_value
                                            }
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

          {/* SEO Information */}
          {(previewProduct?.meta_title ||
            previewProduct?.meta_keywords ||
            previewProduct?.meta_description) && (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                SEO Information
              </h3>
              <Accordion type="single" collapsible className="mt-1">
                <AccordionItem
                  value="seo"
                  className="border-gray-400 dark:border-blue-900/30"
                >
                  <AccordionTrigger className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                    View SEO Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-gray-400 dark:border-blue-900/30">
                      {previewProduct?.meta_title && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Meta Title:
                          </span>
                          <p className="mt-1 text-slate-600 dark:text-slate-400">
                            {previewProduct.meta_title}
                          </p>
                        </div>
                      )}
                      {previewProduct?.meta_keywords && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Meta Keywords:
                          </span>
                          <p className="mt-1 text-slate-600 dark:text-slate-400">
                            {previewProduct.meta_keywords}
                          </p>
                        </div>
                      )}
                      {previewProduct?.meta_description && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Meta Description:
                          </span>
                          <p className="mt-1 text-slate-600 dark:text-slate-400">
                            {previewProduct.meta_description}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Terms and Highlights */}
          {(previewProduct?.terms_condition || previewProduct?.highlights) && (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Additional Information
              </h3>
              <Accordion type="single" collapsible className="mt-1">
                <AccordionItem
                  value="additional"
                  className="border-gray-400 dark:border-blue-900/30"
                >
                  <AccordionTrigger className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                    View Additional Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {previewProduct?.highlights && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Highlights:
                          </span>
                          <div className="mt-1 text-slate-600 dark:text-slate-400 border border-gray-400 dark:border-blue-900/30 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                            {previewProduct.highlights}
                          </div>
                        </div>
                      )}
                      {previewProduct?.terms_condition && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Terms & Conditions:
                          </span>
                          <div className="mt-1 text-slate-600 dark:text-slate-400 border border-gray-400 dark:border-blue-900/30 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                            {previewProduct.terms_condition}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <DialogFooter className="mt-4">
            <div className="mr-auto">
              <Button
                onClick={async () => {
                  setActionLoading(`feature-${previewProduct?.id}`);
                  try {
                    const result = await toggleProductFeatured(
                      previewProduct?.id,
                      previewProduct?.featured || "no"
                    );
                    if (result.success) {
                      toast.success(result.message);
                      // Update the preview product
                      setPreviewProduct({
                        ...previewProduct,
                        featured: result.product.featured,
                      });
                      // Refresh the product list
                      fetchProducts();
                    } else {
                      toast.error(result.message);
                    }
                  } catch (error) {
                    toast.error(
                      "An error occurred while updating featured status"
                    );
                  } finally {
                    setActionLoading(null);
                  }
                }}
                variant="outline"
                disabled={actionLoading === `feature-${previewProduct?.id}`}
                className={`border-gray-200 ${
                  previewProduct?.featured === "yes"
                    ? "hover:border-yellow-300 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                    : "hover:border-blue-300 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                }`}
              >
                {actionLoading === `feature-${previewProduct?.id}` ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <Star
                    size={16}
                    className={
                      previewProduct?.featured === "yes"
                        ? "fill-current mr-2"
                        : "mr-2"
                    }
                  />
                )}
                {previewProduct?.featured === "yes"
                  ? "Remove Featured Status"
                  : "Mark as Featured"}
              </Button>
            </div>

            <Button
              onClick={() => setPreviewProduct(null)}
              variant="outline"
              className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              Close
            </Button>
            {previewProduct && (
              <Button
                onClick={() => {
                  router.push(
                    `/admin/product/edit-product/${previewProduct.id}`
                  );
                  setPreviewProduct(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Pencil size={16} className="mr-1" />
                Edit Product
              </Button>
            )}
          </DialogFooter>
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
              product and all its related data including variants, attributes,
              and images.
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

export default ListProductsPage;