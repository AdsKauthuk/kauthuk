"use client";

import { getOneSlider, updateSlider } from "@/actions/slider";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SliderSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  HomeIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  PaintBucket,
  Pencil,
  SaveIcon,
  Type,
  Upload,
  FlipHorizontal
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const EditSliderPage = () => {
  const { id } = useParams(); // Get slider ID from URL params
  const sliderId = Number(id); // Ensure it's a number
  const [sliderData, setSliderData] = useState(null); // Store existing slider data
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [textColorPreview, setTextColorPreview] = useState("#FFFFFF"); // Default white text
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(SliderSchema),
    mode: "onChange",
    defaultValues: {
      textColor: "#FFFFFF", // Default white text color
      alignment: "right" // Default right alignment
    }
  });

  // Fetch slider data when the component mounts
  useEffect(() => {
    const fetchSliderData = async () => {
      setIsLoading(true);
      try {
        const response = await getOneSlider(sliderId);
        console.log("Fetched slider:", response);
        setSliderData(response);

        // Set current image if exists
        if (response.image) {
          setCurrentImage(
            `https://greenglow.in/kauthuk_test/${response.image}`
          );
        }

        // Set text color if it exists
        if (response.textColor) {
          setTextColorPreview(response.textColor);
        }

        // Reset form with existing data, but exclude the image field
        const { image, ...restData } = response;
        reset(restData);
      } catch (error) {
        console.error("Error fetching slider data:", error);
        toast.error("Failed to load slider data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (sliderId) {
      fetchSliderData();
    }
  }, [sliderId, reset]);

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

  // Text color preview
  const watchTextColor = watch("textColor");
  useEffect(() => {
    if (watchTextColor) {
      setTextColorPreview(watchTextColor);
    }
  }, [watchTextColor]);

  // Watch alignment for preview
  const watchAlignment = watch("alignment");

  const predefinedColors = [
    { label: "White", value: "#FFFFFF" },
    { label: "Black", value: "#000000" },
    { label: "Red", value: "#FF0000" },
    { label: "Blue", value: "#0000FF" },
    { label: "Green", value: "#00FF00" },
    { label: "Yellow", value: "#FFFF00" },
    { label: "Pink", value: "#FF00FF" },
    { label: "Cyan", value: "#00FFFF" },
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await updateSlider(sliderId, data);
      toast.success("Slider updated successfully.");
      router.refresh();
      router.push("/admin/slider/list-sliders");
    } catch (error) {
      console.error("Error updating slider:", error);
      toast.error("Failed to update the slider.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!sliderData && isLoading) {
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
          <Skeleton className="h-[700px] w-full rounded-lg bg-blue-100 dark:bg-blue-900/40" />
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
            Edit Slider
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
                href="/admin/slider/list-sliders"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Sliders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Slider #{id}</BreadcrumbPage>
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
            Edit Slider #{id}
          </CardTitle>
          <CardDescription className="text-blue-100 dark:text-blue-200">
            Update your slider information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="Enter slider title"
                  {...register("title")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                    errors.title
                      ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">
                    {errors.title?.message}
                  </p>
                )}
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label
                  htmlFor="subtitle"
                  className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Type size={14} />
                  Subtitle
                </Label>
                <Input
                  id="subtitle"
                  placeholder="Enter subtitle (optional)"
                  {...register("subtitle")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                    errors.subtitle
                      ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {errors.subtitle && (
                  <p className="text-sm text-red-500">
                    {errors.subtitle?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Image upload with preview */}
            <div className="space-y-2">
              <Label
                htmlFor="image"
                className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Upload size={14} />
                Image
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
                      Leave empty to keep current image. Supported formats: JPG,
                      PNG. Maximum size: 2MB.
                    </p>
                  </div>
                  {errors.image && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.image?.message}
                    </p>
                  )}
                </div>

                {/* Image preview */}
                <div className="w-full md:w-1/3 relative">
                  <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg aspect-video overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        {/* Text color preview overlay with alignment */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`w-full px-4 flex ${
                            watchAlignment === "left" ? "justify-start" : 
                            watchAlignment === "center" ? "justify-center" : 
                            "justify-end"
                          }`}>
                            <div 
                              className="px-4 py-2 text-center font-semibold text-lg shadow-md rounded" 
                              style={{ color: textColorPreview }}
                            >
                              Sample Text
                            </div>
                          </div>
                        </div>
                      </>
                    ) : currentImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={currentImage}
                          alt={sliderData?.title || "Slider image"}
                          fill
                          className="object-cover"
                        />
                        {/* Text color preview overlay for current image with alignment */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`w-full px-4 flex ${
                            watchAlignment === "left" ? "justify-start" : 
                            watchAlignment === "center" ? "justify-center" : 
                            "justify-end"
                          }`}>
                            <div 
                              className="px-4 py-2 text-center font-semibold text-lg shadow-md rounded" 
                              style={{ color: textColorPreview }}
                            >
                              Sample Text
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                        <ImageIcon size={40} className="mb-2" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  {currentImage && !imagePreview && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                      Current image
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Text Appearance Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PaintBucket size={16} />
                Text Appearance
              </h3>
              
              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="textColor" className="text-slate-700 dark:text-slate-300">
                  Text Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    {...register("textColor")}
                    className="h-10 w-16 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={watchTextColor}
                    onChange={(e) => {
                      // Update form value when hex input changes
                      const form = document.getElementById("textColor");
                      form.value = e.target.value;
                      form.dispatchEvent(new Event('input', { bubbles: true }));
                    }}
                    placeholder="#FFFFFF"
                    className="w-28"
                  />
                  
                  <div className="flex gap-1 flex-wrap">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                        onClick={() => {
                          // Update form value when preset color is clicked
                          const form = document.getElementById("textColor");
                          form.value = color.value;
                          form.dispatchEvent(new Event('input', { bubbles: true }));
                        }}
                      >
                        {watchTextColor === color.value && (
                          <div className="w-2 h-2 rounded-full bg-black border border-white"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose a color for your slider text. Select a preset or use the color picker for a custom color.
                </p>
              </div>

              {/* Text Alignment */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="alignment" className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FlipHorizontal size={14} />
                  Text Alignment
                </Label>
                <div className="flex gap-2">
                  {[
                    { value: "left", label: "Left", icon: <AlignLeft size={16} /> },
                    { value: "center", label: "Center", icon: <AlignCenter size={16} /> },
                    { value: "right", label: "Right", icon: <AlignRight size={16} /> }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setValue("alignment", option.value);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 border ${
                        watch("alignment") === option.value 
                          ? "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400" 
                          : "border-gray-300 dark:border-gray-700"
                      } rounded-md transition-colors`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose how to align the text on your slider.
                </p>
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
                  <Label
                    htmlFor="href"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Image Alt
                  </Label>
                  <Input
                    id="href"
                    placeholder="Enter image link URL (optional)"
                    {...register("href")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                      errors.href
                        ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.href && (
                    <p className="text-sm text-red-500">
                      {errors.href?.message}
                    </p>
                  )}
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label
                    htmlFor="link"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Button Link
                  </Label>
                  <Input
                    id="link"
                    placeholder="Enter button link URL (optional)"
                    {...register("link")}
                    className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                      errors.link
                        ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.link && (
                    <p className="text-sm text-red-500">
                      {errors.link?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Link Title */}
              <div className="space-y-2">
                <Label
                  htmlFor="linkTitle"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Link/Button Title
                </Label>
                <Input
                  id="linkTitle"
                  placeholder="Enter button text (optional)"
                  {...register("linkTitle")}
                  className={`border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 ${
                    errors.linkTitle
                      ? "border-red-300 dark:border-red-800 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {errors.linkTitle && (
                  <p className="text-sm text-red-500">
                    {errors.linkTitle?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const { image, ...restData } = sliderData;
                  reset(restData);
                  setImagePreview(null);
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
                    <SaveIcon size={16} className="mr-1" />
                    Update Slider
                  </>
                )}
              </Button>
            </div>

            {/* Error Message */}
            {errors && errors.message && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errors.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSliderPage;