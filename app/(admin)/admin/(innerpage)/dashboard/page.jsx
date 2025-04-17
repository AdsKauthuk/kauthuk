"use client";

import { useState, useEffect } from "react";
import { getDashboardData, repairProductSubcategories } from "@/actions/dashboard";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ShoppingBag,
  Tag,
  FileText,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Activity,
  AlertTriangle,
  Mail,
  LucideMailWarning,
  Loader2,
  Star,
  BoxesIcon,
  TagsIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("last30days");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error(response.error || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Something went wrong while loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    try {
      setRefreshing(true);
      const response = await repairProductSubcategories();
      
      if (response.success) {
        toast.success(response.message || "Operation completed successfully");
        // Refresh dashboard data after repair
        fetchDashboardData();
      } else {
        toast.error(response.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error during repair operation:", error);
      toast.error("Something went wrong");
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    color,
  }) => {
    const isPositive = trend > 0;

    return (
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                {title}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {value}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${color} shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {trend !== undefined && (
              <div className={`flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'} text-sm font-medium`}>
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {Math.abs(trend)}%
              </div>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              {description}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      placed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      confirmed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", 
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
      returned: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      // For contact submissions
      new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      read: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      responded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    const symbols = {
      INR: "₹",
      USD: "$"
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <Breadcrumb className="mb-2 sm:mb-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange === "last7days" ? "Last 7 Days" : 
                 dateRange === "last30days" ? "Last 30 Days" :
                 dateRange === "lastQuarter" ? "Last Quarter" : "All Time"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setDateRange("last7days")}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange("last30days")}>Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange("lastQuarter")}>Last Quarter</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange("allTime")}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={fetchDashboardData} 
            disabled={loading || refreshing}
            variant="outline" 
            className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Welcome card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">Welcome to Kauthuk Dashboard</h2>
              <p className="text-blue-600/80 dark:text-blue-400/80 mt-1">
                Here's what's happening with your store today.
              </p>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Revenue" 
          value={formatCurrency(dashboardData?.revenue?.total || 0, "INR")}
          description="total revenue" 
          icon={DollarSign}
          color="bg-blue-600 dark:bg-blue-700"
        />
        
        <StatCard 
          title="Users" 
          value={dashboardData?.counts?.users || 0}
          description="registered accounts" 
          icon={Users}
          color="bg-indigo-600 dark:bg-indigo-700"
        />
        
        <StatCard 
          title="Orders" 
          value={dashboardData?.counts?.orders || 0}
          description="total orders" 
          icon={ShoppingCart}
          color="bg-emerald-600 dark:bg-emerald-700"
        />
        
        <StatCard 
          title="Inquiries" 
          value={dashboardData?.counts?.contactSubmissions || 0}
          description="customer inquiries" 
          icon={Mail}
          color="bg-amber-600 dark:bg-amber-700"
        />
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders - Takes 2/3 of available space on large screens */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentOrders?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Order</th>
                      <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Customer</th>
                      <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Status</th>
                      <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Date</th>
                      <th className="pb-2 font-medium text-right text-slate-500 dark:text-slate-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 text-sm">
                        <td className="py-3 text-blue-600 dark:text-blue-400 font-medium">{order.orderId}</td>
                        <td className="py-3">{order.customer}</td>
                        <td className="py-3">{getStatusBadge(order.status)}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{formatDate(order.date)}</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(order.amount, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p>No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog Summary - Takes 1/3 of available space on large screens */}
        <div className="space-y-5">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Catalog Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Products</p>
                    <p className="text-2xl font-bold">{dashboardData?.counts?.products || 0}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <TagsIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Categories</p>
                    <p className="text-2xl font-bold">{dashboardData?.counts?.categories || 0}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Star className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Featured Products</p>
                    <p className="text-2xl font-bold">{dashboardData?.counts?.featuredProducts || 0}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Blog Posts</p>
                    <p className="text-2xl font-bold">{dashboardData?.counts?.blogs || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Low Stock Products</span>
                  <span className="font-medium text-amber-600">
                    {dashboardData?.counts?.lowStockProducts || 0} items
                  </span>
                </div>
                <Progress 
                  value={dashboardData?.counts?.lowStockProducts ? 
                    (dashboardData.counts.lowStockProducts / dashboardData.counts.products) * 100 : 0
                  } 
                  className="h-2 bg-slate-200 dark:bg-slate-700" 
                  indicatorClassName="bg-amber-500" 
                />
              </div>

              {dashboardData?.recentContactSubmissions?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Recent Inquiries</h3>
                  <div className="space-y-3">
                    {dashboardData.recentContactSubmissions.map(submission => (
                      <div key={submission.id} className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium truncate max-w-[140px]">{submission.name}</p>
                            <p className="text-xs text-slate-500">{formatDate(submission.date)}</p>
                          </div>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{submission.subject || submission.email}</p>
                          <div className="mt-1">
                            {getStatusBadge(submission.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;