"use client";

import { getOneSiteContent, updateSiteContent } from "@/actions/site-content";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteContentSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import {
  HomeIcon,
  ArrowLeft,
  FileText,
  Type,
  LinkIcon,
  MessageSquare,
  Save,
  Pencil,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

// Import MDEditor dynamically to avoid hydration issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false, // This ensures the component only renders on client-side
});

const EditSiteContentPage = () => {
  const { id } = useParams(); // Get content ID from URL params
  const contentId = Number(id); // Ensure it's a number
  const [contentData, setContentData] = useState(null); // Store existing content data
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    control,
    reset,
  } = useForm({
    resolver: zodResolver(SiteContentSchema),
    mode: "onChange",
    defaultValues: {
      page: "",
      title: "",
      content: "",
      link: "",
    },
  });

  // Ensure component is mounted before rendering client-side only components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch content data when the component mounts
  useEffect(() => {
    const fetchContentData = async () => {
      setIsLoading(true);
      try {
        const response = await getOneSiteContent(contentId);
        console.log("Fetched site content:", response);
        setContentData(response);

        // Reset form with existing data
        reset(response);
      } catch (error) {
        console.error("Error fetching site content data:", error);
        toast.error("Failed to load site content data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (contentId) {
      fetchContentData();
    }
  }, [contentId, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await updateSiteContent(contentId, data);
      toast.success("Site content updated successfully.");
      router.push("/admin/site-content/list-site-content");
    } catch (error) {
      console.error("Error updating site content:", error);
      toast.error("Failed to update the site content.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!contentData && isLoading) {
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
            <Pencil size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Edit Site Content
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
                href="/admin/site-content/list-site-content"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Site Content
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Content #{id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        onClick={() => router.push("/admin/site-content/list-site-content")}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Site Content
      </Button>

      {/* Main form card */}
      <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText size={18} />
            Edit Site Content #{id}
          </CardTitle>
          <CardDescription className="text-blue-100 dark:text-blue-200 flex items-center gap-1">
            <Clock size={14} />
            {contentData && contentData.updatedAt && (
              <span>
                Last Updated: {format(new Date(contentData.updatedAt), "MMMM dd, yyyy HH:mm")}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Page identifier */}
              <div className="space-y-2">
                <Label
                  htmlFor="page"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <FileText size={14} />
                  Page Identifier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="page"
                  placeholder="Enter page identifier (e.g., about, terms, privacy)"
                  {...register("page")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                    errors.page
                      ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {errors.page ? (
                  <p className="text-sm text-red-500">{errors.page?.message}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Used to identify this content. Must be unique.
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Type size={14} />
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter content title"
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
            </div>

            {/* Content - Markdown Editor */}
            <div className="space-y-2">
              <Label
                htmlFor="content"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <MessageSquare size={14} />
                Content <span className="text-red-500">*</span>
              </Label>
              <div className="border rounded-lg border-blue-200 dark:border-blue-900/50 overflow-hidden">
                {isMounted && (
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <MDEditor
                        value={field.value}
                        onChange={field.onChange}
                        preview="edit"
                        height={400}
                        visibleDragbar={false}
                        className="md-editor-custom"
                      />
                    )}
                  />
                )}
              </div>
              {errors.content && (
                <p className="text-sm text-red-500">
                  {errors.content?.message}
                </p>
              )}
            </div>

            <Separator className="my-6 bg-blue-100 dark:bg-blue-900/30" />

            {/* Link section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <LinkIcon size={16} />
                Related Link
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="link" className="text-slate-700 dark:text-slate-300">
                  Link URL
                </Label>
                <Input
                  id="link"
                  placeholder="Enter related link URL"
                  {...register("link")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.link ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.link ? (
                  <p className="text-sm text-red-500">{errors.link?.message}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add a link to reference related content or external resources.
                  </p>
                )}
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset(contentData);
                }}
                disabled={isLoading || !isDirty}
                className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Reset Changes
              </Button>

              <Button
                disabled={isLoading || (!isValid && isDirty)}
                className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white`}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    Update Content
                  </>
                )}
              </Button>
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errors.root.message}
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

export default EditSiteContentPage;