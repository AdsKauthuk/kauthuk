"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Badge
} from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Icons
import {
  Search,
  RotateCcw,
  Pencil,
  Filter,
  Calendar,
  Eye,
  Package,
  TruckIcon,
  CheckCircle2,
  XCircle,
  ClipboardList,
  HomeIcon,
  User,
  Mail,
  Banknote,
  CalendarDays,
  ArrowUpDown,
  CreditCard,
  Send,
  Tags,
  Info,
} from "lucide-react";

// Hooks and Utilities
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Actions
import { getOrders, getOrderById, updateOrderStatus, updateShippingDetails } from "@/actions/order";

// Create a separate component for the search params functionality
function OrderSearchParamsHandler({ onParamsChange }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const userIdParam = searchParams.get('user');
    if (userIdParam) {
      onParamsChange(`user:${userIdParam}`);
    }
  }, [searchParams, onParamsChange]);

  return null;
}

// Import useSearchParams inside this component
function SearchParamsWrapper({ onParamsChange }) {
  const { useSearchParams } = require("next/navigation");
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const userIdParam = searchParams.get('user');
    if (userIdParam) {
      onParamsChange(`user:${userIdParam}`);
    }
  }, [searchParams, onParamsChange]);

  return null;
}

const ListOrdersPage = () => {
  const router = useRouter();
  
  // State for filters and pagination
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDates, setSelectedDates] = useState({
    from: undefined,
    to: undefined,
  });
  
  // State for orders data
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  
  // State for order detail
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  
  // State for shipping update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingShipping, setUpdatingShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    courier_name: "",
    tracking_id: "",
    tracking_url: "",
    status: "processing"
  });

  const itemsPerPage = 15;

  // Handle params change from the Suspense wrapped component
  const handleParamsChange = (query) => {
    setSearchQuery(query);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Extract user ID from search query if in format "user:123"
      let userId = null;
      let searchTerm = searchQuery;
      
      if (searchQuery.startsWith("user:")) {
        const userIdMatch = searchQuery.match(/user:(\d+)/);
        if (userIdMatch && userIdMatch[1]) {
          userId = parseInt(userIdMatch[1]);
          searchTerm = ""; // Clear search term as we're using userId filter
        }
      }
      
      // Get start and end dates if set
      const startDate = selectedDates.from ? selectedDates.from.toISOString() : null;
      const endDate = selectedDates.to ? selectedDates.to.toISOString() : null;
      
      // Use the server action
      const result = await getOrders({
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        status: statusFilter,
        userId: userId,
        startDate: startDate,
        endDate: endDate
      });
      
      if (result.success === false) {
        toast.error(result.error || "Failed to load orders");
        setOrders([]);
        setTotalPages(0);
        return;
      }
      
      if (result.orders) {
        setOrders(result.orders);
        setTotalPages(result.totalPages);
      } else {
        // Fallback to sample data for demonstration
        const sampleOrders = generateSampleOrders();
        setOrders(sampleOrders);
        setTotalPages(Math.ceil(sampleOrders.length / itemsPerPage));
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders. Please try again later.");
      setOrders([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, currentPage, sortBy, statusFilter, selectedDates.from, selectedDates.to]);

  const handleViewOrderDetails = async (orderId) => {
    setLoadingOrderDetail(true);
    
    try {
      const result = await getOrderById(orderId);
      
      if (result.success && result.order) {
        setOrderDetail(result.order);
      } else {
        toast.error(result.error || "Failed to load order details");
        // Find the order in our current list to display basic details
        const order = orders.find(order => order.id === orderId);
        if (order) {
          setOrderDetail({
            ...order,
            OrderProducts: [],
            ShippingDetail: null
          });
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        toast.success(result.message || "Order status updated successfully");
        
        // Update orders list
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, orderStatus: newStatus } : order
          )
        );
        
        // Update order detail if open
        if (orderDetail && orderDetail.id === orderId) {
          setOrderDetail(prev => ({ ...prev, order_status: newStatus }));
        }
        
        // Refresh the order details
        if (orderDetail && orderDetail.id === orderId) {
          handleViewOrderDetails(orderId);
        }
      } else {
        toast.error(result.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleShippingUpdate = async (orderId) => {
    setUpdatingShipping(true);
    
    try {
      const result = await updateShippingDetails(orderId, shippingForm);
      
      if (result.success) {
        toast.success(result.message || "Shipping details updated successfully");
        
        // Refresh the order details
        handleViewOrderDetails(orderId);
      } else {
        toast.error(result.error || "Failed to update shipping details");
      }
    } catch (error) {
      console.error("Error updating shipping details:", error);
      toast.error("Failed to update shipping details");
    } finally {
      setUpdatingShipping(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setStatusFilter("all");
    setCurrentPage(1);
    setSelectedDates({ from: undefined, to: undefined });
    setShowFilters(false);
  };

  // Function to format currency
  const formatCurrency = (amount, currency = "INR") => {
    try {
      const numAmount = Number(amount);
      if (isNaN(numAmount)) return `${currency === "USD" ? "$" : "₹"}0.00`;
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(numAmount);
    } catch (e) {
      return `${currency === "USD" ? "$" : "₹"}${amount}`;
    }
  };

  // Format date safely
  const formatDate = (dateInput) => {
    try {
      if (!dateInput) return "N/A";
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "MMM dd, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Function to get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'placed':
        return "bg-blue-100 text-blue-800";
      case 'confirmed':
        return "bg-indigo-100 text-indigo-800";
      case 'processing':
        return "bg-yellow-100 text-yellow-800";
      case 'shipped':
        return "bg-purple-100 text-purple-800";
      case 'delivered':
        return "bg-green-100 text-green-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      case 'returned':
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get payment status badge color
  const getPaymentBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'failed':
        return "bg-red-100 text-red-800";
      case 'refunded':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-40"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="flex justify-center space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </td>
      </tr>
    ));
  };

  // Function to generate sample orders for demonstration
  const generateSampleOrders = () => {
    return Array(12).fill(0).map((_, index) => ({
      id: 1000 + index,
      userName: `User ${index + 1}`,
      userEmail: `user${index + 1}@example.com`,
      total: 100 + (index * 10),
      currency: "INR",
      orderStatus: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'][index % 6],
      paymentStatus: ['completed', 'pending', 'failed', 'refunded'][index % 4],
      paymentMethod: ['card', 'upi', 'cod'][index % 3],
      orderDate: new Date(2023, index % 12, (index % 28) + 1).toISOString()
    }));
  };
  
  return (
    <div className="w-full p-4 space-y-6 max-w-7xl mx-auto">
      {/* Suspense boundary for the search params handling */}
      <Suspense fallback={null}>
        <SearchParamsWrapper onParamsChange={handleParamsChange} />
      </Suspense>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <Breadcrumb className="text-sm text-gray-500 mt-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin" className="flex items-center gap-1">
                  <HomeIcon size={14} />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/orders">
                  Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={loading}
          >
            <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
            Reset
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by order ID, customer..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="high_value">High Value</SelectItem>
                    <SelectItem value="low_value">Low Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {selectedDates.from ? (
                        selectedDates.to ? (
                          <>
                            {format(selectedDates.from, "LLL dd, y")} -{" "}
                            {format(selectedDates.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(selectedDates.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={selectedDates.from}
                      selected={selectedDates}
                      onSelect={setSelectedDates}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-600">ID</th>
                <th className="text-left p-4 font-medium text-gray-600">Customer</th>
                <th className="text-center p-4 font-medium text-gray-600">Total</th>
                <th className="text-center p-4 font-medium text-gray-600">Status</th>
                <th className="text-center p-4 font-medium text-gray-600">Payment</th>
                <th className="text-center p-4 font-medium text-gray-600">Date</th>
                <th className="text-center p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                renderSkeletons()
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b border-gray-100">
                      <div className="font-medium">#{order.id}</div>
                    </td>
                    
                    <td className="p-4 border-b border-gray-100">
                      <div className="flex flex-col">
                        <div className="font-medium flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          {order.userName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Mail size={14} className="text-gray-400" />
                          {order.userEmail}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 border-b border-gray-100 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Banknote size={14} className="text-gray-500" />
                        {formatCurrency(order.total, order.currency)}
                      </div>
                    </td>
                    
                    <td className="p-4 border-b border-gray-100 text-center">
                      <Badge
                        className={cn(
                          "capitalize",
                          getStatusBadgeClass(order.orderStatus)
                        )}
                      >
                        {order.orderStatus}
                      </Badge>
                    </td>
                    
                    <td className="p-4 border-b border-gray-100 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          className={cn(
                            "capitalize",
                            getPaymentBadgeClass(order.paymentStatus)
                          )}
                        >
                          {order.paymentStatus}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">{order.paymentMethod}</span>
                      </div>
                    </td>
                    
                    <td className="p-4 border-b border-gray-100 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
                        {formatDate(order.orderDate)}
                      </div>
                    </td>
                    
                    <td className="p-4 border-b border-gray-100">
                      <div className="flex justify-center items-center space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleViewOrderDetails(order.id)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                              >
                                <Eye size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => router.push(`/admin/orders/edit/${order.id}`)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-amber-600 hover:text-amber-900 hover:bg-amber-50"
                              >
                                <Pencil size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Order</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-gray-300 mb-2" />
                      <p>No orders found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try changing your search filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && orders.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!orderDetail} onOpenChange={(open) => !open && setOrderDetail(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Order #{orderDetail?.id}</DialogTitle>
            <DialogDescription>
              Placed on {orderDetail && formatDate(orderDetail.order_date)}
            </DialogDescription>
          </DialogHeader>
          
          {orderDetail && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="font-medium">{orderDetail.User?.name || "Unknown"}</div>
                      <div className="text-sm text-gray-600">{orderDetail.User?.email || "No email"}</div>
                      <div className="text-sm text-gray-600">{orderDetail.User?.mobile || "No phone"}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Order Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Badge
                          className={cn(
                            "capitalize",
                            getStatusBadgeClass(orderDetail.order_status)
                          )}
                        >
                          {orderDetail.order_status}
                        </Badge>
                      </div>
                      
                      <Select 
                        disabled={updatingStatus} 
                        value={orderDetail.order_status}
                        onValueChange={(value) => handleStatusUpdate(orderDetail.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placed">Placed</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "capitalize",
                            getPaymentBadgeClass(orderDetail.payment_status)
                          )}
                        >
                          {orderDetail.payment_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        <span className="font-medium">Method:</span> {orderDetail.payment_method}
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(orderDetail.total, orderDetail.currency)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Details Tabs */}
              <Tabs defaultValue="items">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="items" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      {loadingOrderDetail ? (
                        <div className="space-y-4">
                          {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                              <div className="w-16 h-16 bg-gray-200 rounded"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : orderDetail.OrderProducts?.length > 0 ? (
                        <div className="space-y-4">
                          {orderDetail.OrderProducts.map((product) => (
                            <div key={product.id} className="flex gap-4 border-b border-gray-100 pb-4">
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">Product #{product.id}</div>
                                <div className="text-sm text-gray-600">
                                  Quantity: {product.quantity || 1}
                                </div>
                                <div className="text-sm font-medium">
                                  {formatCurrency(product.price, orderDetail.currency)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Package size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">No items in this order</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      {loadingOrderDetail ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      ) : (
                        <div>
                          {orderDetail.ShippingDetail ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Courier</h3>
                                  <p className="mt-1">{orderDetail.ShippingDetail.courier_name}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Tracking ID</h3>
                                  <p className="mt-1">{orderDetail.ShippingDetail.tracking_id}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                  <p className="mt-1 capitalize">{orderDetail.ShippingDetail.status}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Shipped Date</h3>
                                  <p className="mt-1">
                                    {orderDetail.ShippingDetail.shipping_date 
                                      ? formatDate(orderDetail.ShippingDetail.shipping_date)
                                      : "Not shipped yet"}
                                  </p>
                                </div>
                              </div>
                              
                              {orderDetail.ShippingDetail.tracking_url && (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => window.open(orderDetail.ShippingDetail.tracking_url, '_blank')}
                                    className="text-blue-600"
                                  >
                                    <TruckIcon size={16} className="mr-2" />
                                    Track Package
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-center py-4 mb-4">
                                <TruckIcon size={32} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">No shipping information available</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Update Shipping Details Form */}
                          <div className="mt-6 border-t pt-4">
                            <h3 className="font-medium mb-4">Update Shipping Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Courier Name</label>
                                <Input
                                  value={shippingForm.courier_name}
                                  onChange={(e) => setShippingForm({...shippingForm, courier_name: e.target.value})}
                                  placeholder="e.g. FedEx, DHL, etc."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Tracking ID</label>
                                <Input
                                  value={shippingForm.tracking_id}
                                  onChange={(e) => setShippingForm({...shippingForm, tracking_id: e.target.value})}
                                  placeholder="Enter tracking number"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Tracking URL (Optional)</label>
                                <Input
                                  value={shippingForm.tracking_url}
                                  onChange={(e) => setShippingForm({...shippingForm, tracking_url: e.target.value})}
                                  placeholder="https://example.com/track"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                  value={shippingForm.status}
                                  onValueChange={(value) => setShippingForm({...shippingForm, status: value})}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="in_transit">In Transit</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Button
                                onClick={() => handleShippingUpdate(orderDetail.id)}
                                disabled={updatingShipping || !shippingForm.courier_name || !shippingForm.tracking_id}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {updatingShipping ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Send size={16} className="mr-2" />
                                    Update Shipping
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="summary" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      {loadingOrderDetail ? (
                        <div className="animate-pulse space-y-4">
                          {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="grid grid-cols-2 gap-4">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-medium mb-2">Order Totals</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between py-1 border-b">
                                <span>Subtotal</span>
                                <span>{formatCurrency(
                                  Number(orderDetail.total) - 
                                  Number(orderDetail.delivery_charge || 0) - 
                                  Number(orderDetail.tax_amount || 0), 
                                  orderDetail.currency
                                )}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b">
                                <span>Shipping</span>
                                <span>{formatCurrency(orderDetail.delivery_charge, orderDetail.currency)}</span>
                              </div>
                              {orderDetail.tax_amount && (
                                <div className="flex justify-between py-1 border-b">
                                  <span>Tax</span>
                                  <span>{formatCurrency(orderDetail.tax_amount, orderDetail.currency)}</span>
                                </div>
                              )}
                              {orderDetail.discount_amount && (
                                <div className="flex justify-between py-1 border-b">
                                  <span>Discount</span>
                                  <span>-{formatCurrency(orderDetail.discount_amount, orderDetail.currency)}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-1 font-medium text-base">
                                <span>Total</span>
                                <span>{formatCurrency(orderDetail.total, orderDetail.currency)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {orderDetail.coupon_code && (
                            <div>
                              <h3 className="font-medium mb-2">Coupon Applied</h3>
                              <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                <Tags size={14} />
                                {orderDetail.coupon_code}
                              </div>
                            </div>
                          )}
                          
                          {orderDetail.order_notes && (
                            <div>
                              <h3 className="font-medium mb-2">Order Notes</h3>
                              <div className="p-3 bg-gray-50 rounded-md text-sm">
                                <div className="flex gap-2">
                                  <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                  <p>{orderDetail.order_notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              onClick={() => router.push(`/admin/orders/edit/${orderDetail?.id}`)}
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Pencil size={16} className="mr-1" />
              Edit Order
            </Button>
            <Button 
              onClick={() => setOrderDetail(null)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListOrdersPage;