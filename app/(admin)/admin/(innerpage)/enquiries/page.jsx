"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// Icons
import {
  Search,
  RotateCcw,
  MoreVertical,
  Trash2,
  Filter,
  LayoutGrid,
  LayoutList,
  HomeIcon,
  MessageSquare,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Eye,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Actions
import { deleteEnquiryById, getEnquiries } from "@/actions/enquiry";
import { toast } from "sonner";
import { format } from "date-fns";

const ListEnquiriesPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const itemsPerPage = 10;
  const router = useRouter();

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const response = await getEnquiries({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setEnquiries(response.enquiries);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch enquiries:", error);
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [searchQuery, currentPage, sortBy]);

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const openEnquiryDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowEnquiryDialog(true);
  };

  const confirmDelete = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDeleteDialog(true);
  };

  const deleteEnquiry = async () => {
    if (!selectedEnquiry) return;
    const id = selectedEnquiry.id;
    
    try {
      setActionLoading(id);
      const result = await deleteEnquiryById(id);
      if (result.success) {
        toast.success("Enquiry deleted successfully");
        fetchEnquiries();
        setShowDeleteDialog(false);
      } else {
        toast.error(result.message || "Failed to delete enquiry");
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };

  const renderTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {format(date, "MMM d, yyyy")}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {format(date, "h:mm a")}
          </span>
        </div>
      );
    } catch (error) {
      return "Invalid date";
    }
  };
  
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
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
      <Card key={`grid-skeleton-${index}`} className="border-gray-400 dark:border-blue-900/30 animate-pulse">
        <CardHeader className="p-4">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/2 mb-2"></div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-2"></div>
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-end">
          <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md mr-2"></div>
          <div className="h-9 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
        </CardFooter>
      </Card>
    ));
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Enquiry Management</h1>
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
                <BreadcrumbLink href="/admin/enquiries/list-enquiries">
                  Enquiries
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
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="text-sm font-medium mb-1 block">Search enquiries</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
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
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Name</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Email</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Phone</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Date</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : enquiries.length > 0 ? (
                  enquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {enquiry.name}
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <a 
                          href={`mailto:${enquiry.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {enquiry.email}
                        </a>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        {enquiry.phone ? (
                          <a 
                            href={`tel:${enquiry.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {enquiry.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        {renderTimestamp(enquiry.createdAt)}
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => openEnquiryDetails(enquiry)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          
                          <Button
                            onClick={() => confirmDelete(enquiry)}
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === enquiry.id}
                            className="rounded-lg border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          >
                            {actionLoading === enquiry.id ? (
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
                          <MessageSquare size={32} className="text-blue-300 dark:text-blue-700" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No enquiries found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Change your search filters or check back later for new enquiries
                        </p>
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
          ) : enquiries.length > 0 ? (
            enquiries.map((enquiry) => (
              <Card 
                key={enquiry.id} 
                className="overflow-hidden border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {enquiry.name}
                    </CardTitle>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {format(new Date(enquiry.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <CardDescription className="flex items-center text-blue-600 dark:text-blue-400">
                    <Mail size={14} className="mr-1" />
                    {enquiry.email}
                  </CardDescription>
                  {enquiry.phone && (
                    <CardDescription className="flex items-center mt-1">
                      <Phone size={14} className="mr-1" />
                      {enquiry.phone}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <p className="line-clamp-3">{truncateText(enquiry.message, 150)}</p>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                  <Button
                    onClick={() => openEnquiryDetails(enquiry)}
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  >
                    <Eye size={16} className="mr-1" />
                    View
                  </Button>
                  
                  <Button
                    onClick={() => confirmDelete(enquiry)}
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === enquiry.id}
                    className="rounded-lg border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  >
                    {actionLoading === enquiry.id ? (
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
                <MessageSquare size={40} className="text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">No enquiries found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Change your search filters or check back later for new enquiries
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && enquiries.length > 0 && totalPages > 1 && (
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

      {/* Enquiry Detail Dialog */}
      {selectedEnquiry && (
        <Dialog open={showEnquiryDialog} onOpenChange={setShowEnquiryDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900 dark:text-white mb-1">
                Enquiry Details
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 flex items-center">
                <Calendar size={14} className="inline-block mr-1" />
                {format(new Date(selectedEnquiry.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <div className="flex items-center text-slate-600 dark:text-slate-400">
                  <User size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Name:</span>
                </div>
                <p className="text-slate-900 dark:text-white pl-7">{selectedEnquiry.name}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-slate-600 dark:text-slate-400">
                  <Mail size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Email:</span>
                </div>
                <p className="text-slate-900 dark:text-white pl-7">
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {selectedEnquiry.email}
                  </a>
                </p>
              </div>
              
              {selectedEnquiry.phone && (
                <div className="space-y-1">
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <Phone size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Phone:</span>
                  </div>
                  <p className="text-slate-900 dark:text-white pl-7">
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                    </p>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="flex items-center text-slate-600 dark:text-slate-400">
                  <MessageSquare size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Message:</span>
                </div>
                <div className="text-slate-900 dark:text-white pl-7 mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {selectedEnquiry.message}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between items-center gap-4 sm:gap-0">
              
               <a href={`mailto:${selectedEnquiry.email}?subject=Re: Your Enquiry&body=Dear ${selectedEnquiry.name},%0D%0A%0D%0AThank you for contacting us.%0D%0A%0D%0A`}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <Mail size={16} className="mr-1" />
                Reply via Email
              </a>
              <DialogClose asChild>
                <Button variant="outline" className="border-slate-200 dark:border-slate-700">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the enquiry from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-slate-200 dark:border-slate-700"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
              onClick={deleteEnquiry}
              disabled={actionLoading === selectedEnquiry?.id}
            >
              {actionLoading === selectedEnquiry?.id ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
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

export default ListEnquiriesPage;