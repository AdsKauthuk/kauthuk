"use client";

import { createTestimonial } from "@/actions/testimonial";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { 
  HomeIcon, 
  ArrowLeft, 
  MessageSquare, 
  Upload, 
  User, 
  MapPin, 
  Star, 
  Save,
  CheckCircle
} from "lucide-react";
import * as z from "zod";

// Validation schema
const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  rating: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 1 && parseInt(val) <= 5, {
    message: "Rating must be between 1 and 5",
  }),
  status: z.boolean().default(true),
});

const AddTestimonialPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    control,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      rating: "5",
      status: true,
    },
    mode: "onChange",
  });

 

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Convert rating to number and status to string
      const formData = {
        ...data,
        rating: parseInt(data.rating),
        status: data.status ? "active" : "inactive",
      };
      
      const result = await createTestimonial(formData);
      
      if (result) {
        toast.success("Testimonial created successfully");
        reset();
        router.push("/admin/testimonials/list-testimonials");
      } else {
        toast.error("Failed to create testimonial");
      }
    } catch (error) {
      console.error("Error creating testimonial:", error);
      toast.error(error.message || "An error occurred while creating the testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={20}
        className={i < count 
          ? "text-yellow-400 fill-yellow-400" 
          : "text-slate-300 dark:text-slate-600"
        }
      />
    ));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageSquare size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add New Testimonial</h1>
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
              <BreadcrumbLink href="/admin/testimonials/list-testimonials" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Testimonials
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Testimonial</BreadcrumbPage>
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

      {/* Main form card */}
      <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare size={18} />
            Customer Testimonial Information
          </CardTitle>
          <CardDescription className="text-blue-100 dark:text-blue-200">
            Add a new customer testimonial to display on your website
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User size={14} />
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  {...register("name")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.name ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin size={14} />
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  {...register("location")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.location ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>

            

            {/* Testimonial Text */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MessageSquare size={14} />
                Testimonial Text <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter the testimonial content..."
                {...register("description")}
                className={`min-h-24 border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.description ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Star size={14} />
                  Rating <span className="text-red-500">*</span>
                </Label>
                
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                          <Label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer">
                            <div className="flex space-x-1 ml-2">
                              {renderStars(rating)}
                            </div>
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                              ({rating} {rating === 1 ? "star" : "stars"})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                
                {errors.rating && (
                  <p className="text-sm text-red-500">{errors.rating.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-4">
                <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CheckCircle size={14} />
                  Status
                </Label>
                
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Show this testimonial on the website
                      </p>
                    </div>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="bg-slate-200 data-[state=checked]:bg-blue-600 dark:bg-slate-700"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="pt-4 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  reset();
                }} 
                disabled={isSubmitting || !isDirty}
                className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Reset Form
              </Button>
              
              <Button
                disabled={isSubmitting || (!isValid && isDirty)}
                className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white`}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    Create Testimonial
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTestimonialPage;