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

// Icons
import {
  Plus,
  Search,
  RotateCcw,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  LayoutGrid,
  LayoutList,
  FileText,
  HomeIcon,
  Layers,
  ListFilter,
  ArrowDownAZ,
  Info,
  ExternalLink
} from "lucide-react";

// Actions
import { deleteSiteContentById, getSiteContents } from "@/actions/site-content";
import { toast } from "sonner";
import { truncateText } from "@/helpers/multifunction";

const ListSiteContentPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [siteContents, setSiteContents] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [actionLoading, setActionLoading] = useState(null);

  const itemsPerPage = 15;
  const router = useRouter();

  const fetchSiteContents = async () => {
    setLoading(true);
    try {
      const response = await getSiteContents({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setSiteContents(response.siteContents);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch site contents:", error);
      toast.error("Failed to load site contents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteContents();
  }, [searchQuery, currentPage, sortBy]);

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setCurrentPage(1);
    setShowFilters(false);
    router.refresh();
  };

  const deleteSiteContent = async (id) => {
    if (typeof window === "undefined") return; // Prevent execution on the server
  
    const isConfirmed = window.confirm("Are you sure you want to delete this content?");
    if (!isConfirmed) return; // Exit if user cancels
  
    try {
      setActionLoading(id);
      const result = await deleteSiteContentById(id);
      if (result.success) {
        toast.success("Site content deleted successfully");
        fetchSiteContents();
      } else {
        toast.error(result.message || "Failed to delete site content");
      }
    } catch (error) {
      console.error("Error deleting site content:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(null);
    }
  };
  
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-2/3"></div>
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
          <div className="h-5 bg-blue-100 dark:bg-blue-900/30 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded w-3/4"></div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-24 bg-blue-100 dark:bg-blue-900/30 rounded w-full mb-4"></div>
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Site Content Management</h1>
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
                <BreadcrumbLink href="/admin/site-content/list-site-content">
                  Site Content
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
          
          <Link href="/admin/site-content/add-site-content">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus size={16} />
              New Content
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
                <label className="text-sm font-medium mb-1 block">Search content</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by page name or title..."
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
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Page</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Title</th>
                  <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Link</th>
                  <th className="text-center p-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : siteContents.length > 0 ? (
                  siteContents.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          <Badge variant="outline" className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            {item.page}
                          </Badge>
                        </div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{item.title || "—"}</div>
                      </td>

                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        {item.link ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {truncateText(item.link, 30)}
                            <ExternalLink size={14} className="ml-1" />
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      
                      <td className="p-4 border-b border-gray-400 dark:border-blue-900/30">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/admin/site-content/edit-site-content/${item.id}`)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          >
                            <Pencil size={16} className="mr-1" />
                            Edit
                          </Button>
                          
                          <Button
                            onClick={() => deleteSiteContent(item.id)}
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
                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                          <FileText size={32} className="text-blue-300 dark:text-blue-700" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No site content found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                          Add new site content or try changing your search filters
                        </p>
                        <Link href="/admin/site-content/add-site-content">
                          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            <Plus size={16} className="mr-1" />
                            Add New Content
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
          ) : siteContents.length > 0 ? (
            siteContents.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden border-gray-400 dark:border-blue-900/30 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-shadow"
              >
                <CardHeader className="p-4 pb-2">
                  <Badge variant="outline" className="w-fit mb-2 border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    {item.page}
                  </Badge>
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {item.title || "No Title"}
                  </CardTitle>
                  {item.link && (
                    <CardDescription className="mt-1">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {truncateText(item.link, 30)}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {truncateText(item.content, 150)}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-2 flex justify-end gap-2">
                  <Button
                    onClick={() => router.push(`/admin/site-content/edit-site-content/${item.id}`)}
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  >
                    <Pencil size={16} className="mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => deleteSiteContent(item.id)}
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
                <FileText size={40} className="text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">No site content found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-5 text-center">
                Add new site content or try changing your search filters
              </p>
              <Link href="/admin/site-content/add-site-content">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                  <Plus size={16} className="mr-1" />
                  Add New Content
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && siteContents.length > 0 && totalPages > 1 && (
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
    </div>
  );
};

export default ListSiteContentPage;