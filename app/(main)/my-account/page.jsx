"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Package,
  LayoutDashboard,
  ChevronRight,
  MapPin,
  Edit,
  LogOut,
  Camera,
  Mail,
  Phone,
  Loader2,
  PlusCircle,
  Check,
  Trash2,
  HomeIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import server actions
import {
  getUserProfile,
  getUserOrders,
  updateUserProfile,
  updateProfilePicture,
  logoutUser,
  getCountries,
  getStatesByCountry,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
} from "@/actions/account";
import { toast } from "sonner";

const MyAccount = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormErrors, setAddressFormErrors] = useState({});

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile();

        if (profileData && profileData.success) {
          // Safe check for user data
          const user = profileData.user || {};
          setUserData(user);

          // Set addresses from user data - ensure it's an array
          setAddresses(
            Array.isArray(user.DeliveryAddresses) ? user.DeliveryAddresses : []
          );

          // Fetch orders data
          const ordersData = await getUserOrders();
          if (ordersData && ordersData.success) {
            // Ensure orders is an array
            setOrders(
              Array.isArray(ordersData.orders) ? ordersData.orders : []
            );
          } else {
            setOrders([]);
          }

          // Fetch countries for address form
          const countriesData = await getCountries();
          if (countriesData && countriesData.success) {
            // Ensure countries is an array
            setCountries(
              Array.isArray(countriesData.countries)
                ? countriesData.countries
                : []
            );
          } else {
            setCountries([]);
          }
        } else {
          // Handle error in profile data
          const errorMessage =
            profileData?.error || "Failed to load profile data";
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("An unexpected error occurred while loading your profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!selectedCountry) {
        setStates([]);
        return;
      }

      try {
        const statesData = await getStatesByCountry(selectedCountry);
        if (statesData && statesData.success) {
          // Ensure states is an array
          setStates(Array.isArray(statesData.states) ? statesData.states : []);
        } else {
          setStates([]);
        }
      } catch (error) {
        console.error("Error fetching states:", error);
        setStates([]);
      }
    };

    fetchStates();
  }, [selectedCountry]);

  // Handle profile update
  const handleProfileUpdate = async (formData) => {
    try {
      setUpdating(true);
      const result = await updateUserProfile(formData);

      if (result && result.success) {
        // Refresh user data
        const profileData = await getUserProfile();
        if (profileData && profileData.success) {
          setUserData(profileData.user || {});
        }

        toast.success("Your profile has been updated");
      } else {
        toast.error(result?.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  // Open address dialog for adding a new address
  const handleAddAddress = () => {
    setEditingAddress(null);
    setSelectedCountry("");
    setStates([]);
    setAddressFormErrors({});
    setIsAddressDialogOpen(true);
  };

  // Open address dialog for editing an existing address
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setSelectedCountry(address.country_id.toString());
    setAddressFormErrors({});

    // Fetch states for the selected country
    getStatesByCountry(address.country_id).then((response) => {
      if (response && response.success) {
        setStates(Array.isArray(response.states) ? response.states : []);
      }
    });

    setIsAddressDialogOpen(true);
  };

  // Validate address form
  const validateAddressForm = (formData) => {
    const errors = {};

    if (!formData.get("name") || !formData.get("name").trim()) {
      errors.name = "Full name is required";
    }

    if (!formData.get("address") || !formData.get("address").trim()) {
      errors.address = "Address is required";
    }

    if (!formData.get("city") || !formData.get("city").trim()) {
      errors.city = "City is required";
    }

    if (!formData.get("country_id")) {
      errors.country_id = "Country is required";
    }

    if (!formData.get("state_id")) {
      errors.state_id = "State is required";
    }

    if (!formData.get("pin") || !formData.get("pin").trim()) {
      errors.pin = "PIN/ZIP code is required";
    }

    if (!formData.get("phone") || !formData.get("phone").trim()) {
      errors.phone = "Phone number is required";
    }

    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add/update address
  const handleAddressSubmit = async (formData) => {
    if (!validateAddressForm(formData)) {
      return;
    }

    setUpdating(true);

    try {
      let result;

      if (editingAddress) {
        // Add address ID for update
        formData.append("address_id", editingAddress.id);
        result = await updateDeliveryAddress(formData);
      } else {
        result = await addDeliveryAddress(formData);
      }

      if (result && result.success) {
        toast.success(editingAddress
          ? "Address updated successfully"
          : "Address added successfully"
        );

        // Refresh user data to get updated addresses
        const profileData = await getUserProfile();
        if (profileData && profileData.success) {
          setUserData(profileData.user || {});
          setAddresses(
            Array.isArray(profileData.user?.DeliveryAddresses)
              ? profileData.user.DeliveryAddresses
              : []
          );
        }

        setIsAddressDialogOpen(false);
      } else {
        toast.error(result?.error || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append("address_id", addressId);

      const result = await deleteDeliveryAddress(formData);

      if (result && result.success) {
        toast.success("Address deleted successfully");

        // Update local state to remove the deleted address
        setAddresses(addresses.filter((addr) => addr.id !== addressId));

        // Refresh user data
        const profileData = await getUserProfile();
        if (profileData && profileData.success) {
          setUserData(profileData.user || {});
          setAddresses(
            Array.isArray(profileData.user?.DeliveryAddresses)
              ? profileData.user.DeliveryAddresses
              : []
          );
        }
      } else {
        toast.error(result?.error || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    const colors = {
      delivered: "bg-green-100 text-green-800",
      shipped: "bg-[#fee3d8] text-[#6B2F1A]", // Changed to match Kauthuk colors
      processing: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-[#fee3d8] text-[#6B2F1A]", // Changed to match Kauthuk colors
      placed: "bg-[#fee3d8] text-[#6B2F1A]", // Changed to match Kauthuk colors
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-pink-100 text-pink-800",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F4F0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#6B2F1A] mx-auto mb-4" />
          <h3 
            className="text-lg font-medium text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Loading your account...
          </h3>
        </div>
      </div>
    );
  }

  // Fallback data if the server doesn't return complete information
  const defaultUserData = {
    name: userData?.name || "User",
    email: userData?.email || "",
    mobile: userData?.mobile || "",
    avatar: userData?.avatar || "/placeholder-avatar.jpg",
    memberSince: userData?.memberSince || "2024",
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-[#6B2F1A] to-[#5A2814] text-white border-[#6B2F1A]/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={userData?.avatar || defaultUserData.avatar}
                  alt={userData?.name || "User"}
                  className="w-20 h-20 rounded-full border-2 border-white object-cover"
                />
                {/* Avatar upload functionality removed as per comment */}
              </div>
              <div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {userData?.name || defaultUserData.name}
                </h2>
                <p 
                  className="text-[#fee3d8]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Member since{" "}
                  {userData?.memberSince || defaultUserData.memberSince}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#6B2F1A]/10">
          <CardContent className="p-6">
            <h3 
              className="text-lg font-semibold mb-4 text-[#6B2F1A]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F9F4F0] p-4 rounded-lg">
                <p 
                  className="text-gray-500"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Total Orders
                </p>
                <p 
                  className="text-2xl font-bold text-[#6B2F1A]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {orders.length}
                </p>
              </div>
              <div className="bg-[#F9F4F0] p-4 rounded-lg">
                <p 
                  className="text-gray-500"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Active Orders
                </p>
                <p 
                  className="text-2xl font-bold text-[#6B2F1A]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {
                    orders.filter((o) => {
                      const status = o?.status?.toLowerCase() || "";
                      return !["delivered", "cancelled", "returned"].includes(
                        status
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#6B2F1A]/10">
        <CardHeader>
          <CardTitle 
            className="text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 2).map((order) => (
                <div
                  key={order.id || "order-" + Math.random()}
                  className="flex items-center justify-between p-4 bg-[#F9F4F0] rounded-lg"
                >
                  <div>
                    <p 
                      className="font-medium text-[#6B2F1A]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {order.orderId || `Order #${order.id}`}
                    </p>
                    <p 
                      className="text-sm text-gray-500"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {order.date || "Recent order"}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status || "Processing"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4">
              <p 
                className="text-gray-500"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                No orders yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address quick view */}
      <Card className="border-[#6B2F1A]/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle 
            className="text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Delivery Addresses
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddAddress}
            className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="space-y-4">
              {addresses.slice(0, 1).map((address) => (
                <div
                  key={address.id || "address-" + Math.random()}
                  className="p-4 bg-[#F9F4F0] rounded-lg relative"
                >
                  {address.is_default && (
                    <Badge className="absolute top-2 right-2 bg-[#fee3d8] text-[#6B2F1A] border-[#6B2F1A]/20">
                      Default
                    </Badge>
                  )}
                  <p 
                    className="font-medium text-[#6B2F1A]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {address.name || "Address"}
                  </p>
                  <p 
                    className="text-gray-600 mt-1"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {address.address || ""}
                  </p>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {address.city || ""}
                    {address.city && address.pin ? ", " : ""}
                    {address.pin || ""}
                  </p>
                  <p 
                    className="text-gray-600 mt-1"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {address.phone || ""}
                  </p>
                </div>
              ))}
              {addresses.length > 1 && (
                <Button
                  variant="link"
                  className="text-[#6B2F1A]"
                  onClick={() => setActiveTab("addresses")}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  View all addresses
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center p-4">
              <p 
                className="text-gray-500 mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                No addresses saved
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddAddress}
                className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Add Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6">
      <Card className="border-[#6B2F1A]/10">
        <CardHeader>
          <CardTitle 
            className="text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            My Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id || "order-" + Math.random()}
                  className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#F9F4F0] rounded-lg hover:bg-[#fee3d8]/30 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 
                        className="font-semibold text-[#6B2F1A]"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {order.orderId || `Order #${order.id}`}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status || "Processing"}
                      </Badge>
                    </div>
                    <p 
                      className="text-sm text-gray-500"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Ordered on {order.date || "recent date"} •{" "}
                      {order.items || 0} items
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <p 
                      className="font-semibold text-[#6B2F1A]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {order.currency === "USD" ? "$" : "₹"}
                      {typeof order.total === "number"
                        ? order.total.toFixed(2)
                        : "0.00"}
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-[#F9F4F0] rounded-lg">
              <Package className="h-12 w-12 text-[#6B2F1A]/50 mx-auto mb-3" />
              <h3 
                className="text-lg font-medium text-[#6B2F1A] mb-1"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                No orders yet
              </h3>
              <p 
                className="text-gray-500 mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                When you place orders, they will appear here.
              </p>
              <Button 
                className="bg-[#6B2F1A] hover:bg-[#5A2814]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Start Shopping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const AddressesView = () => (
    <div className="space-y-6">
      <Card className="border-[#6B2F1A]/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle 
            className="text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            My Addresses
          </CardTitle>
          <Button 
            onClick={handleAddAddress}
            className="bg-[#6B2F1A] hover:bg-[#5A2814]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id || "address-" + Math.random()}
                  className="p-4 bg-[#F9F4F0] rounded-lg border border-[#6B2F1A]/10 relative"
                >
                  {address.is_default && (
                    <Badge className="absolute top-2 right-2 bg-[#fee3d8] text-[#6B2F1A] border-[#6B2F1A]/20">
                      Default
                    </Badge>
                  )}
                  <div className="flex items-start mb-2">
                    <HomeIcon className="h-5 w-5 text-[#6B2F1A] mr-2 mt-0.5" />
                    <div>
                      <p 
                        className="font-medium text-[#6B2F1A]"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {address.name || "Address"}
                      </p>
                      <p 
                        className="text-gray-600 mt-1"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {address.address || ""}
                      </p>
                      <p 
                        className="text-gray-600"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {address.city || ""}
                        {address.city && address.pin ? ", " : ""}
                        {address.pin || ""}
                      </p>
                      <p 
                        className="text-gray-600 mt-1"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {address.phone || ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                      className="text-[#6B2F1A] hover:bg-[#fee3d8]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={updating}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-[#F9F4F0] rounded-lg">
              <MapPin className="h-12 w-12 text-[#6B2F1A]/50 mx-auto mb-3" />
              <h3 
                className="text-lg font-medium text-[#6B2F1A] mb-1"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                No addresses saved
              </h3>
              <p 
                className="text-gray-500 mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Add a delivery address to speed up your checkout process.
              </p>
              <Button 
                onClick={handleAddAddress}
                className="bg-[#6B2F1A] hover:bg-[#5A2814]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Add New Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6">
      <Card className="border-[#6B2F1A]/10">
        <CardHeader>
          <CardTitle 
            className="text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleProfileUpdate} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={userData?.avatar || defaultUserData.avatar}
                    alt={userData?.name || "User"}
                    className="w-32 h-32 rounded-full border-4 border-[#fee3d8] object-cover"
                  />
                  
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label 
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="mt-1 w-full rounded-md border border-[#6B2F1A]/20 px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]"
                      defaultValue={userData?.name || defaultUserData.name}
                      required
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label 
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="mt-1 w-full rounded-md border border-[#6B2F1A]/20 px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]"
                      defaultValue={userData?.email || defaultUserData.email}
                      required
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label 
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      className="mt-1 w-full rounded-md border border-[#6B2F1A]/20 px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]"
                      defaultValue={userData?.mobile || defaultUserData.mobile}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="bg-[#6B2F1A] hover:bg-[#5A2814]"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Alert className="border-[#6B2F1A]/20 bg-[#fee3d8]/20">
        <AlertDescription style={{ fontFamily: "Poppins, sans-serif" }}>
          Your information is securely stored and will never be shared with
          third parties.
        </AlertDescription>
      </Alert>
    </div>
  );

  // Address dialog form for adding/editing addresses
  const AddressDialog = () => (
    <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle 
            className="text-[#6B2F1A]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {editingAddress ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <form action={handleAddressSubmit} className="space-y-4 mt-4">
          <div>
            <label 
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Full Name
            </label>
            <input
              type="text"
              name="name"
              className={`mt-1 w-full rounded-md border ${
                addressFormErrors.name ? "border-red-300" : "border-[#6B2F1A]/20"
              } px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
              defaultValue={editingAddress?.name || ""}
              required
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            {addressFormErrors.name && (
              <p 
                className="text-sm text-red-500 mt-1"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {addressFormErrors.name}
              </p>
            )}
          </div>

          <div>
            <label 
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Address
            </label>
            <textarea
              name="address"
              rows="2"
              className={`mt-1 w-full rounded-md border ${
                addressFormErrors.address ? "border-red-300" : "border-[#6B2F1A]/20"
              } px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
              defaultValue={editingAddress?.address || ""}
              required
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            {addressFormErrors.address && (
              <p 
                className="text-sm text-red-500 mt-1"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {addressFormErrors.address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                City
              </label>
              <input
                type="text"
                name="city"
                className={`mt-1 w-full rounded-md border ${
                  addressFormErrors.city ? "border-red-300" : "border-[#6B2F1A]/20"
                } px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
                defaultValue={editingAddress?.city || ""}
                required
                style={{ fontFamily: "Poppins, sans-serif" }}
              />
              {addressFormErrors.city && (
                <p 
                  className="text-sm text-red-500 mt-1"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {addressFormErrors.city}
                </p>
              )}
            </div>
            <div>
              <label 
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                PIN/ZIP Code
              </label>
              <input
                type="text"
                name="pin"
                className={`mt-1 w-full rounded-md border ${
                  addressFormErrors.pin ? "border-red-300" : "border-[#6B2F1A]/20"
                } px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
                defaultValue={editingAddress?.pin || ""}
                required
                style={{ fontFamily: "Poppins, sans-serif" }}
              />
              {addressFormErrors.pin && (
                <p 
                  className="text-sm text-red-500 mt-1"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {addressFormErrors.pin}
                </p>
              )}
            </div>
          </div>

          <div>
            <label 
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Country
            </label>
            <Select
              name="country_id"
              defaultValue={editingAddress?.country_id?.toString() || ""}
              onValueChange={(value) => setSelectedCountry(value)}
            >
              <SelectTrigger
                className={`${
                  addressFormErrors.country_id
                    ? "border-red-300"
                    : "border-[#6B2F1A]/20"
                } focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem 
                    key={country.id} 
                    value={country.id.toString()}
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {country.country_enName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {addressFormErrors.country_id && (
              <p 
                className="text-sm text-red-500 mt-1"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {addressFormErrors.country_id}
              </p>
            )}
          </div>

          <div>
            <label 
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              State/Province
            </label>
            <Select
              name="state_id"
              defaultValue={editingAddress?.state_id?.toString() || ""}
              disabled={!selectedCountry || states.length === 0}
            >
              <SelectTrigger
                className={`${
                  addressFormErrors.state_id
                    ? "border-red-300"
                    : "border-[#6B2F1A]/20"
                } focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <SelectValue
                  placeholder={
                    !selectedCountry
                      ? "Select a country first"
                      : "Select a state"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem 
                    key={state.id} 
                    value={state.id.toString()}
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {state.state_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {addressFormErrors.state_id && (
              <p 
                className="text-sm text-red-500 mt-1"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {addressFormErrors.state_id}
              </p>
            )}
          </div>

          <div>
            <label 
              className="text-sm font-medium text-gray-700"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              className={`mt-1 w-full rounded-md border ${
                addressFormErrors.phone ? "border-red-300" : "border-[#6B2F1A]/20"
              } px-4 py-2 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]`}
              defaultValue={editingAddress?.phone || ""}
              required
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            {addressFormErrors.phone && (
              <p 
                className="text-sm text-red-500 mt-1"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {addressFormErrors.phone}
              </p>
            )}
          </div>

          <div className="flex items-center mt-2">
            <input
              id="default-address"
              name="is_default"
              type="checkbox"
              className="h-4 w-4 text-[#6B2F1A] focus:ring-[#6B2F1A] border-[#6B2F1A]/20 rounded"
              defaultChecked={editingAddress?.is_default || false}
            />
            <label
              htmlFor="default-address"
              className="ml-2 block text-sm text-gray-700"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Set as default address
            </label>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddressDialogOpen(false)}
              className="mr-2 border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updating}
              className="bg-[#6B2F1A] hover:bg-[#5A2814]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingAddress ? (
                "Update Address"
              ) : (
                "Add Address"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "addresses", label: "My Addresses", icon: MapPin },
    { id: "profile", label: "Edit Profile", icon: Edit },
  ];

  return (
    <div className="min-h-screen bg-[#F9F4F0]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <Card className="border-[#6B2F1A]/10">
              <CardContent className="p-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`w-full justify-start gap-2 mb-2 ${
                      activeTab === tab.id ? "bg-[#6B2F1A] text-white hover:bg-[#5A2814]" : "text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A]"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
                <Separator className="my-4 bg-[#6B2F1A]/10" />
                <form action={logoutUser}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "orders" && <OrdersView />}
            {activeTab === "addresses" && <AddressesView />}
            {activeTab === "profile" && <ProfileView />}
          </div>
        </div>
      </div>

      {/* Address dialog component */}
      <AddressDialog />
    </div>
  );
};

export default MyAccount;