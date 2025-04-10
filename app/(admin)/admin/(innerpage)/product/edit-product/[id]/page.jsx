"use client";

import {
  getOneProduct,
  updateProduct,
  getCategoriesAndSubcategories,
  getProductAttributes,
} from "@/actions/product";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createProductSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { format } from "date-fns";
import {
  HomeIcon,
  ArrowLeft,
  Package,
  Type,
  Upload,
  PenTool,
  Save,
  Pencil,
  Image as ImageIcon,
  Tag,
  DollarSign,
  CheckCircle2,
  Settings,
  Truck,
  ShoppingCart,
  Layers,
  CircleDollarSign,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EditProductPage = () => {
  const { id } = useParams(); // Get product ID from URL params
  const productId = Number(id); // Ensure it's a number
  const [productData, setProductData] = useState(null); // Store existing product data
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [productImagePreviews, setProductImagePreviews] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const router = useRouter();

  // Initialize form with react-hook-form and zod validation
  const form = useForm({
    resolver: zodResolver(createProductSchema),
    mode: "onChange",
    defaultValues: {
      cat_id: "",
      subcat_id: "",
      title: "",
      description: "",
      status: "active",
      hasVariants: false,
      base_price: "",
      price_rupees: "",
      price_dollars: "",
      stock_count: 0,
      stock_status: "yes",
      quantity_limit: 10,
      terms_condition: "",
      highlights: "",
      meta_title: "",
      meta_keywords: "",
      meta_description: "",
      hsn_code: "",
      tax: "",
      weight: "",
      free_shipping: "no",
      cod: "yes",
      images: [],
      imagesToDelete: [],
      variantsToDelete: [],
      attributes: [],
      variants: [],
    },
  });

  // Watch for changes to hasVariants and category
  const watchHasVariants = form.watch("hasVariants");
  const watchCategoryId = form.watch("cat_id");

  // Fetch categories, subcategories, and attributes on page load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const categoriesData = await getCategoriesAndSubcategories();
        setCategories(categoriesData);

        const attributesData = await getProductAttributes();
        setAttributes(attributesData);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load form data. Please refresh the page.");
      }
    }

    loadInitialData();
  }, []);

  // Fetch product data when the component mounts
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const product = await getOneProduct(productId);
        setProductData(product);

        // Set up existing images
        if (product.ProductImages && product.ProductImages.length > 0) {
          const images = product.ProductImages.map((img) => ({
            id: img.id,
            path: img.image_path,
            url: `https://greenglow.in/kauthuk_test/${img.image_path}`,
          }));
          setCurrentImages(images);
        }

        // Set up attributes
        if (
          product.ProductAttributes &&
          product.ProductAttributes.length > 0 &&
          attributes.length > 0
        ) {
          const mappedAttributes = product.ProductAttributes.map((attr) => {
            const attributeDetails = attributes.find(
              (a) => a.id === attr.attribute_id
            );
            const values = attr.ProductAttributeValues
              ? attr.ProductAttributeValues.map((val) => ({
                  attribute_value_id: val.attribute_value_id,
                  price_adjustment_rupees: val.price_adjustment_rupees,
                  price_adjustment_dollars: val.price_adjustment_dollars,
                }))
              : [];

            return {
              attribute_id: attr.attribute_id,
              is_required: attr.is_required,
              values: values,
              attribute: attributeDetails,
            };
          });

          setSelectedAttributes(mappedAttributes);
        }

        // Set up variants
        if (
          product.hasVariants &&
          product.ProductVariants &&
          product.ProductVariants.length > 0
        ) {
          const mappedVariants = product.ProductVariants.map((variant) => {
            // Map variant images if any
            const variantImages =
              variant.ProductImages?.length > 0
                ? variant.ProductImages.map((img) => ({
                    id: img.id,
                    path: img.image_path,
                    url: `https://greenglow.in/kauthuk_test/${img.image_path}`,
                  }))
                : [];

            return {
              id: variant.id,
              sku: variant.sku,
              price_rupees: variant.price_rupees.toString(),
              price_dollars: variant.price_dollars.toString(),
              stock_count: variant.stock_count,
              stock_status: variant.stock_status,
              weight: variant.weight?.toString() || "",
              is_default: variant.is_default,
              attribute_values:
                variant.VariantAttributeValues?.map((val) => ({
                  attribute_value_id: val.attribute_value_id,
                })) || [],
              images: [],
              existingImages: variantImages,
              imagePreviews: [],
            };
          });

          setVariants(mappedVariants);
        } else {
          // Initialize with a single variant for new variants
          setVariants([
            {
              id: "new-1",
              sku: "",
              price_rupees: "",
              price_dollars: "",
              stock_count: 0,
              stock_status: "yes",
              weight: "",
              is_default: true,
              attribute_values: [],
              images: [],
              existingImages: [],
              imagePreviews: [],
            },
          ]);
        }

        // Update hasVariants state
        setHasVariants(product.hasVariants);

        // Set form values correctly
        // Convert string IDs to actual strings for form fields
        const formData = {
          ...product,
          cat_id: product.cat_id?.toString() || "",
          subcat_id: product.subcat_id?.toString() || "",
        };

        // Reset the form with the product data, but exclude images
        const {
          ProductImages,
          ProductVariants,
          ProductAttributes,
          ...restData
        } = formData;
        form.reset(restData);

        // Load subcategories based on selected category
        if (product.cat_id) {
          const selectedCategory = categories.find(
            (cat) => cat.id === product.cat_id
          );
          if (selectedCategory && selectedCategory.SubCategory) {
            setSubcategories(selectedCategory.SubCategory);
          }
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        toast.error("Failed to load product data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (productId && attributes.length > 0) {
      fetchProductData();
    }
  }, [productId, attributes, categories, form]);

  // Update subcategories when category changes
  useEffect(() => {
    if (watchCategoryId) {
      const selectedCategory = categories.find(
        (cat) => cat.id === parseInt(watchCategoryId)
      );
      if (selectedCategory) {
        setSubcategories(selectedCategory.SubCategory || []);
        form.setValue("subcat_id", ""); // Reset subcategory selection
      }
    }
  }, [watchCategoryId, categories, form]);

  // Update hasVariants state when form value changes
  useEffect(() => {
    setHasVariants(watchHasVariants);
  }, [watchHasVariants]);

  // Handle image selection for product
  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Update form value
      const currentImages = form.getValues("images") || [];
      form.setValue("images", [...currentImages, ...files]);

      // Create preview URLs
      const newPreviews = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));

      setProductImagePreviews([...productImagePreviews, ...newPreviews]);
    }
  };

  // Handle removing a product image preview
  const handleRemoveProductImagePreview = (index) => {
    const currentImages = form.getValues("images");
    const updatedImages = [...currentImages];
    updatedImages.splice(index, 1);
    form.setValue("images", updatedImages);

    // Also update previews
    const updatedPreviews = [...productImagePreviews];
    URL.revokeObjectURL(updatedPreviews[index].url); // Clean up URL object
    updatedPreviews.splice(index, 1);
    setProductImagePreviews(updatedPreviews);
  };

  // Handle removing an existing product image
  const handleRemoveExistingImage = (index) => {
    const updatedImages = [...currentImages];

    // Add the image ID to a list of images to delete when submitting
    const imagesToDelete = form.getValues("imagesToDelete") || [];
    form.setValue("imagesToDelete", [
      ...imagesToDelete,
      currentImages[index].id,
    ]);

    updatedImages.splice(index, 1);
    setCurrentImages(updatedImages);
  };

  // Handle attribute selection
  const handleAttributeSelection = (attributeId, isChecked) => {
    if (isChecked) {
      // Add attribute to selected list
      const attribute = attributes.find((attr) => attr.id === attributeId);
      if (attribute) {
        setSelectedAttributes([
          ...selectedAttributes,
          {
            attribute_id: attribute.id,
            is_required: false,
            values: [],
            attribute: attribute,
          },
        ]);
      }
    } else {
      // Remove attribute from selected list
      setSelectedAttributes(
        selectedAttributes.filter((attr) => attr.attribute_id !== attributeId)
      );
    }
  };

  // Handle attribute value selection
  const handleAttributeValueSelection = (
    attributeIndex,
    valueId,
    isChecked
  ) => {
    const updatedAttributes = [...selectedAttributes];
    const attribute = updatedAttributes[attributeIndex];

    if (isChecked) {
      // Add value
      attribute.values.push({
        attribute_value_id: valueId,
        price_adjustment_rupees: "",
        price_adjustment_dollars: "",
      });
    } else {
      // Remove value
      const valueIndex = attribute.values.findIndex(
        (v) => v.attribute_value_id === valueId
      );
      if (valueIndex !== -1) {
        attribute.values.splice(valueIndex, 1);
      }
    }

    setSelectedAttributes(updatedAttributes);
  };

  // Handle variant attribute value selection
  const handleVariantAttributeValue = (variantIndex, attributeId, valueId) => {
    const updatedVariants = [...variants];
    const variant = updatedVariants[variantIndex];

    // Check if there's already a value for this attribute
    const existingValueIndex = variant.attribute_values.findIndex(
      (av) =>
        attributes
          .find((attr) => attr.id === attributeId)
          ?.AttributeValues.find((val) => val.id === av.attribute_value_id)
          ?.attribute_id === attributeId
    );

    if (existingValueIndex !== -1) {
      // Update existing attribute value
      variant.attribute_values[existingValueIndex].attribute_value_id = valueId;
    } else {
      // Add new attribute value
      variant.attribute_values.push({
        attribute_value_id: valueId,
      });
    }

    setVariants(updatedVariants);
  };

  // Add a new variant
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `new-${variants.length + 1}`,
        sku: "",
        price_rupees: "",
        price_dollars: "",
        stock_count: 0,
        stock_status: "yes",
        weight: "",
        is_default: false,
        attribute_values: [],
        images: [],
        existingImages: [],
        imagePreviews: [],
      },
    ]);
  };

  // Remove a variant
  const removeVariant = (index) => {
    const updatedVariants = [...variants];

    // If removing the default variant, set the first remaining one as default
    if (updatedVariants[index].is_default && updatedVariants.length > 1) {
      const newDefaultIndex = index === 0 ? 1 : 0;
      updatedVariants[newDefaultIndex].is_default = true;
    }

    // Clean up image previews
    updatedVariants[index].imagePreviews.forEach((preview) => {
      URL.revokeObjectURL(preview.url);
    });

    // If it's an existing variant, add to variantsToDelete
    if (typeof updatedVariants[index].id === "number") {
      const variantsToDelete = form.getValues("variantsToDelete") || [];
      form.setValue("variantsToDelete", [
        ...variantsToDelete,
        updatedVariants[index].id,
      ]);
    }

    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  // Set variant as default
  const setVariantAsDefault = (index) => {
    const updatedVariants = [...variants];
    updatedVariants.forEach((variant, i) => {
      variant.is_default = i === index;
    });
    setVariants(updatedVariants);
  };

  // Handle variant image selection
  const handleVariantImageSelection = (variantIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const updatedVariants = [...variants];

      // Update variant images
      updatedVariants[variantIndex].images = [
        ...updatedVariants[variantIndex].images,
        ...files,
      ];

      // Create preview URLs
      const newPreviews = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));

      updatedVariants[variantIndex].imagePreviews = [
        ...(updatedVariants[variantIndex].imagePreviews || []),
        ...newPreviews,
      ];

      setVariants(updatedVariants);
    }
  };

  // Handle removing a variant image preview
  const handleRemoveVariantImagePreview = (variantIndex, imageIndex) => {
    const updatedVariants = [...variants];

    // Remove image
    updatedVariants[variantIndex].images.splice(imageIndex, 1);

    // Remove and clean up preview
    URL.revokeObjectURL(
      updatedVariants[variantIndex].imagePreviews[imageIndex].url
    );
    updatedVariants[variantIndex].imagePreviews.splice(imageIndex, 1);

    setVariants(updatedVariants);
  };

  // Handle removing an existing variant image
  const handleRemoveExistingVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...variants];
    const variantImage =
      updatedVariants[variantIndex].existingImages[imageIndex];

    // Add to list of images to delete
    const imagesToDelete = form.getValues("imagesToDelete") || [];
    form.setValue("imagesToDelete", [...imagesToDelete, variantImage.id]);

    // Remove from the existing images array
    updatedVariants[variantIndex].existingImages.splice(imageIndex, 1);
    setVariants(updatedVariants);
  };

  // Update variant field
  const updateVariantField = (variantIndex, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex][field] = value;
    setVariants(updatedVariants);
  };

  // Prepare form data with selected attributes and variants
  const prepareFormData = (data) => {
    // Add selected attributes
    data.attributes = selectedAttributes.map((attr) => ({
      attribute_id: attr.attribute_id,
      is_required: attr.is_required,
      values: attr.values,
    }));

    // Add variants if hasVariants is true
    if (data.hasVariants) {
      data.variants = variants.map((variant) => ({
        id: typeof variant.id === "number" ? variant.id : undefined, // Only include ID if it's a number (existing variant)
        sku: variant.sku,
        price_rupees: variant.price_rupees,
        price_dollars: variant.price_dollars,
        stock_count: variant.stock_count,
        stock_status: variant.stock_status,
        weight: variant.weight,
        is_default: variant.is_default,
        attribute_values: variant.attribute_values,
        images: variant.images,
      }));
    }

    return data;
  };

  // Reset the form to its initial state with product data
  const resetForm = () => {
    if (productData) {
      const { ProductImages, ProductVariants, ProductAttributes, ...restData } =
        productData;
      form.reset(restData);

      // Reset image previews
      productImagePreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.url)
      );
      setProductImagePreviews([]);

      // Reload current images
      if (ProductImages && ProductImages.length > 0) {
        const images = ProductImages.map((img) => ({
          id: img.id,
          path: img.image_path,
          url: `https://greenglow.in/kauthuk_test/${img.image_path}`,
        }));
        setCurrentImages(images);
      }

      // Reset variants and attributes to original state
      // This would require reloading the product data
      router.refresh();
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Prepare complete form data
      const completeData = prepareFormData(data);

      // Send data to server
      await updateProduct(productId, completeData);

      toast.success("Product updated successfully!");
      router.push("/admin/product/list-products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        error.message || "Failed to update product. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check form completion status for each tab
  const isBasicInfoComplete = () => {
    const fields = [
      "title",
      "cat_id",
      "subcat_id",
      "description",
      "price_rupees",
      "price_dollars",
    ];
    return fields.every(
      (field) => form.getValues(field) && !form.getFieldState(field).error
    );
  };

  const isImagesComplete = () => {
    return productImagePreviews.length > 0 || currentImages.length > 0;
  };

  const isAttributesComplete = () => {
    // Check if variant attributes have values selected when hasVariants is true
    if (hasVariants) {
      const variantAttributes = selectedAttributes.filter(
        (attr) => attr.attribute?.is_variant
      );
      return variantAttributes.every(
        (attr) => attr.values && attr.values.length > 0
      );
    }
    return true; // Not required if no variants
  };

  const isVariantsComplete = () => {
    if (!hasVariants) return true;
    return variants.every(
      (variant) =>
        variant.sku &&
        variant.price_rupees &&
        variant.price_dollars &&
        variant.attribute_values.length > 0
    );
  };

  // Destructure form methods
  const { reset } = form;

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
          <Skeleton className="h-[800px] w-full rounded-lg bg-blue-100 dark:bg-blue-900/40" />
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
            Edit Product
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
                href="/admin/product/list-products"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Products
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Product #{id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        onClick={() => router.push("/admin/product/list-products")}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Products
      </Button>

      {/* Form completion progress */}
      <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Form Completion
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {
                [
                  isBasicInfoComplete(),
                  isImagesComplete(),
                  isAttributesComplete(),
                  hasVariants ? isVariantsComplete() : true,
                ].filter(Boolean).length
              }{" "}
              of {hasVariants ? 4 : 3} sections complete
            </span>
          </div>
          <div className="h-2 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
              style={{
                width: `${
                  (((isBasicInfoComplete() ? 1 : 0) +
                    (isImagesComplete() ? 1 : 0) +
                    (isAttributesComplete() ? 1 : 0) +
                    (hasVariants ? (isVariantsComplete() ? 1 : 0) : 0)) /
                    (hasVariants ? 4 : 3)) *
                  100
                }%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 mb-8 h-auto border border-gray-400 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
              >
                Images
              </TabsTrigger>
              <TabsTrigger
                value="attributes"
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
              >
                Attributes
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                disabled={!hasVariants}
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm disabled:opacity-50"
              >
                Variants
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
              >
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Type size={18} />
                    Basic Product Information
                  </CardTitle>
                  <CardDescription className="text-blue-100 dark:text-blue-200">
                    Update the essential details about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Type size={14} />
                            Product Title{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product title"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Clock size={14} />
                            Status
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-400 dark:border-blue-900">
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                  Inactive
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cat_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Tag size={14} />
                            Category <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-400 dark:border-blue-900">
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                  >
                                    {category.catName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcat_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Layers size={14} />
                            Subcategory <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={
                                !watchCategoryId || subcategories.length === 0
                              }
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                <SelectValue placeholder="Select subcategory" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-400 dark:border-blue-900">
                                {subcategories.map((subcategory) => (
                                  <SelectItem
                                    key={subcategory.id}
                                    value={subcategory.id.toString()}
                                  >
                                    {subcategory.subcategory}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <PenTool size={14} />
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <div className="border rounded-lg border-blue-200 dark:border-blue-900/50 overflow-hidden">
                      <Controller
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                          <MDEditor
                            autoCapitalize="none"
                            value={field.value}
                            onChange={field.onChange}
                            preview="edit"
                            height={300}
                            visibleDragbar={false}
                            className="md-editor-custom"
                            hideToolbar={false}
                          />
                        )}
                      />
                    </div>
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.description?.message}
                      </p>
                    )}
                  </div>

                  <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="base_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <CircleDollarSign size={14} />
                            Base Price <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price_rupees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <DollarSign size={14} />
                            Price (₹) <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price_dollars"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <DollarSign size={14} />
                            Price ($) <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="stock_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Package size={14} />
                            Stock Count
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            Stock Status
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-400 dark:border-blue-900">
                                <SelectItem value="yes">In Stock</SelectItem>
                                <SelectItem value="no">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity_limit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Package size={14} />
                            Quantity Limit
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              min="1"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-slate-500 dark:text-slate-400">
                            Maximum quantity per order
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="free_shipping"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Truck size={14} />
                            Free Shipping
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-400 dark:border-blue-900">
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <ShoppingCart size={14} />
                            Cash on Delivery
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent className="border-gray-400 dark:border-blue-900">
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Tag
                        size={14}
                        className="text-blue-500 dark:text-blue-400"
                      />
                      SEO Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="meta_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">
                              Meta Title
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SEO title"
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500 dark:text-slate-400">
                              Shown in search engine results (defaults to
                              product title if empty)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="meta_keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">
                              Meta Keywords
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="keyword1, keyword2, keyword3"
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500 dark:text-slate-400">
                              Comma-separated keywords for SEO
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="meta_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">
                              Meta Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description for search engines..."
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500 min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500 dark:text-slate-400">
                              Short description shown in search results
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-200 dark:border-blue-900/30 p-4 bg-blue-50/50 dark:bg-blue-900/10">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Layers
                              size={16}
                              className="text-blue-500 dark:text-blue-400"
                            />
                            Product Variants
                          </FormLabel>
                          <FormDescription className="text-slate-500 dark:text-slate-400">
                            Enable if this product has variants like different
                            sizes, colors, etc.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-800"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-400 dark:border-blue-900/30 px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("images")}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Next: Images
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-6">
              <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon size={18} />
                    Product Images
                  </CardTitle>
                  <CardDescription className="text-blue-100 dark:text-blue-200">
                    Manage images for your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Current Images */}
                  {currentImages.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-base font-medium text-slate-700 dark:text-slate-300">
                        Current Images
                      </h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {currentImages.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <div className="h-40 w-full rounded-lg border border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden relative">
                              <Image
                                src={image.url}
                                alt={`Product Image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 bg-red-500 hover:bg-red-600"
                              onClick={() => handleRemoveExistingImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {index === 0 && (
                              <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white dark:bg-blue-500">
                                Main Image
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Images */}
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="product-images"
                      className="text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-2"
                    >
                      <Upload size={14} />
                      Upload Additional Images
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="product-images"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg cursor-pointer bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-blue-500 dark:text-blue-400" />
                          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            PNG, JPG or WebP (MAX. 5MB)
                          </p>
                        </div>
                        <input
                          id="product-images"
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          multiple
                          className="hidden"
                          onChange={handleImageSelection}
                        />
                      </label>
                    </div>

                    <FormMessage>
                      {form.formState.errors.images?.message}
                    </FormMessage>

                    {productImagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {productImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              className="object-cover w-full h-40 rounded-lg border border-gray-400 dark:border-blue-900/30 shadow-sm"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 bg-red-500 hover:bg-red-600"
                              onClick={() =>
                                handleRemoveProductImagePreview(index)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white dark:bg-blue-500">
                              New Image
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-400 dark:border-blue-900/30 px-6 py-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("attributes")}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Next: Attributes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-6">
              <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Tag size={18} />
                    Product Attributes
                  </CardTitle>
                  <CardDescription className="text-blue-100 dark:text-blue-200">
                    Manage attributes that define this product
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attributes.map((attribute) => (
                      <div
                        key={attribute.id}
                        className="flex items-center space-x-2 border border-blue-200 dark:border-blue-900/30 rounded-md p-4 bg-blue-50/30 dark:bg-blue-900/5"
                      >
                        <Checkbox
                          id={`attr-${attribute.id}`}
                          checked={selectedAttributes.some(
                            (a) => a.attribute_id === attribute.id
                          )}
                          onCheckedChange={(checked) =>
                            handleAttributeSelection(attribute.id, checked)
                          }
                          className="border-blue-400 dark:border-blue-800 text-blue-600 data-[state=checked]:bg-blue-600"
                        />
                        <label
                          htmlFor={`attr-${attribute.id}`}
                          className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {attribute.display_name}
                        </label>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/70"
                        >
                          {attribute.type}
                        </Badge>
                        {attribute.is_variant && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800">
                            Variant
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedAttributes.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                        Configure Selected Attributes
                      </h3>
                      <Accordion type="multiple" className="w-full">
                        {selectedAttributes.map((attr, index) => (
                          <AccordionItem
                            key={attr.attribute_id}
                            value={`attr-${attr.attribute_id}`}
                            className="border-blue-200 dark:border-blue-900/30"
                          >
                            <AccordionTrigger className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline py-3 px-4">
                              {attr.attribute?.display_name}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`attr-req-${attr.attribute_id}`}
                                  checked={attr.is_required}
                                  onCheckedChange={(checked) => {
                                    const updated = [...selectedAttributes];
                                    updated[index].is_required = checked;
                                    setSelectedAttributes(updated);
                                  }}
                                  className="border-blue-400 dark:border-blue-800 text-blue-600 data-[state=checked]:bg-blue-600"
                                />
                                <label
                                  htmlFor={`attr-req-${attr.attribute_id}`}
                                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                  Required
                                </label>
                              </div>

                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Values
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {attr.attribute?.AttributeValues?.map(
                                    (value) => (
                                      <div
                                        key={value.id}
                                        className="flex items-center justify-between border border-blue-200 dark:border-blue-900/30 rounded-md p-3 bg-blue-50/30 dark:bg-blue-900/5"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`attr-val-${attr.attribute_id}-${value.id}`}
                                            checked={attr.values?.some(
                                              (v) =>
                                                v.attribute_value_id ===
                                                value.id
                                            )}
                                            onCheckedChange={(checked) =>
                                              handleAttributeValueSelection(
                                                index,
                                                value.id,
                                                checked
                                              )
                                            }
                                            className="border-blue-400 dark:border-blue-800 text-blue-600 data-[state=checked]:bg-blue-600"
                                          />
                                          <label
                                            htmlFor={`attr-val-${attr.attribute_id}-${value.id}`}
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                          >
                                            {value.display_value}
                                          </label>

                                          {attr.attribute?.type === "color" &&
                                            value.color_code && (
                                              <div
                                                className="w-6 h-6 rounded-full border border-blue-200 dark:border-blue-900/50"
                                                style={{
                                                  backgroundColor:
                                                    value.color_code,
                                                }}
                                              />
                                            )}
                                        </div>

                                        {attr.attribute?.affects_price &&
                                          attr.values?.some(
                                            (v) =>
                                              v.attribute_value_id === value.id
                                          ) && (
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                                +₹
                                              </span>
                                              <Input
                                                type="number"
                                                className="w-20 h-8 text-xs border-blue-200 dark:border-blue-900/50"
                                                placeholder="0.00"
                                                value={
                                                  attr.values?.find(
                                                    (v) =>
                                                      v.attribute_value_id ===
                                                      value.id
                                                  )?.price_adjustment_rupees ||
                                                  ""
                                                }
                                                onChange={(e) => {
                                                  const updatedAttrs = [
                                                    ...selectedAttributes,
                                                  ];
                                                  const valueIndex =
                                                    updatedAttrs[
                                                      index
                                                    ].values?.findIndex(
                                                      (v) =>
                                                        v.attribute_value_id ===
                                                        value.id
                                                    );
                                                  if (valueIndex !== -1) {
                                                    updatedAttrs[index].values[
                                                      valueIndex
                                                    ].price_adjustment_rupees =
                                                      e.target.value;
                                                  }
                                                  setSelectedAttributes(
                                                    updatedAttrs
                                                  );
                                                }}
                                              />
                                            </div>
                                          )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-400 dark:border-blue-900/30 px-6 py-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setActiveTab("images")}
                    className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setActiveTab(hasVariants ? "variants" : "advanced")
                    }
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {hasVariants ? "Next: Variants" : "Next: Advanced"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="space-y-6">
              <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Layers size={18} />
                    Product Variants
                  </CardTitle>
                  <CardDescription className="text-blue-100 dark:text-blue-200">
                    Manage existing variants or create new ones
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Variant selection guidance */}
                  <div className="bg-blue-50/80 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-md p-4 mb-6">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Managing Variants
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Edit existing variants or add new ones. Each variant can
                      have its own price, stock, and images. Make sure to select
                      values for variant attributes.
                    </p>
                  </div>

                  {/* Variant List */}
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <Card
                        key={variant.id}
                        className={`border ${
                          variant.is_default
                            ? "border-blue-500 dark:border-blue-700"
                            : "border-blue-200 dark:border-blue-900/30"
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg text-slate-700 dark:text-slate-300">
                                Variant #{index + 1}{" "}
                                {typeof variant.id === "number"
                                  ? "(ID: " + variant.id + ")"
                                  : "(New)"}
                              </CardTitle>
                              {variant.is_default && (
                                <Badge className="bg-blue-600 dark:bg-blue-700">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!variant.is_default && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setVariantAsDefault(index)}
                                  className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                >
                                  Set as Default
                                </Button>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={variants.length === 1}
                                      onClick={() => removeVariant(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove variant</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-6">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                SKU*
                              </label>
                              <Input
                                placeholder="SKU-001"
                                value={variant.sku}
                                onChange={(e) =>
                                  updateVariantField(
                                    index,
                                    "sku",
                                    e.target.value
                                  )
                                }
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Price (₹)*
                              </label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={variant.price_rupees}
                                onChange={(e) =>
                                  updateVariantField(
                                    index,
                                    "price_rupees",
                                    e.target.value
                                  )
                                }
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Price ($)*
                              </label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={variant.price_dollars}
                                onChange={(e) =>
                                  updateVariantField(
                                    index,
                                    "price_dollars",
                                    e.target.value
                                  )
                                }
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Stock
                              </label>
                              <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={variant.stock_count}
                                onChange={(e) =>
                                  updateVariantField(
                                    index,
                                    "stock_count",
                                    parseInt(e.target.value)
                                  )
                                }
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Stock Status
                              </label>
                              <Select
                                value={variant.stock_status}
                                onValueChange={(value) =>
                                  updateVariantField(
                                    index,
                                    "stock_status",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-400 dark:border-blue-900">
                                  <SelectItem value="yes">In Stock</SelectItem>
                                  <SelectItem value="no">
                                    Out of Stock
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Weight (kg)
                              </label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={variant.weight}
                                onChange={(e) =>
                                  updateVariantField(
                                    index,
                                    "weight",
                                    e.target.value
                                  )
                                }
                                className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Variant Attributes */}
                          {selectedAttributes.some(
                            (attr) => attr.attribute?.is_variant
                          ) && (
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Variant Attributes
                              </h4>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {selectedAttributes
                                  .filter((attr) => attr.attribute?.is_variant)
                                  .map((attr) => (
                                    <div
                                      key={attr.attribute_id}
                                      className="space-y-2"
                                    >
                                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {attr.attribute?.display_name}
                                      </label>
                                      <Select
                                        value={
                                          variant.attribute_values
                                            .find(
                                              (av) =>
                                                attr.attribute?.AttributeValues?.find(
                                                  (val) =>
                                                    val.id ===
                                                    av.attribute_value_id
                                                )?.attribute_id ===
                                                attr.attribute_id
                                            )
                                            ?.attribute_value_id?.toString() ||
                                          ""
                                        }
                                        onValueChange={(value) =>
                                          handleVariantAttributeValue(
                                            index,
                                            attr.attribute_id,
                                            parseInt(value)
                                          )
                                        }
                                      >
                                        <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:ring-blue-500">
                                          <SelectValue
                                            placeholder={`Select ${attr.attribute?.display_name}`}
                                          />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-400 dark:border-blue-900">
                                          {attr.attribute?.AttributeValues?.filter(
                                            (val) =>
                                              attr.values?.some(
                                                (v) =>
                                                  v.attribute_value_id ===
                                                  val.id
                                              )
                                          ).map((value) => (
                                            <SelectItem
                                              key={value.id}
                                              value={value.id.toString()}
                                            >
                                              {value.display_value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Variant Images */}
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                              Variant Images
                            </h4>

                            {/* Existing images */}
                            {variant.existingImages &&
                              variant.existingImages.length > 0 && (
                                <div className="mb-4">
                                  <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                                    Current Images
                                  </label>
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                    {variant.existingImages.map(
                                      (image, imgIndex) => (
                                        <div
                                          key={imgIndex}
                                          className="relative group"
                                        >
                                          <div className="relative h-32 w-full rounded-lg border border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
                                            <Image
                                              src={image.url}
                                              alt={`Variant ${
                                                index + 1
                                              } image ${imgIndex + 1}`}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-red-500 hover:bg-red-600"
                                            onClick={() =>
                                              handleRemoveExistingVariantImage(
                                                index,
                                                imgIndex
                                              )
                                            }
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                          {imgIndex === 0 && (
                                            <Badge className="absolute bottom-1 left-1 bg-blue-600 text-white dark:bg-blue-500 text-xs">
                                              Main
                                            </Badge>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Add new images */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-center w-full">
                                <label
                                  htmlFor={`variant-images-${index}`}
                                  className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-lg cursor-pointer bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-6 h-6 mb-3 text-blue-500 dark:text-blue-400" />
                                    <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
                                      <span className="font-semibold">
                                        Click to upload
                                      </span>{" "}
                                      new images for this variant
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      PNG, JPG or WebP (MAX. 5MB)
                                    </p>
                                  </div>
                                  <input
                                    id={`variant-images-${index}`}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={(e) =>
                                      handleVariantImageSelection(index, e)
                                    }
                                  />
                                </label>
                              </div>

                              {variant.imagePreviews?.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-3 sm:grid-cols-3 md:grid-cols-4">
                                  {variant.imagePreviews.map(
                                    (preview, imgIndex) => (
                                      <div
                                        key={imgIndex}
                                        className="relative group"
                                      >
                                        <img
                                          src={preview.url}
                                          alt={`Variant ${index + 1} Preview ${
                                            imgIndex + 1
                                          }`}
                                          className="object-cover w-full h-32 rounded-lg border border-gray-400 dark:border-blue-900/30 shadow-sm"
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-red-500 hover:bg-red-600"
                                          onClick={() =>
                                            handleRemoveVariantImagePreview(
                                              index,
                                              imgIndex
                                            )
                                          }
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                        <Badge className="absolute bottom-1 left-1 bg-blue-600 text-white dark:bg-blue-500 text-xs">
                                          New
                                        </Badge>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Add variant button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={addVariant}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Variant
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-400 dark:border-blue-900/30 px-6 py-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setActiveTab("attributes")}
                    className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("advanced")}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Next: Advanced
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card className="border-gray-400 dark:border-blue-900/30 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-5">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Settings size={18} />
                    Advanced Options
                  </CardTitle>
                  <CardDescription className="text-blue-100 dark:text-blue-200">
                    Update additional product details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="highlights"
                        className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <PenTool size={14} />
                        Product Highlights
                      </Label>
                      <div className="border rounded-lg border-blue-200 dark:border-blue-900/50 overflow-hidden">
                        <Controller
                          name="highlights"
                          control={form.control}
                          render={({ field }) => (
                            <MDEditor
                              autoCapitalize="none"
                              value={field.value}
                              onChange={field.onChange}
                              preview="edit"
                              height={200}
                              visibleDragbar={false}
                              className="md-editor-custom"
                              hideToolbar={false}
                            />
                          )}
                        />
                      </div>
                      {form.formState.errors.highlights && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.highlights?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="terms_condition"
                        className="text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <PenTool size={14} />
                        Terms & Conditions
                      </Label>
                      <div className="border rounded-lg border-blue-200 dark:border-blue-900/50 overflow-hidden">
                        <Controller
                          name="terms_condition"
                          control={form.control}
                          render={({ field }) => (
                            <MDEditor
                              autoCapitalize="none"
                              value={field.value}
                              onChange={field.onChange}
                              preview="edit"
                              height={200}
                              visibleDragbar={false}
                              className="md-editor-custom"
                              hideToolbar={false}
                            />
                          )}
                        />
                      </div>
                      {form.formState.errors.terms_condition && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.terms_condition?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="hsn_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Tag size={14} />
                            HSN Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="HSN code"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <CircleDollarSign size={14} />
                            Tax Rate (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              step="0.01"
                              min="0"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Package size={14} />
                            Weight (kg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="border-blue-200 dark:border-blue-900/50 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-400 dark:border-blue-900/30 px-6 py-4">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() =>
                        setActiveTab(hasVariants ? "variants" : "attributes")
                      }
                      className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      Reset Changes
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        <Save size={16} className="mr-1" />
                        Save Changes
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border border-blue-200 dark:border-blue-900/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-800 dark:text-slate-200">
                          Confirm Product Update
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                          Are you sure you want to update this product? Please
                          make sure all changes are correct.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={isSubmitting}
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="mr-1" />
                              Update Product
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      {/* MDEditor custom styles */}
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

export default EditProductPage;
