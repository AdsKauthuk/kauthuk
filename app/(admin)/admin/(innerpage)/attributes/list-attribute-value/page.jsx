"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// UI Components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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

// Icons
import {
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Filter,
  ListFilter,
  LayoutGrid,
  Tag,
  TagsIcon,
  ColorSwatch,
  Hash,
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";

// Actions
import { getAttributes2 } from "@/actions/attribute";
import {
  createAttributeValue,
  deleteAttributeValueById,
  getAttributeValues,
  updateAttributeValue,
} from "@/actions/attributeValue";
import { toast } from "sonner";

// Form validation schema
const AttributeValueSchema = z.object({
  attribute_id: z.number().int().positive("Attribute is required"),
  value: z.string().min(1, "Value is required"),
  display_value: z.string().min(1, "Display value is required"),
  color_code: z.string().optional().nullable(),
  image_path: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
});

const AttributeValuePage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [attributeFilter, setAttributeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attributeValues, setAttributeValues] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttributeType, setSelectedAttributeType] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const itemsPerPage = 15;
  const router = useRouter();

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: zodResolver(AttributeValueSchema),
    defaultValues: {
      attribute_id: "",
      value: "",
      display_value: "",
      color_code: "",
      image_path: "",
      display_order: 0,
    }
  });

  // Watch for attribute_id changes to update selected attribute type
  const watchAttributeId = watch("attribute_id");

  // useFetch hooks for API operations
  const {
    data: createdAttributeValue,
    loading: isCreating,
    error: createError,
    fn: createAttributeValueFn,
  } = useFetch(createAttributeValue);

  const {
    data: updatedAttributeValue,
    loading: isUpdating,
    error: updateError,
    fn: updateAttributeValueFn,
  } = useFetch(updateAttributeValue);

  // Fetch attribute values with filters
  const fetchAttributeValues = async () => {
    setLoading(true);
    try {
      const response = await getAttributeValues({
        search: searchQuery,
        attribute_id: attributeFilter || null,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setAttributeValues(response.attributeValues);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch attribute values:", error);
      toast.error("Failed to load attribute values");
    } finally {
      setLoading(false);
    }
  };

  // Fetch attributes
  const fetchAttributes = async () => {
    try {
      const response = await getAttributes2();
      setAttributes(response.attributes);
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
      toast.error("Failed to load attributes");
    }
  };

  // Update selected attribute type when attribute_id changes
  useEffect(() => {
    if (watchAttributeId) {
      const selectedAttr = attributes.find(attr => attr.id === watchAttributeId);
      setSelectedAttributeType(selectedAttr?.type || null);
    } else {
      setSelectedAttributeType(null);
    }
  }, [watchAttributeId, attributes]);

  // Load initial data
  useEffect(() => {
    fetchAttributeValues();
  }, [searchQuery, attributeFilter, currentPage, sortBy]);

  useEffect(() => {
    fetchAttributes();
  }, []);

  // Handle success responses
  useEffect(() => {
    if (createdAttributeValue) {
      toast.success("Attribute value created successfully");
      setShowCreateModal(false);
      reset();
      fetchAttributeValues();
    }
  }, [createdAttributeValue]);

  useEffect(() => {
    if (updatedAttributeValue) {
      toast.success("Attribute value updated successfully.");
      setShowEditModal(false);
      fetchAttributeValues();
    }
  }, [updatedAttributeValue]);

  // Form submission handlers
  const onSubmitCreate = async (data) => {
    await createAttributeValueFn(data);
  };

  const onSubmitUpdate = async (data) => {
    await updateAttributeValueFn(data);
  };

  // Reset filters
  const handleReset = () => {
    setSearchQuery("");
    setAttributeFilter("");
    setSortBy("latest");
    setCurrentPage(1);
    setShowFilters(false);
    fetchAttributeValues();
  };

  // Delete attribute value
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const result = await deleteAttributeValueById(deleteConfirmId);
      if (result.success) {
        toast.success("Attribute value deleted successfully");
        fetchAttributeValues();
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete attribute value");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting");
    }
  };

  // Edit attribute value
  const handleEdit = (item) => {
    const selectedAttr = attributes.find(attr => attr.id === item.attribute_id);
    setSelectedAttributeType(selectedAttr?.type || null);
    
    reset({
      id: item.id,
      attribute_id: item.attribute_id,
      value: item.value,
      display_value: item.display_value || item.value,
      color_code: item.color_code || "",
      image_path: item.image_path || "",
      display_order: item.display_order || 0,
    });
    
    setShowEditModal(true);
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="flex justify-center space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </td>
      </tr>
    ));
  };

  const renderGridSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={`grid-skeleton-${index}`} className="animate-pulse">
        <CardHeader className="p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-end">
          <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </CardFooter>
      </Card>
    ));
  };

  // Get attribute name by ID
  const getAttributeName = (id) => {
    const attribute = attributes.find(attr => attr.id === id);
    return attribute ? attribute.display_name || attribute.name : "Unknown";
  };

  // Get attribute type by ID
  const getAttributeType = (id) => {
    const attribute = attributes.find(attr => attr.id === id);
    return attribute ? attribute.type : null;
  };

  // Render attribute value based on type
  const renderAttributeValue = (value, type) => {
    switch (type) {
      case "color":
        return (
          <div className="flex items-center space-x-2">
            {value.color_code && (
              <div 
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: value.color_code }}
              />
            )}
            <span>{value.display_value || value.value}</span>
          </div>
        );
      case "size":
      case "number":
        return (
          <Badge variant="outline" className="bg-gray-50 font-mono">
            {value.display_value || value.value}
          </Badge>
        );
      default:
        return value.display_value || value.value;
    }
  };

  return (
    <div className="w-full p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attribute Values</h1>
          <Breadcrumb className="text-sm text-gray-500 mt-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/attributes/list-attribute">
                  Attributes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/attributeValue">
                  Values
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            {viewMode === "table" ? 
              <><LayoutGrid size={16} /> Grid View</> : 
              <><ListFilter size={16} /> Table View</>
            }
          </Button>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            Filters
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RotateCcw size={16} />
            Reset
          </Button>
          
          <Button 
            onClick={() => {
              reset();
              setShowCreateModal(true);
            }} 
            variant="default" 
            size="sm" 
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={16} />
            New Value
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Search values</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by value or display value..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Filter by attribute</label>
                <Select value={attributeFilter} onValueChange={setAttributeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All attributes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All attributes</SelectItem>
                    {attributes.map((attr) => (
                      <SelectItem key={attr.id} value={attr.id.toString()}>
                        {attr.display_name || attr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="display_order">Display Order</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === "table" ? (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 font-medium text-gray-600">Attribute</th>
                  <th className="text-left p-4 font-medium text-gray-600">Value</th>
                  <th className="text-left p-4 font-medium text-gray-600">Display Value</th>
                  <th className="text-center p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : attributeValues.length > 0 ? (
                  attributeValues.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 border-b border-gray-100">
                        <div className="font-medium">
                          {item.Attribute?.display_name || item.Attribute?.name || "Unknown"}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.Attribute?.type || "text"}
                        </Badge>
                      </td>
                      
                      <td className="p-4 border-b border-gray-100">
                        <div className="font-mono text-sm text-gray-600">{item.value}</div>
                      </td>
                      
                      <td className="p-4 border-b border-gray-100">
                        {renderAttributeValue(item, item.Attribute?.type)}
                      </td>
                      
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                          >
                            <Pencil size={16} />
                          </Button>
                          
                          <Button
                            onClick={() => setDeleteConfirmId(item.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-red-600 hover:text-red-900 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <TagsIcon size={48} className="text-gray-300 mb-2" />
                        <p>No attribute values found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Add a new attribute value or try changing your search filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            renderGridSkeletons()
          ) : attributeValues.length > 0 ? (
            attributeValues.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    {item.display_value || item.value}
                    {item.Attribute?.type === "color" && item.color_code && (
                      <div 
                        className="w-5 h-5 rounded-full border ml-2"
                        style={{ backgroundColor: item.color_code }}
                      />
                    )}
                  </CardTitle>
                  <CardDescription>
                    <span className="font-mono text-xs">{item.value}</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Attribute:</span>
                      <span className="text-sm ml-1">
                        {item.Attribute?.display_name || item.Attribute?.name || "Unknown"}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {item.Attribute?.type || "text"}
                    </Badge>
                  </div>
                  {item.display_order > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      Display Order: {item.display_order}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                  <Button
                    onClick={() => handleEdit(item)}
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Pencil size={16} className="mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => setDeleteConfirmId(item.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 flex flex-col items-center justify-center bg-white rounded-lg">
              <TagsIcon size={48} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No attribute values found</h3>
              <p className="text-gray-500 mb-4">Add a new attribute value or try changing your search filters</p>
              <Button 
                onClick={() => {
                  reset();
                  setShowCreateModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Add New Attribute Value
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && attributeValues.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Attribute Value Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Attribute Value</DialogTitle>
            <DialogDescription>
              Create a new value for an existing attribute
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attribute_id">Attribute</Label>
              <Controller
                name="attribute_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <SelectTrigger className={errors.attribute_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select an attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {attributes.length > 0 ? (
                        attributes.map((attr) => (
                          <SelectItem
                            key={attr.id}
                            value={attr.id.toString()}
                          >
                            {attr.display_name || attr.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading attributes...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.attribute_id && (
                <p className="text-sm text-red-500">{errors.attribute_id.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Value (Internal)</Label>
              <Input
                id="value"
                placeholder="Internal value (e.g. red, xl)"
                {...register("value")}
                className={errors.value ? "border-red-500" : ""}
              />
              {errors.value && (
                <p className="text-sm text-red-500">{errors.value.message}</p>
              )}
              <p className="text-xs text-gray-500">
                This is the internal value used by the system
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_value">Display Value</Label>
              <Input
                id="display_value"
                placeholder="Customer-facing value (e.g. Red, Extra Large)"
                {...register("display_value")}
                className={errors.display_value ? "border-red-500" : ""}
              />
              {errors.display_value && (
                <p className="text-sm text-red-500">{errors.display_value.message}</p>
              )}
              <p className="text-xs text-gray-500">
                This is the value shown to customers
              </p>
            </div>
            
            {selectedAttributeType === "color" && (
              <div className="space-y-2">
                <Label htmlFor="color_code">Color Code</Label>
                <div className="flex space-x-2">
                  <div 
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: watch("color_code") || '#000000' }}
                  />
                  <Input
                    id="color_code"
                    type="color"
                    {...register("color_code")}
                    className={errors.color_code ? "border-red-500" : ""}
                  />
                </div>
                {errors.color_code && (
                  <p className="text-sm text-red-500">{errors.color_code.message}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                {...register("display_order", { valueAsNumber: true })}
                className={errors.display_order ? "border-red-500" : ""}
              />
              {errors.display_order && (
                <p className="text-sm text-red-500">{errors.display_order.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Values with lower display order will be shown first
              </p>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isCreating ? "Creating..." : "Create Value"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Attribute Value Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attribute Value</DialogTitle>
            <DialogDescription>
              Update attribute value information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-attribute-id">Attribute</Label>
              <Controller
                name="attribute_id"
                control={control}
                render={({ field }) => (<Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value ? String(field.value) : undefined}
                >
                  <SelectTrigger className={errors.attribute_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select an attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.length > 0 ? (
                      attributes.map((attr) => (
                        <SelectItem
                          key={attr.id}
                          value={attr.id.toString()}
                        >
                          {attr.display_name || attr.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading attributes...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.attribute_id && (
              <p className="text-sm text-red-500">{errors.attribute_id.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-value">Value (Internal)</Label>
            <Input
              id="edit-value"
              placeholder="Internal value (e.g. red, xl)"
              {...register("value")}
              className={errors.value ? "border-red-500" : ""}
            />
            {errors.value && (
              <p className="text-sm text-red-500">{errors.value.message}</p>
            )}
            <p className="text-xs text-gray-500">
              This is the internal value used by the system
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-display_value">Display Value</Label>
            <Input
              id="edit-display_value"
              placeholder="Customer-facing value (e.g. Red, Extra Large)"
              {...register("display_value")}
              className={errors.display_value ? "border-red-500" : ""}
            />
            {errors.display_value && (
              <p className="text-sm text-red-500">{errors.display_value.message}</p>
            )}
            <p className="text-xs text-gray-500">
              This is the value shown to customers
            </p>
          </div>
          
          {selectedAttributeType === "color" && (
            <div className="space-y-2">
              <Label htmlFor="edit-color_code">Color Code</Label>
              <div className="flex space-x-2">
                <div 
                  className="w-10 h-10 rounded-md border"
                  style={{ backgroundColor: watch("color_code") || '#000000' }}
                />
                <Input
                  id="edit-color_code"
                  type="color"
                  {...register("color_code")}
                  className={errors.color_code ? "border-red-500" : ""}
                />
              </div>
              {errors.color_code && (
                <p className="text-sm text-red-500">{errors.color_code.message}</p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="edit-display_order">Display Order</Label>
            <Input
              id="edit-display_order"
              type="number"
              min="0"
              {...register("display_order", { valueAsNumber: true })}
              className={errors.display_order ? "border-red-500" : ""}
            />
            {errors.display_order && (
              <p className="text-sm text-red-500">{errors.display_order.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Values with lower display order will be shown first
            </p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdating ? "Updating..." : "Update Value"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the attribute value.
            If this value is used in any products, the deletion will fail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
};

export default AttributeValuePage;