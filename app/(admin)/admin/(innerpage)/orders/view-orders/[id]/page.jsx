"use client";
// pages/admin/orders/[id].js
import React, { useState } from "react";
import {
  ChevronLeft,
  Package,
  Truck,
  CreditCard,
  CalendarClock,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Edit,
  Printer,
  Mail,
  ArrowDownToLine,
  ClipboardCheck,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminOrderDetailPage() {
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("TRK9876543210");
  const [orderStatus, setOrderStatus] = useState("In Transit");

  // Mock data - in a real app you would fetch this from your API
  const order = {
    id: "#ORD-12345",
    date: "February 23, 2025",
    status: orderStatus,
    paymentMethod: "Visa •••• 4242",
    paymentStatus: "Paid",
    items: [
      {
        id: 1,
        name: "Premium Noise-Cancelling Headphones",
        sku: "SKU-NC-HP-01",
        price: 249.99,
        quantity: 1,
        stock: 45,
        image: "https://images.pexels.com/photos/173301/pexels-photo-173301.jpeg",
      },
      {
        id: 2,
        name: "Wireless Charging Stand",
        sku: "SKU-WCS-02",
        price: 59.99,
        quantity: 2,
        stock: 112,
        image: "https://images.pexels.com/photos/173301/pexels-photo-173301.jpeg",
      },
    ],
    subtotal: 369.97,
    shipping: 12.99,
    tax: 30.25,
    total: 413.21,
    shippingAddress: {
      name: "Alex Johnson",
      street: "123 Tech Avenue",
      city: "San Francisco",
      state: "CA",
      zip: "94107",
      country: "United States",
      phone: "+1 (415) 555-1234",
    },
    billingAddress: {
      name: "Alex Johnson",
      street: "123 Tech Avenue",
      city: "San Francisco",
      state: "CA",
      zip: "94107",
      country: "United States",
    },
    customerInfo: {
      id: "CUST-5678",
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      phone: "+1 (415) 555-1234",
      totalOrders: 5,
      memberSince: "January 15, 2023",
    },
    trackingNumber: trackingNumber,
    estimatedDelivery: "February 28, 2025",
    orderHistory: [
      {
        date: "February 23, 2025 - 10:15 AM",
        status: "Order Placed",
        note: "Order received and payment verified",
      },
      {
        date: "February 23, 2025 - 2:30 PM",
        status: "Processing",
        note: "Order sent to warehouse for fulfillment",
      },
      {
        date: "February 24, 2025 - 9:45 AM",
        status: "In Transit",
        note: "Package picked up by shipping carrier",
      },
    ],
  };

  // Function to determine badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "In Transit":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Returned":
        return "bg-purple-100 text-purple-800";
      case "On Hold":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (value) => {
    setOrderStatus(value);
    toast({
      title: "Order Status Updated",
      description: `Order ${order.id} status changed to ${value}`,
    });
  };

  const handleSaveTracking = () => {
    setIsEditingTracking(false);
    toast({
      title: "Tracking Information Updated",
      description: "The tracking number has been updated successfully.",
    });
  };

  const handleAddNote = () => {
    toast({
      title: "Note Added",
      description: "Your note has been added to the order history.",
    });
  };

  const handleSendEmail = () => {
    toast({
      title: "Email Sent",
      description: "Tracking information has been sent to the customer.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header section */}
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button
            variant="ghost"
            className="flex items-center text-sm mb-4 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Orders List
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order {order.id}</h1>
            <p className="text-gray-500 text-sm mt-1">Placed on {order.date}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Cancel Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Order {order.id}</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this order? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="cancel-reason">Reason for cancellation</Label>
                  <Select>
                    <SelectTrigger id="cancel-reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer-request">
                        Customer Request
                      </SelectItem>
                      <SelectItem value="out-of-stock">
                        Item Out of Stock
                      </SelectItem>
                      <SelectItem value="payment-issue">
                        Payment Issue
                      </SelectItem>
                      <SelectItem value="fraudulent">
                        Fraudulent Order
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    className="mt-4"
                    placeholder="Additional notes about the cancellation..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Confirm Cancellation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="mr-6">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <div className="flex items-center mt-1">
              <Select value={orderStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mr-6">
            <p className="text-sm font-medium text-gray-500">Payment</p>
            <div className="flex items-center mt-1">
              <Badge className="bg-green-100 text-green-800">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Customer</p>
            <div className="flex items-center mt-1">
              <Link
                href={`/admin/customers/${order.customerInfo.id}`}
                className="text-blue-600 hover:underline"
              >
                {order.customerInfo.name}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Email to Customer</DialogTitle>
                <DialogDescription>
                  Send an update about this order to {order.customerInfo.email}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    defaultValue={`Update on your order ${order.id}`}
                  />
                </div>
                <div>
                  <Label htmlFor="email-template">Email Template</Label>
                  <Select defaultValue="tracking">
                    <SelectTrigger id="email-template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tracking">
                        Tracking Information
                      </SelectItem>
                      <SelectItem value="delayed">Shipment Delayed</SelectItem>
                      <SelectItem value="delivered">Order Delivered</SelectItem>
                      <SelectItem value="custom">Custom Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email-message">Message</Label>
                  <Textarea
                    id="email-message"
                    defaultValue={`Hello ${order.customerInfo.name},\n\nYour order ${order.id} has been shipped and is on its way to you. You can track your package using the following tracking number: ${order.trackingNumber}\n\nEstimated delivery date: ${order.estimatedDelivery}\n\nThank you for your purchase!`}
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSendEmail}>Send Email</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order details tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="items">Order Items</TabsTrigger>
              <TabsTrigger value="shipment">Shipment</TabsTrigger>
              <TabsTrigger value="history">Order History</TabsTrigger>
            </TabsList>

            {/* Order Items Tab */}
            <TabsContent value="items" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Items ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">In Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 mr-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="truncate max-w-xs">
                                {item.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {item.sku}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                item.stock > 20 ? "outline" : "destructive"
                              }
                            >
                              {item.stock}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipment Tab */}
            <TabsContent value="shipment" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shipment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <Truck className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Shipment Status</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        {isEditingTracking ? (
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={trackingNumber}
                              onChange={(e) =>
                                setTrackingNumber(e.target.value)
                              }
                              className="max-w-xs"
                            />
                            <Button size="sm" onClick={handleSaveTracking}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsEditingTracking(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <p className="text-sm text-gray-500">
                                Tracking Number:
                              </p>
                              <p className="font-medium">{trackingNumber}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsEditingTracking(true)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center mt-2">
                          <CalendarClock className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm">
                            Estimated Delivery: {order.estimatedDelivery}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Truck className="h-4 w-4" />
                            Track Package
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <RefreshCcw className="h-4 w-4" />
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        Shipping Address
                      </h3>
                      <p className="text-sm">
                        {order.shippingAddress.name}
                        <br />
                        {order.shippingAddress.street}
                        <br />
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.zip}
                        <br />
                        {order.shippingAddress.country}
                        <br />
                        {order.shippingAddress.phone}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                        Billing Address
                      </h3>
                      <p className="text-sm">
                        {order.billingAddress.name}
                        <br />
                        {order.billingAddress.street}
                        <br />
                        {order.billingAddress.city},{" "}
                        {order.billingAddress.state} {order.billingAddress.zip}
                        <br />
                        {order.billingAddress.country}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order History Tab */}
            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderHistory.map((event, index) => (
                      <div key={index} className="relative pl-6 pb-4">
                        {index !== order.orderHistory.length - 1 && (
                          <div className="absolute left-2 top-2 w-0.5 h-full bg-gray-200"></div>
                        )}
                        <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-500"></div>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="font-medium">{event.status}</h4>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {event.note}
                            </p>
                          </div>
                          <p className="text-sm text-gray-400 mt-1 md:mt-0 md:ml-4">
                            {event.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-2">
                      Add Note to Order History
                    </h4>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Enter a note about this order..."
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleAddNote}>Add Note</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Order summary and customer info */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Payment Information</h4>
                <div className="flex items-center text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{order.paymentMethod}</span>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600">
                    Payment {order.paymentStatus}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
              <Button className="w-full" variant="outline">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Mark as Fulfilled
              </Button>
            </CardFooter>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium">{order.customerInfo.name}</h3>
                  <p className="text-sm text-gray-500">
                    Customer ID: {order.customerInfo.id}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      {order.customerInfo.email}
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {order.customerInfo.phone}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm space-y-1">
                    <p>
                      Total Orders:{" "}
                      <span className="font-medium">
                        {order.customerInfo.totalOrders}
                      </span>
                    </p>
                    <p>
                      Member Since:{" "}
                      <span className="font-medium">
                        {order.customerInfo.memberSince}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href={`/admin/customers/${order.customerInfo.id}`}
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  View Customer Profile
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
