"use client";

import { createBlog } from "@/actions/blog";
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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { BlogSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { format } from "date-fns";
import {
  CalendarIcon,
  HomeIcon,
  ArrowLeft,
  FileText,
  Type,
  Upload,
  Calendar,
  PenTool,
  Save,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import "react-day-picker/style.css";
const AddBlogPage = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    control,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(BlogSchema),
    mode: "onChange",
  });
  const router = useRouter();

  const {
    data: blog,
    loading: isLoading,
    error,
    fn: createBlogFN,
  } = useFetch(createBlog);

  useEffect(() => {
    if (blog) {
      toast.success("Blog created successfully.");
      router.refresh();
      router.push("/admin/blog/list-blogs");
    }
  }, [blog, router]);

  // Image preview
  const watchImage = watch("image");
  useEffect(() => {
    if (watchImage && watchImage[0]) {
      const file = watchImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [watchImage]);

  const onSubmit = async (data) => {
    await createBlogFN(data);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Create New Blog Post
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
                href="/admin/blog/list-blogs"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Blog
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Blog</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        onClick={() => router.push("/admin/blog/list-blogs")}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Blogs
      </Button>

      {/* Main form card */}
      <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PenTool size={18} />
            Blog Post Information
          </CardTitle>
          <CardDescription className="text-blue-100 dark:text-blue-200">
            Create a new blog post for your website
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Type size={14} />
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter blog title"
                {...register("title")}
                className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                  errors.title
                    ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title?.message}</p>
              )}
            </div>

            {/* Image upload with preview */}
            <div className="space-y-2">
              <Label
                htmlFor="image"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Upload size={14} />
                Featured Image <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <Input
                      id="image"
                      type="file"
                      accept="image/png, image/jpeg"
                      {...register("image")}
                      className={`border-0 p-0 ${
                        errors.image ? "text-red-500" : ""
                      }`}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Supported formats: JPG, PNG. Maximum size: 2MB.
                    </p>
                  </div>
                  {errors.image && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.image?.message}
                    </p>
                  )}
                </div>

                {/* Image preview */}
                <div className="w-full md:w-1/3">
                  <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                        <FileText size={40} className="mb-2" />
                        <span className="text-xs">Image preview</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Publication Date */}
            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Calendar size={14} />
                Publication Date <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-full md:w-[300px] justify-start text-left font-normal border-blue-200 dark:border-blue-900/50",
                          !field.value && "text-slate-500 dark:text-slate-400",
                          errors.date && "border-red-300 dark:border-red-800"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                        {field.value ? (
                          format(field.value, "LLL dd, y")
                        ) : (
                          <span>Select publication date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border-blue-200 dark:border-blue-900/50"
                      align="start"
                    >
                      <DayPicker
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        classNames={{
                          chevron: "fill-blue-500",
                          range_middle: "bg-blue-400",
                          day_button: "border-none",
                          today: "border-2 border-blue-700",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date?.message}</p>
              )}
            </div>

            {/* Description - Markdown Editor */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <PenTool size={14} />
                Content <span className="text-red-500">*</span>
              </Label>
              <div className="border rounded-lg border-blue-200 dark:border-blue-900/50 overflow-hidden">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <MDEditor
                      autoCapitalize="none"
                      value={field.value}
                      onChange={field.onChange}
                      preview="edit"
                      height={400}
                      visibleDragbar={false}
                      className="md-editor-custom"
                      hideToolbar={false}
                    />
                  )}
                />
              </div>
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description?.message}
                </p>
              )}
            </div>

            {/* Submit & Reset Buttons */}
            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isLoading || !isDirty}
                className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Reset Form
              </Button>

              <Button
                disabled={isLoading || (!isValid && isDirty)}
                className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white`}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    Create Blog
                  </>
                )}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Custom styling for MDEditor */}
      <style jsx global>{`
        .w-md-editor {
          --md-editor-bg-color: transparent !important;
          --md-editor-border-color: transparent !important;
          --md-editor-toolbar-bg: #eef2ff !important;
          --md-editor-toolbar-hover-color: rgba(59, 130, 246, 0.1) !important;
          --md-editor-toolbar-active-color: rgba(59, 130, 246, 0.2) !important;
          --md-editor-toolbar-color: #2563eb !important;
          box-shadow: none !important;
        }

        .dark .w-md-editor {
          --md-editor-toolbar-bg: rgba(30, 58, 138, 0.3) !important;
          --md-editor-toolbar-color: #60a5fa !important;
          color: #e2e8f0 !important;
        }

        .w-md-editor-toolbar {
          border-bottom: 1px solid #bfdbfe !important;
        }

        .dark .w-md-editor-toolbar {
          border-bottom: 1px solid rgba(30, 58, 138, 0.5) !important;
        }

        .w-md-editor-text {
          padding: 20px !important;
        }

        .w-md-editor-text-pre,
        .w-md-editor-text-input,
        .w-md-editor-text-pre > code {
          font-family: ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", Roboto !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
        }

        .dark .w-md-editor-text-pre,
        .dark .w-md-editor-text-input,
        .dark .w-md-editor-text-pre > code {
          color: #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
};

export default AddBlogPage;
