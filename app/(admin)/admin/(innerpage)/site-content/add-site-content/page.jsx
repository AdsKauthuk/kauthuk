"use client";

import { createSiteContent } from "@/actions/site-content";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useFetch from "@/hooks/use-fetch";
import { SiteContentSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { ArrowLeft, FileText, HomeIcon, LinkIcon, Type, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// Import MDEditor dynamically to avoid hydration issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false, // This ensures the component only renders on client-side
});

const AddSiteContentPage = () => {
  const [isMounted, setIsMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    control
  } = useForm({
    resolver: zodResolver(SiteContentSchema),
    mode: "onChange",
    defaultValues: {
      content: '',
      page: '',
      title: '',
      link: ''
    }
  });
  const router = useRouter();

  const {
    data: siteContent,
    loading: isLoading,
    error,
    fn: createSiteContentFN,
  } = useFetch(createSiteContent);

  // Ensure component is mounted before rendering client-side only components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (siteContent) {
      toast.success("Site content created successfully.");
      router.refresh();
      router.push("/admin/site-content/list-site-content");
    }
  }, [siteContent, router]);

  const onSubmit = async (data) => {
    await createSiteContentFN(data);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add New Site Content</h1>
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
              <BreadcrumbLink href="/admin/site-content/list-site-content" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Site Content
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Content</BreadcrumbPage>
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
            Content Information
          </CardTitle>
          <CardDescription className="text-blue-100 dark:text-blue-200">
            Create new site content for pages like About Us, Terms & Conditions, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Page identifier */}
              <div className="space-y-2">
                <Label htmlFor="page" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText size={14} />
                  Page Identifier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="page"
                  placeholder="Enter page identifier (e.g., about, terms, privacy)"
                  {...register("page")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.page ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
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
                <Label htmlFor="title" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Type size={14} />
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter content title"
                  {...register("title")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.title ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title?.message}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MessageSquare size={14} />
                Content <span className="text-red-500">*</span>
              </Label>
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
              {errors.content ? (
                <p className="text-sm text-red-500">{errors.content?.message}</p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use Markdown for rich formatting.
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
                ) : "Create Content"}
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
    </div>
  );
};

export default AddSiteContentPage;