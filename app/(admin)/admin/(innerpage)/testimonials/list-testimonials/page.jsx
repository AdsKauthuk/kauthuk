"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// UI Components
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
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  Eye,
  Filter,
  HomeIcon,
  LayoutGrid,
  LayoutList,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Star,
  Trash2,
  User
} from "lucide-react";

// Hooks and Utilities
import { truncateText } from "@/helpers/multifunction";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Server Actions
import { deleteTestimonialById, getTestimonials, updateTestimonialStatus } from "@/actions/testimonial";

const ListTestimonialsPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating_high");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);

  const itemsPerPage = 9;
  const router = useRouter();

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await getTestimonials({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        status: statusFilter
      });
      setTestimonials(response.testimonials);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [searchQuery, currentPage, sortBy, statusFilter]);

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("rating_high");
    setStatusFilter("all");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      setActionLoading(deleteConfirmId);
      const result = await deleteTestimonialById(deleteConfirmId);
      if (result.success) {
        toast.success("Testimonial deleted successfully");
        fetchTestimonials();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete testimonial");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      setStatusLoading(id);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const result = await updateTestimonialStatus(id, newStatus);
      
      if (result.success) {
        toast.success(`Testimonial ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
        // Update the local state to avoid refetching
        setTestimonials(prev => 
          prev.map(item => 
            item.id === id ? {...item, status: newStatus} : item
          )
        );
      } else {
        toast.error(result.message || "Status update failed");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
    } finally {
      setStatusLoading(null);
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating 
          ? "text-yellow-400 fill-yellow-400" 
          : "text-slate-300 dark:text-slate-600"
        }
      />
    ));
  };

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-4 w-4 bg-blue-100 dark:bg-blue-900/30 rounded-full"></div>
              ))}
            </div>
          </div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto"></div>
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
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-24"></div>
                <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-32"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full"></div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
          <div className="flex mt-4 space-x-1">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-4 w-4 bg-blue-100 dark:bg-blue-900/30 rounded-full"></div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-2 flex justify-between">
          <div className="h-8 w-16 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
          <div className="flex space-x-2">
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
            <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
          </div>
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
              <MessageSquare size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Testimonial Management</h1>
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
                <BreadcrumbLink href="/admin/testimonials">
                  Testimonials
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
          
          <Link href="/admin/testimonials/add-testimonial">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus size={16} />
              New Testimonial
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search testimonials</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or content..."
                    className="pl-10 border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="rating_high">Highest Rating</SelectItem>
                    <SelectItem value="rating_low">Lowest Rating</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-400 dark:border-blue-900">
                    <SelectItem value="all">All Testimonials</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
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
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Customer</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Photo</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Location</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Rating</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : testimonials.length > 0 ? (
                  testimonials.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {item.name}
                          </div>
                          <div className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                            {truncateText(item.description, 50)}
                            <Button
                              onClick={() => router.push(`/admin/testimonials/view-testimonial/${item.id}`)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto ml-1"
                            >
                              <Eye size={14} className="mr-1" />
                              <span className="text-xs">View</span>
                            </Button>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        
                          <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border border-gray-400 dark:border-blue-900/30">
                            <User size={20} className="text-blue-300 dark:text-blue-700" />
                          </div>
                    

                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex items-center text-slate-600 dark:text-slate-400">
                          <MapPin size={14} className="mr-1 text-slate-400" />
                          {item.location}
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex justify-center">
                          <div className="flex space-x-1">
                            {renderStars(item.rating)}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30 text-center">
                        <div className="flex justify-center items-center">
                          <Switch
                            checked={item.status === "active"}
                            onCheckedChange={() => toggleStatus(item.id, item.status)}
                            disabled={statusLoading === item.id}
                            className={cn(
                              item.status === "active" ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                            )}
                          />
                          <span className="ml-2 text-sm">
                            {statusLoading === item.id ? (
                              <span className="text-slate-500 dark:text-slate-400">Updating...</span>
                            ) : item.status === "active" ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800">
                                Inactive
                              </Badge>
                            )}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/admin/testimonials/edit-testimonial/${item.id}`)}
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
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <MessageSquare size={32} className="text-blue-300 dark:text-blue-700" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No testimonials found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add a new testimonial or try changing your search filters
                        </p>
                        <Link href="/admin/testimonials/add-testimonial">
                          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            <Plus size={16} className="mr-1" />
                            Add New Testimonial
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
          ) : testimonials.length > 0 ? (
            testimonials.map((item) => (
              <Card 
                key={item.id} 
                className={cn(
                  "overflow-hidden border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow",
                  item.status === "inactive" && "bg-slate-50/50 dark:bg-slate-800/50 opacity-75"
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between">
                    <div className="flex gap-3 items-start">
                      
                        <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center border border-gray-400 dark:border-blue-900/30">
                          <User size={20} className="text-blue-300 dark:text-blue-700" />
                        </div>
                     
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </CardTitle>
                        <CardDescription className="text-sm flex items-center text-slate-600 dark:text-slate-400">
                          <MapPin size={12} className="mr-1" />
                          {item.location}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={item.status === "active"}
                      onCheckedChange={() => toggleStatus(item.id, item.status)}
                      disabled={statusLoading === item.id}
                      className={cn(
                        "mt-1",
                        item.status === "active" ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  <div className="bg-blue-50/70 dark:bg-blue-900/10 p-3 rounded-lg relative">
                    <Quote className="absolute text-blue-200 dark:text-blue-900/50" size={40} />
                    <p className="text-sm text-slate-600 dark:text-slate-400 relative z-10 pl-7 pt-2">
                      {truncateText(item.description, 120)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-1">
                      {renderStars(item.rating)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        item.status === "active" 
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
                      )}
                    >
                      {statusLoading === item.id ? "Updating..." : item.status}
                    </Badge>
                  </div>
                </CardContent>
                
                <Separator className="bg-blue-100 dark:bg-blue-900/30" />
                
                <CardFooter className="p-4 flex justify-between">
                  <Button
                    onClick={() => router.push(`/admin/testimonials/view-testimonial/${item.id}`)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 dark:text-blue-400 p-0 hover:bg-transparent hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Eye size={16} className="mr-1" />
                    View Details
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/admin/testimonials/edit-testimonial/${item.id}`)}
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
                      {actionLoading === item.id ? (
                        <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-gray-400 dark:border-blue-900/30">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <MessageSquare size={40} className="text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">No testimonials found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add a new testimonial or try changing your search filters
              </p>
              <Link href="/admin/testimonials/add-testimonial">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                  <Plus size={16} className="mr-1" />
                  Add New Testimonial
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && testimonials.length > 0 && totalPages > 1 && (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="border border-red-200 dark:border-red-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-200">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This action cannot be undone. This testimonial will be permanently deleted from the system.
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

export default ListTestimonialsPage;