"use client";

import { createSlider } from "@/actions/slider";
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
import { SliderSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, HomeIcon, Image as ImageIcon, Layers, Link as LinkIcon, Type, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const AddSliderPage = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    control,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(SliderSchema),
    mode: "onChange",
  });
  const router = useRouter();

  const {
    data: slider,
    loading: isLoading,
    error,
    fn: createSliderFN,
  } = useFetch(createSlider);

  useEffect(() => {
    if (slider) {
      toast.success("Slider created successfully.");
      router.refresh();
      router.push("/admin/slider/list-sliders");
    }
  }, [slider, router]);

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
    await createSliderFN(data);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Layers size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add New Slider</h1>
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
              <BreadcrumbLink href="/admin/slider/list-sliders" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Sliders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Slider</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        onClick={() => router.push("/admin/slider/list-sliders")}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Sliders
      </Button>

      {/* Main form card */}
      <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon size={18} />
            Slider Information
          </CardTitle>
          <CardDescription className="text-blue-100 dark:text-blue-200">
            Create a new slider to display on your homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Type size={14} />
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter slider title"
                  {...register("title")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.title ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title?.message}</p>
                )}
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Type size={14} />
                  Subtitle
                </Label>
                <Input
                  id="subtitle"
                  placeholder="Enter subtitle (optional)"
                  {...register("subtitle")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.subtitle ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.subtitle && (
                  <p className="text-sm text-red-500">{errors.subtitle?.message}</p>
                )}
              </div>
            </div>

            {/* Image upload with preview */}
            <div className="space-y-2">
              <Label htmlFor="image" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Upload size={14} />
                Image <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <Input
                      id="image"
                      type="file"
                      accept="image/png, image/jpeg"
                      {...register("image")}
                      className={`border-0 p-0 ${errors.image ? "text-red-500" : ""}`}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Supported formats: JPG, PNG. Maximum size: 2MB.
                    </p>
                  </div>
                  {errors.image && (
                    <p className="text-sm text-red-500 mt-1">{errors.image?.message}</p>
                  )}
                </div>
                
                {/* Image preview */}
                <div className="w-full md:w-1/3">
                  <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                        <ImageIcon size={40} className="mb-2" />
                        <span className="text-xs">Image preview</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

           

            <Separator className="my-6 bg-blue-100 dark:bg-blue-900/30" />

            {/* Link section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <LinkIcon size={16} />
                Link Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Href */}
                <div className="space-y-2">
                  <Label htmlFor="href" className="text-slate-700 dark:text-slate-300">
                    Image Alt
                  </Label>
                  <Input
                    id="href"
                    placeholder="Enter image link URL (optional)"
                    {...register("href")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.href ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.href && (
                    <p className="text-sm text-red-500">{errors.href?.message}</p>
                  )}
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label htmlFor="link" className="text-slate-700 dark:text-slate-300">
                    Button Link
                  </Label>
                  <Input
                    id="link"
                    placeholder="Enter button link URL (optional)"
                    {...register("link")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.link ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.link && (
                    <p className="text-sm text-red-500">{errors.link?.message}</p>
                  )}
                </div>
              </div>

              {/* Link Title */}
              <div className="space-y-2">
                <Label htmlFor="linkTitle" className="text-slate-700 dark:text-slate-300">
                  Link/Button Title
                </Label>
                <Input
                  id="linkTitle"
                  placeholder="Enter button text (optional)"
                  {...register("linkTitle")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${errors.linkTitle ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500" : ""}`}
                />
                {errors.linkTitle && (
                  <p className="text-sm text-red-500">{errors.linkTitle?.message}</p>
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
                ) : "Create Slider"}
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

export default AddSliderPage;