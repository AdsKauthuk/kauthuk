"use client";

import { useState, useEffect } from "react";
import { repairProductSubcategories } from "@/actions/product";
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
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ShoppingBag,
  Tag,
  FileText,
  StarIcon,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Activity,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const miGrate = async () => {
    try {
      setLoading(true);
      const response = await repairProductSubcategories();
      console.log(response.blogs);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
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
            <div className={`flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'} text-sm font-medium`}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(trend)}%
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              {description}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Enhanced statistics with the same data
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      description: "from last month",
      icon: DollarSign,
      trend: 20.1,
      color: "bg-blue-600 dark:bg-blue-700",
    },
    {
      title: "Active Users",
      value: "2,350",
      description: "from last week",
      icon: Users,
      trend: -8.1,
      color: "bg-indigo-600 dark:bg-indigo-700",
    },
    {
      title: "Sales",
      value: "12,234",
      description: "from last quarter",
      icon: ShoppingCart,
      trend: 12.2,
      color: "bg-emerald-600 dark:bg-emerald-700",
    },
    {
      title: "Conversions",
      value: "3.42%",
      description: "from yesterday",
      icon: BarChart3,
      trend: 4.1,
      color: "bg-amber-600 dark:bg-amber-700",
    },
  ];

  // Catalog statistics
  const catalogStats = [
    { title: "Products", value: 842, icon: Package, color: "text-blue-600 dark:text-blue-400" },
    { title: "Categories", value: 26, icon: Tag, color: "text-purple-600 dark:text-purple-400" },
    { title: "Orders", value: 384, icon: ShoppingBag, color: "text-emerald-600 dark:text-emerald-400" },
    { title: "Blog Posts", value: 47, icon: FileText, color: "text-amber-600 dark:text-amber-400" },
  ];

  // Recent orders
  const recentOrders = [
    { id: "ORD-7352", customer: "Sarah Johnson", date: "Today, 2:30 PM", status: "completed", amount: "$122.40" },
    { id: "ORD-7351", customer: "Michael Chen", date: "Today, 11:24 AM", status: "processing", amount: "$89.90" },
    { id: "ORD-7350", customer: "Alex Thompson", date: "Yesterday", status: "pending", amount: "$54.25" },
    { id: "ORD-7349", customer: "Emily Rodriguez", date: "Yesterday", status: "completed", amount: "$211.75" },
    { id: "ORD-7348", customer: "David Kim", date: "May 10, 2023", status: "shipped", amount: "$149.99" },
  ];

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
                Last 30 Days
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem>Last Quarter</DropdownMenuItem>
              <DropdownMenuItem>This Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={miGrate} 
            disabled={loading}
            variant="outline" 
            className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <Activity className="mr-2 h-4 w-4" />
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
            <div className="flex gap-2 self-start">
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                View Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
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
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 text-sm">
                      <td className="py-3 text-blue-600 dark:text-blue-400 font-medium">{order.id}</td>
                      <td className="py-3">{order.customer}</td>
                      <td className="py-3">{getStatusBadge(order.status)}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{order.date}</td>
                      <td className="py-3 text-right font-medium">{order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                {catalogStats.map((item) => (
                  <div key={item.title} className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-2xl font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Target Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Monthly Sales</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2 bg-slate-200 dark:bg-slate-700" indicatorClassName="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>New Customers</span>
                  <span className="font-medium">62%</span>
                </div>
                <Progress value={62} className="h-2 bg-slate-200 dark:bg-slate-700" indicatorClassName="bg-emerald-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Inventory</span>
                  <span className="font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2 bg-slate-200 dark:bg-slate-700" indicatorClassName="bg-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;