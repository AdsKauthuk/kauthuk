"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { motion } from "framer-motion";
import MDEditor from "@uiw/react-md-editor";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Filter,
  LayoutGrid,
  LayoutList,
  BookOpen,
  Calendar,
  Eye,
  ChevronRight,
  ImageIcon,
  HomeIcon,
  FileText,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";
import { truncateText } from "@/helpers/multifunction";
import { cn } from "@/lib/utils";

// Actions
import { deleteBlogById, getBlogs } from "@/actions/blog";
import { toast } from "sonner";

const ListBlogsPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [previewBlog, setPreviewBlog] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const itemsPerPage = 15;
  const router = useRouter();

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await getBlogs({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setBlogs(response.blogs);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [searchQuery, currentPage, sortBy]);

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteBlogById(deleteConfirmId);
      if (result.success) {
        toast.success("Blog deleted successfully");
        fetchBlogs();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete blog");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };

  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
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
          <div className="flex justify-center space-x-2">
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
          </div>
        </td>
      </tr>
    ));
  };

  const renderGridSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={`grid-skeleton-${index}`} className="border-gray-400 dark:border-blue-900/30 animate-pulse overflow-hidden">
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
              <FileText size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Blog Management</h1>
          </div>
          <Breadcrumb className="text-sm text-slate-500 dark:text-slate-400">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  <HomeIcon size={14} />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/blog/list-blogs">
                  Blogs
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
                  onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                  variant="outline" 
                  size="sm"
                  className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  {viewMode === "table" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
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
                    showFilters ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-blue-600 dark:text-blue-400"
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
          
          <Link href="/admin/blog/add-blog">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus size={16} />
              New Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="text-sm font-medium mb-1 block">Search blogs</label>
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
                <label className="text-sm font-medium mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
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
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Title</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Description</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Image</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Date</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : blogs.length > 0 ? (
                  blogs.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.title}
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="text-slate-600 dark:text-slate-400">
                          {truncateText(item.description, 80)}
                          <Button
                            onClick={() => setPreviewBlog(item)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto mt-1 flex items-center"
                          >
                            <Eye size={14} className="mr-1" />
                            <span className="text-xs">View full content</span>
                          </Button>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        {item.image ? (
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden mx-auto border border-gray-400 dark:border-blue-900/30 shadow-sm">
                            <Image
                              src={`https://greenglow.in/kauthuk_test/${item.image}`}
                              fill
                              alt={item.title}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto border border-gray-400 dark:border-blue-900/30">
                            <ImageIcon size={24} className="text-blue-300 dark:text-blue-700" />
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Clock size={14} className="text-blue-500 dark:text-blue-400" />
                          <span className="text-slate-600 dark:text-slate-400">{format(item.date, "LLL dd, y")}</span>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/admin/blog/edit-blog/${item.id}`)}
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
                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <BookOpen size={32} className="text-blue-300 dark:text-blue-700" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No blogs found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new blog post or try changing your search filters
                        </p>
                        <Link href="/admin/blog/add-blog">
                          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            <Plus size={16} className="mr-1" />
                            Create New Blog
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
          ) : blogs.length > 0 ? (
            blogs.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow"
              >
                {console.log("`https://greenglow.in/kauthuk_test/${item.image}`")}
                {/* Blog Image */}
                <div className="relative w-full h-48 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-400 dark:border-blue-900/30">
                  {item.image ? (
                    <Image
                      src={`https://greenglow.in/kauthuk_test/${item.image}`}
                      fill
                      alt={item.title}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-blue-300 dark:text-blue-700" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {truncateText(item.title, 40)}
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
                      <Clock size={12} />
                      {format(item.date, "MMM dd")}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
                    {format(item.date, "MMMM dd, yyyy")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {truncateText(item.description, 120)}
                  </p>
                  <Button
                    onClick={() => setPreviewBlog(item)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto mt-2 flex items-center"
                  >
                    <Eye size={14} className="mr-1" />
                    <span className="text-xs">Read more</span>
                  </Button>
                </CardContent>
                
                <Separator className="bg-blue-100 dark:bg-blue-900/30" />
                
                <CardFooter className="p-4 flex justify-between">
                  <Button
                    onClick={() => router.push(`/admin/blog/edit-blog/${item.id}`)}
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
                <BookOpen size={40} className="text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">No blogs found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add a new blog post or try changing your search filters
              </p>
              <Link href="/admin/blog/add-blog">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                  <Plus size={16} className="mr-1" />
                  Create New Blog
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && blogs.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30`}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className={currentPage === i + 1 ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : "border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Blog Preview Dialog */}
      <Dialog open={!!previewBlog} onOpenChange={(open) => !open && setPreviewBlog(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border border-blue-200 dark:border-blue-900/50">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 dark:text-slate-200">{previewBlog?.title || "Blog Preview"}</DialogTitle>
            <DialogDescription className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar size={14} />
              {previewBlog?.date && format(previewBlog.date, "LLLL dd, yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          {previewBlog?.image && (
            <div className="relative w-full h-56 my-4 overflow-hidden rounded-lg border border-gray-400 dark:border-blue-900/30 shadow-sm">
              <Image
                src={`https://greenglow.in/kauthuk_test/${previewBlog.image}`}
                fill
                alt={previewBlog.title}
                className="object-cover"
              />
            </div>
          )}
          
          <div className="markdown-preview bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-400 dark:border-blue-900/30">
            <MDEditor.Markdown
              source={previewBlog?.description || ""}
              style={{ whiteSpace: "pre-wrap" }}
            />
          </div>
          
          <DialogFooter className="mt-4 flex gap-2">
            <Button 
              onClick={() => setPreviewBlog(null)}
              variant="outline"
              className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              Close
            </Button>
            {previewBlog && (
              <Button 
                onClick={() => {
                  router.push(`/admin/blog/edit-blog/${previewBlog.id}`);
                  setPreviewBlog(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Pencil size={16} className="mr-1" />
                Edit Blog
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="border border-red-200 dark:border-red-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-200">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This action cannot be undone. This will permanently delete the blog post and all its content.
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

export default ListBlogsPage;