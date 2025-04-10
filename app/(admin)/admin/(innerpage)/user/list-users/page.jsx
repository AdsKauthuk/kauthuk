"use client";

import { format } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  Filter,
  HomeIcon,
  LayoutGrid,
  ListFilter,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";

// Hooks and Utilities
import { cn } from "@/lib/utils";

// Actions
import {
  deleteUserById,
  getUsers,
  getUserById,
  updateUserStatus,
} from "@/actions/user";
import { toast } from "sonner";

const ListUsersPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [userDetail, setUserDetail] = useState(null);
  const [userAddresses, setUserAddresses] = useState({
    deliveryAddresses: [],
    billingAddresses: [],
  });
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 50;
  const router = useRouter();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real application, we would use the server action
      const result = await getUsers({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        status: statusFilter,
      });

      if (result.success === false) {
        // Handle explicit error response from server
        toast.error(result.error || "Failed to load users");
        // Use empty data but keep UI working
        setUsers([]);
        setTotalPages(0);
        return;
      }

      if (result.users) {
        setUsers(result.users);
        setTotalPages(result.totalPages);
      } else {
        // Fallback to sample data for demonstration
        await new Promise((resolve) => setTimeout(resolve, 800));

        let filteredUsers = [...sampleUsers];

        // Apply search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          filteredUsers = filteredUsers.filter(
            (user) =>
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          );
        }

        // Apply status filter
        if (statusFilter !== "all") {
          filteredUsers = filteredUsers.filter(
            (user) => user.status === statusFilter
          );
        }

        // Apply sorting
        switch (sortBy) {
          case "latest":
            filteredUsers.sort((a, b) => b.createdAt - a.createdAt);
            break;
          case "oldest":
            filteredUsers.sort((a, b) => a.createdAt - b.createdAt);
            break;
          case "name_asc":
            filteredUsers.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "name_desc":
            filteredUsers.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "most_orders":
            filteredUsers.sort((a, b) => b.ordersCount - a.ordersCount);
            break;
          default:
            break;
        }

        // Calculate pagination
        const total = Math.ceil(filteredUsers.length / itemsPerPage);
        setTotalPages(total);

        // Get current page data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = filteredUsers.slice(
          startIndex,
          startIndex + itemsPerPage
        );

        setUsers(paginatedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, currentPage, sortBy, statusFilter]);

  const handleViewUserDetails = async (user) => {
    setUserDetail(user);
    setLoadingAddresses(true);
    setUserAddresses({ deliveryAddresses: [], billingAddresses: [] });

    try {
      // Fetch the detailed user info with addresses using the server action
      const result = await getUserById(user.id);

      if (result.success && result.user) {
        // Update user detail with the complete user data
        setUserDetail(result.user);

        // Set the addresses
        setUserAddresses({
          deliveryAddresses: result.user.DeliveryAddresses || [],
          billingAddresses: result.user.BillingAddresses || [],
        });
      } else {
        // Show error message with specific error from server
        toast.error(result.error || "Failed to load user details");

        // Keep showing the basic user info we already have
        // but empty the addresses
        setUserAddresses({
          deliveryAddresses: [],
          billingAddresses: [],
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error.message || error);
      toast.error("Failed to load user details. Please try again later.");

      // Keep showing the basic user info we already have
      // but empty the addresses
      setUserAddresses({
        deliveryAddresses: [],
        billingAddresses: [],
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setStatusFilter("all");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      // Use the server action to delete the user
      const result = await deleteUserById(deleteConfirmId);

      if (result.success) {
        // Filter out the deleted user from the state
        const updatedUsers = users.filter(
          (user) => user.id !== deleteConfirmId
        );
        setUsers(updatedUsers);

        toast.success("User deleted successfully");
        setDeleteConfirmId(null);

        // If we deleted the last item on the page, go to previous page
        if (updatedUsers.length === 0 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditUser = (userId) => {
    // Navigate to edit user page
    router.push(`/admin/users/edit-user/${userId}`);
  };

  const toggleUserStatus = async (user) => {
    try {
      // Calculate the new status (opposite of current)
      const newStatus = user.status === "active" ? "inactive" : "active";

      setIsDeleting(true); // Reuse the loading state for better UX

      // Update the user status using the server action
      const result = await updateUserStatus(user.id, newStatus);

      if (result.success) {
        // Update the users list in state
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        );

        setUsers(updatedUsers);

        // If we're viewing user details, update that too
        if (userDetail && userDetail.id === user.id) {
          setUserDetail({ ...userDetail, status: newStatus });
        }

        // Show success message
        toast.success(
          `User ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`
        );
      } else {
        // Show error message
        toast.error(result.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setIsDeleting(false);
    }
  };
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="animate-pulse">
          <td className="p-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </td>
          <td className="p-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </td>
          <td className="p-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </td>
          <td className="p-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
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

  const renderGridSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <Card
          key={`grid-skeleton-${index}`}
          className="animate-pulse overflow-hidden"
        >
          <CardHeader className="p-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mx-auto"></div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-center">
            <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </CardFooter>
        </Card>
      ));
  };

  const renderAddressSkeletons = () => {
    return Array(2)
      .fill(0)
      .map((_, index) => (
        <Card key={`address-skeleton-${index}`} className="animate-pulse mb-3">
          <CardContent className="p-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </CardContent>
        </Card>
      ));
  };

  // Sample data for demonstration (replace with actual API integration)
  const sampleUsers = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      mobile: "+1 555-123-4567",
      status: "active",
      mobileVerified: "yes",
      createdAt: new Date(2023, 1, 15),
      ordersCount: 5,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      mobile: "+1 555-987-6543",
      status: "active",
      mobileVerified: "yes",
      createdAt: new Date(2023, 2, 20),
      ordersCount: 3,
    },
    {
      id: 3,
      name: "Michael Johnson",
      email: "michael.johnson@example.com",
      mobile: "+1 555-567-8901",
      status: "inactive",
      mobileVerified: "no",
      createdAt: new Date(2023, 3, 10),
      ordersCount: 0,
    },
    {
      id: 4,
      name: "Emily Williams",
      email: "emily.williams@example.com",
      mobile: "+1 555-345-6789",
      status: "active",
      mobileVerified: "yes",
      createdAt: new Date(2023, 4, 5),
      ordersCount: 8,
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@example.com",
      mobile: "+1 555-234-5678",
      status: "inactive",
      mobileVerified: "no",
      createdAt: new Date(2023, 5, 25),
      ordersCount: 2,
    },
  ];

  return (
    <div className="w-full p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <Breadcrumb className="text-sm text-gray-500 mt-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
                  className="flex items-center gap-1"
                >
                  <HomeIcon size={14} />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            {viewMode === "table" ? (
              <>
                <LayoutGrid size={16} /> Grid View
              </>
            ) : (
              <>
                <ListFilter size={16} /> Table View
              </>
            )}
          </Button>

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
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">
                  Search users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-1 block">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Registered</SelectItem>
                    <SelectItem value="oldest">Oldest Registered</SelectItem>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                    <SelectItem value="most_orders">Most Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === "table" ? (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left p-4 font-medium text-gray-600">
                    Email
                  </th>
                  <th className="text-center p-4 font-medium text-gray-600">
                    Mobile
                  </th>
                  <th className="text-center p-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-center p-4 font-medium text-gray-600">
                    Registered On
                  </th>
                  <th className="text-center p-4 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 border-b border-gray-100">
                        <div className="font-medium">{user.name}</div>
                      </td>

                      <td className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-gray-400" />
                          {user.email}
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />
                          {user.mobile || "Not provided"}
                          {user.mobile && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {user.mobileVerified === "yes" ? (
                                    <CheckCircle2
                                      size={14}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <XCircle
                                      size={14}
                                      className="text-red-500"
                                    />
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {user.mobileVerified === "yes"
                                    ? "Verified"
                                    : "Not Verified"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-100 text-center">
                        <Badge
                          variant={
                            user.status === "active" ? "success" : "destructive"
                          }
                          className={cn(
                            "capitalize",
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {user.status}
                        </Badge>
                      </td>

                      <td className="p-4 border-b border-gray-100 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar size={14} className="text-gray-500" />
                          {format(new Date(user.createdAt), "MMM dd, yyyy")}
                        </div>
                      </td>

                      <td className="p-4 border-b border-gray-100">
                        <div className="flex justify-center items-center space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleViewUserDetails(user)}
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
                                  onClick={() => setDeleteConfirmId(user.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-red-600 hover:text-red-900 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Users size={48} className="text-gray-300 mb-2" />
                        <p>No users found</p>
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
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            renderGridSkeletons()
          ) : users.length > 0 ? (
            users.map((user) => (
              <Card
                key={user.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 pb-2 text-center">
                  <div className="mx-auto bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                    <User size={32} className="text-gray-500" />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {user.name}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1 text-sm">
                    <Badge
                      variant={
                        user.status === "active" ? "success" : "destructive"
                      }
                      className={cn(
                        "capitalize",
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {user.status}
                    </Badge>
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-600 text-sm">{user.email}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600 text-sm">
                      {user.mobile || "Not provided"}
                    </span>
                    {user.mobile &&
                      (user.mobileVerified === "yes" ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      ))}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-600 text-sm">
                      Joined {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <ShoppingCart size={14} className="text-gray-400" />
                    <span className="text-gray-600 text-sm">
                      {user.ordersCount}{" "}
                      {user.ordersCount === 1 ? "order" : "orders"}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex justify-center gap-2">
                  <Button
                    onClick={() => handleViewUserDetails(user)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Eye size={16} className="mr-1" />
                    Details
                  </Button>

                  <Button
                    onClick={() => setDeleteConfirmId(user.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white rounded-lg">
              <Users size={48} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">
                No users found
              </h3>
              <p className="text-gray-500 mb-4">
                Try changing your search filters
              </p>

              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RotateCcw size={16} />
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && totalPages > 1 && (
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

      {/* User Detail Dialog */}
      <Dialog
        open={!!userDetail}
        onOpenChange={(open) => !open && setUserDetail(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Profile</DialogTitle>
            <DialogDescription>User ID: {userDetail?.id}</DialogDescription>
          </DialogHeader>

          {userDetail && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Full Name
                      </h3>
                      <p className="mt-1">{userDetail.name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Email Address
                      </h3>
                      <p className="mt-1">{userDetail.email}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Phone Number
                      </h3>
                      <p className="mt-1 flex items-center gap-1">
                        {userDetail.mobile || "Not provided"}
                        {userDetail.mobile &&
                          (userDetail.mobileVerified === "yes" ? (
                            <CheckCircle2
                              size={14}
                              className="text-green-500"
                            />
                          ) : (
                            <XCircle size={14} className="text-red-500" />
                          ))}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Account Status
                      </h3>
                      <div className="mt-1">
                        <Badge
                          variant={
                            userDetail.status === "active"
                              ? "success"
                              : "destructive"
                          }
                          className={cn(
                            "capitalize",
                            userDetail.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {userDetail.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Registration Date
                      </h3>
                      <p className="mt-1">
                        {format(
                          new Date(userDetail.createdAt),
                          "MMMM dd, yyyy"
                        )}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Total Orders
                      </h3>
                      <p className="mt-1">
                        {userDetail.ordersCount} orders placed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => toggleUserStatus(userDetail)}
                    variant="outline"
                    className={
                      userDetail.status === "active"
                        ? "text-red-600 border-red-200 hover:bg-red-50"
                        : "text-green-600 border-green-200 hover:bg-green-50"
                    }
                  >
                    {userDetail.status === "active" ? (
                      <>
                        <XCircle size={16} className="mr-1" />
                        Deactivate Account
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} className="mr-1" />
                        Activate Account
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="addresses" className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Delivery Addresses</h3>

                  {loadingAddresses ? (
                    renderAddressSkeletons()
                  ) : userAddresses.deliveryAddresses.length > 0 ? (
                    <div className="space-y-3">
                      {userAddresses.deliveryAddresses.map((address) => (
                        <Card key={`delivery-${address.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between">
                              <div>
                                <div className="flex items-center mb-1">
                                  <p className="font-medium">{address.name}</p>
                                  {address.is_default && (
                                    <Badge className="ml-2">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {address.address}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.city || "N/A"},{" "}
                                  {address.States?.state_en || "N/A"}{" "}
                                  {address.pin || ""}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.Country?.country_enName || "N/A"}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Phone
                                    size={14}
                                    className="mr-1 text-gray-400"
                                  />
                                  {address.phone}
                                </p>
                              </div>
                              <div className="flex flex-col items-center">
                                <MapPin
                                  size={18}
                                  className="text-blue-500 mb-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                      <MapPin
                        size={32}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-gray-500">
                        No delivery addresses found
                      </p>
                    </div>
                  )}

                  <h3 className="font-medium mb-3 mt-6">Billing Addresses</h3>

                  {loadingAddresses ? (
                    renderAddressSkeletons()
                  ) : userAddresses.billingAddresses.length > 0 ? (
                    <div className="space-y-3">
                      {userAddresses.billingAddresses.map((address) => (
                        <Card key={`billing-${address.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between">
                              <div>
                                <div className="flex items-center mb-1">
                                  <p className="font-medium">{address.name}</p>
                                  {address.is_default && (
                                    <Badge className="ml-2">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {address.address}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.States?.state_en}{" "}
                                  {address.pin}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.Country?.country_enName}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Phone
                                    size={14}
                                    className="mr-1 text-gray-400"
                                  />
                                  {address.phone}
                                </p>
                              </div>
                              <div className="flex flex-col items-center">
                                <CreditCard
                                  size={18}
                                  className="text-amber-500 mb-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                      <CreditCard
                        size={32}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-gray-500">
                        No billing addresses found
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="orders" className="mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Recent Orders</h3>

                  {/* Display real orders if available, otherwise show sample data */}
                  {userDetail.Orders && userDetail.Orders.length > 0 ? (
                    <div className="space-y-3">
                      {userDetail.Orders.map((order, index) => (
                        <Card key={`order-${order.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ClipboardList
                                  size={16}
                                  className="text-gray-500"
                                />
                                <span className="font-medium">
                                  Order #{order.id}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize",
                                  order.order_status === "delivered"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : order.order_status === "shipped"
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : order.order_status === "cancelled"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                )}
                              >
                                {order.order_status?.charAt(0).toUpperCase() +
                                  order.order_status?.slice(1)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p>
                                  {format(
                                    new Date(order.order_date || Date.now()),
                                    "MMM dd, yyyy"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total</p>
                                <p>
                                  {order.currency === "USD" ? "$" : "₹"}
                                  {Number(order.total).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Payment</p>
                                <p className="capitalize">
                                  {order.payment_method}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Items</p>
                                <p>{order.OrderProducts?.length || 0} items</p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t flex justify-end">
                              <Button
                                onClick={() =>
                                  router.push(`/admin/orders/${order.id}`)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <ShoppingCart
                        size={32}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p>No orders yet</p>
                    </div>
                  )}

                  {(userDetail._count?.Orders || userDetail.ordersCount) >
                    5 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="link"
                        className="text-blue-600"
                        onClick={() =>
                          router.push(`/admin/orders?user=${userDetail.id}`)
                        }
                      >
                        View all{" "}
                        {userDetail._count?.Orders || userDetail.ordersCount}{" "}
                        orders
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setUserDetail(null)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListUsersPage;
