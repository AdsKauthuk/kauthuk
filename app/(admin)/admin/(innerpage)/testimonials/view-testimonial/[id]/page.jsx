"use client";

import { getOneTestimonial } from "@/actions/testimonial";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  HomeIcon,
  ArrowLeft,
  MessageSquare,
  User,
  MapPin,
  Star,
  Calendar,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
  deleteTestimonialById,
  updateTestimonialStatus,
} from "@/actions/testimonial";
import { cn } from "@/lib/utils";

const ViewTestimonialPage = () => {
  const { id } = useParams();
  const testimonialId = Number(id);
  const [testimonial, setTestimonial] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const router = useRouter();

  // Fetch testimonial data when component mounts
  useEffect(() => {
    const fetchTestimonial = async () => {
      setIsLoading(true);
      try {
        const response = await getOneTestimonial(testimonialId);
        setTestimonial(response);
      } catch (error) {
        console.error("Error fetching testimonial:", error);
        toast.error("Failed to load testimonial details");
      } finally {
        setIsLoading(false);
      }
    };

    if (testimonialId) {
      fetchTestimonial();
    }
  }, [testimonialId]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const result = await deleteTestimonialById(testimonialId);
      if (result.success) {
        toast.success("Testimonial deleted successfully");
        router.push("/admin/testimonials/list-testimonials");
      } else {
        toast.error(result.message || "Failed to delete testimonial");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setActionLoading(false);
      setDeleteConfirm(false);
    }
  };

  const toggleStatus = async () => {
    setStatusLoading(true);
    try {
      const newStatus = testimonial.status === "active" ? "inactive" : "active";
      const result = await updateTestimonialStatus(testimonialId, newStatus);

      if (result.success) {
        toast.success(
          `Testimonial ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`
        );
        setTestimonial((prev) => ({ ...prev, status: newStatus }));
      } else {
        toast.error(result.message || "Status update failed");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred while updating status");
    } finally {
      setStatusLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          size={20}
          className={
            i < rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="animate-pulse space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40" />
            <Skeleton className="h-6 w-48 bg-blue-100 dark:bg-blue-900/40" />
          </div>

          {/* Breadcrumb skeleton */}
          <Skeleton className="h-4 w-64 bg-blue-100 dark:bg-blue-900/40" />

          {/* Main card skeleton */}
          <Skeleton className="h-[600px] w-full rounded-lg bg-blue-100 dark:bg-blue-900/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageSquare size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            View Testimonial
          </h1>
        </div>
        <Breadcrumb className="text-sm text-slate-500 dark:text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/admin"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <HomeIcon size={14} />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/admin/testimonials/list-testimonials"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Testimonials
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>View Testimonial #{id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        onClick={() => router.push("/admin/testimonials/list-testimonials")}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Testimonials
      </Button>

      {testimonial && (
        <>
          {/* Main content card */}
          <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User size={18} />
                    {testimonial.name}
                  </CardTitle>
                  <CardDescription className="text-blue-100 dark:text-blue-200 flex items-center mt-1">
                    <MapPin size={14} className="mr-1" />
                    {testimonial.location}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-2",
                    testimonial.status === "active"
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50"
                      : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800"
                  )}
                >
                  {testimonial.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left column - Customer info and actions */}
                <div className="space-y-6">
                  {/* Customer photo */}
                  <div className="flex flex-col items-center">
                    <div className="h-48 w-48 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border-4 border-gray-400 dark:border-blue-900/30">
                      <User
                        size={64}
                        className="text-blue-300 dark:text-blue-700"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="bg-blue-50/70 dark:bg-blue-900/10 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rating
                    </h3>
                    <div className="flex space-x-1 mb-1">
                      {renderStars(testimonial.rating)}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {testimonial.rating} out of 5 stars
                    </p>
                  </div>

                  {/* Quick actions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Quick Actions
                    </h3>

                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start border-2",
                        testimonial.status === "active"
                          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                          : "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                      )}
                      onClick={toggleStatus}
                      disabled={statusLoading}
                    >
                      {statusLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                          Updating...
                        </>
                      ) : testimonial.status === "active" ? (
                        <>
                          <XCircle size={16} className="mr-2" />
                          Deactivate Testimonial
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Activate Testimonial
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      onClick={() =>
                        router.push(
                          `/admin/testimonials/edit-testimonial/${testimonialId}`
                        )
                      }
                    >
                      <Pencil size={16} className="mr-2" />
                      Edit Testimonial
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Testimonial
                    </Button>
                  </div>
                </div>

                {/* Right column - Testimonial content and metadata */}
                <div className="md:col-span-2 space-y-6">
                  {/* Testimonial content */}
                  <div className="bg-blue-50/70 dark:bg-blue-900/10 p-6 rounded-lg relative">
                    <Quote
                      className="absolute text-blue-200 dark:text-blue-900/50 rotate-180"
                      size={60}
                    />
                    <div className="relative ml-6 mt-6 text-slate-700 dark:text-slate-300">
                      {testimonial.description
                        .split("\n")
                        .map((paragraph, index) => (
                          <p key={index} className="mb-4">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                    <Quote
                      className="absolute bottom-2 right-2 text-blue-200 dark:text-blue-900/50"
                      size={40}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-400 dark:border-blue-900/30 rounded-lg">
                      <div className="flex items-center text-slate-700 dark:text-slate-300 gap-2 mb-1">
                        <User
                          className="text-blue-500 dark:text-blue-400"
                          size={16}
                        />
                        <span className="font-medium">Customer Name</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 ml-6">
                        {testimonial.name}
                      </p>
                    </div>

                    <div className="p-4 border border-gray-400 dark:border-blue-900/30 rounded-lg">
                      <div className="flex items-center text-slate-700 dark:text-slate-300 gap-2 mb-1">
                        <MapPin
                          className="text-blue-500 dark:text-blue-400"
                          size={16}
                        />
                        <span className="font-medium">Location</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 ml-6">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
            <AlertDialogContent className="border border-red-200 dark:border-red-900/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-800 dark:text-slate-200">
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  This action cannot be undone. This testimonial will be
                  permanently deleted from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {actionLoading ? (
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
        </>
      )}
    </div>
  );
};

export default ViewTestimonialPage;
