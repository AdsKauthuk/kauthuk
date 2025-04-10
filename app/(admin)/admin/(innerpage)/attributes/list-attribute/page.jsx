"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Tags,
  ChevronRight,
  Edit,
  Settings,
  PlusCircle,
  X,
  PenIcon
} from "lucide-react";

// Hooks and Utilities
import useFetch from "@/hooks/use-fetch";

// Actions
import {
  createAttribute,
  createAttributeValue,
  deleteAttributeById,
  deleteAttributeValueById,
  getAttributes,
  getAttributeById,
  updateAttribute,
  updateAttributeValue,
} from "@/actions/attribute";
import { toast } from "sonner";

// Form validation schemas
const AttributeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  type: z.enum(["text", "number", "color", "size", "material", "boolean", "select"]),
  is_variant: z.boolean().default(false),
  affects_price: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

const AttributeValueSchema = z.object({
  attribute_id: z.number().int().positive(),
  value: z.string().min(1, "Value is required"),
  display_value: z.string().min(1, "Display value is required"),
  color_code: z.string().optional().nullable(),
  image_path: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
});

const AttributePage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttributeValueModal, setShowAttributeValueModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteValueConfirmId, setDeleteValueConfirmId] = useState(null);

  const itemsPerPage = 15;
  const router = useRouter();

  // Form for creating/editing attribute
  const attributeForm = useForm({
    resolver: zodResolver(AttributeSchema),
    defaultValues: {
      name: "",
      display_name: "",
      type: "text",
      is_variant: false,
      affects_price: false,
      display_order: 0,
    }
  });

  // Form for creating/editing attribute value
  const attributeValueForm = useForm({
    resolver: zodResolver(AttributeValueSchema),
    defaultValues: {
      attribute_id: 0,
      value: "",
      display_value: "",
      color_code: "",
      image_path: "",
      display_order: 0,
    }
  });

  // useFetch hooks
  const {
    data: createdAttribute,
    loading: isCreating,
    error: createError,
    fn: createAttributeFn,
  } = useFetch(createAttribute);

  const {
    data: updatedAttribute,
    loading: isUpdating,
    error: updateError,
    fn: updateAttributeFn,
  } = useFetch(updateAttribute);

  const {
    data: createdAttributeValue,
    loading: isCreatingValue,
    error: createValueError,
    fn: createAttributeValueFn,
  } = useFetch(createAttributeValue);

  const {
    data: updatedAttributeValue,
    loading: isUpdatingValue,
    error: updateValueError,
    fn: updateAttributeValueFn,
  } = useFetch(updateAttributeValue);

  // Fetch attributes
  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const response = await getAttributes({
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });
      setAttributes(response.attributes);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
      toast.error("Failed to load attributes");
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single attribute with all its values
  const fetchAttributeDetails = async (id) => {
    try {
      const attribute = await getAttributeById(id);
      setSelectedAttribute(attribute);
      
      // Update the edit form with the attribute data
      attributeForm.reset({
        name: attribute.name,
        display_name: attribute.display_name,
        type: attribute.type,
        is_variant: attribute.is_variant,
        affects_price: attribute.affects_price,
        display_order: attribute.display_order || 0,
      });
      
      return attribute;
    } catch (error) {
      console.error("Failed to fetch attribute details:", error);
      toast.error("Failed to load attribute details");
      return null;
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchAttributes();
  }, [searchQuery, currentPage, sortBy]);

  // Handle attribute creation success
  useEffect(() => {
    if (createdAttribute) {
      toast.success("Attribute created successfully");
      setShowCreateModal(false);
      attributeForm.reset();
      fetchAttributes();
    }
  }, [createdAttribute]);

  // Handle attribute update success
  useEffect(() => {
    if (updatedAttribute) {
      toast.success("Attribute updated successfully");
      fetchAttributes();
      
      // If editing the currently selected attribute, refresh its details
      if (selectedAttribute && selectedAttribute.id === updatedAttribute.id) {
        fetchAttributeDetails(updatedAttribute.id);
      }
    }
  }, [updatedAttribute]);

  // Handle attribute value creation success
  useEffect(() => {
    if (createdAttributeValue) {
      toast.success("Attribute value added successfully");
      setShowAttributeValueModal(false);
      attributeValueForm.reset();
      
      // Refresh the selected attribute details
      if (selectedAttribute) {
        fetchAttributeDetails(selectedAttribute.id);
      }
    }
  }, [createdAttributeValue]);

  // Handle attribute value update success
  useEffect(() => {
    if (updatedAttributeValue) {
      toast.success("Attribute value updated successfully");
      setShowAttributeValueModal(false);
      
      // Refresh the selected attribute details
      if (selectedAttribute) {
        fetchAttributeDetails(selectedAttribute.id);
      }
    }
  }, [updatedAttributeValue]);

  // Form submission handlers
  const onSubmitCreateAttribute = async (data) => {
    await createAttributeFn(data);
  };

  const onSubmitUpdateAttribute = async (data) => {
    if (!selectedAttribute) return;
    
    await updateAttributeFn({
      id: selectedAttribute.id,
      ...data,
    });
  };

  const onSubmitCreateAttributeValue = async (data) => {
    await createAttributeValueFn(data);
  };

  const onSubmitUpdateAttributeValue = async (data) => {
    if (!data.id) return;
    await updateAttributeValueFn(data);
  };

  // Handle edit attribute
  const handleEdit = async (item) => {
    const attribute = await fetchAttributeDetails(item.id);
    if (attribute) {
      setShowEditModal(true);
      setActiveTab("details");
    }
  };

  // Handle add attribute value
  const handleAddAttributeValue = () => {
    attributeValueForm.reset({
      attribute_id: selectedAttribute.id,
      value: "",
      display_value: "",
      color_code: selectedAttribute.type === "color" ? "#000000" : "",
      image_path: "",
      display_order: 0,
    });
    setShowAttributeValueModal(true);
  };

  // Handle edit attribute value
  const handleEditAttributeValue = (value) => {
    attributeValueForm.reset({
      id: value.id,
      attribute_id: value.attribute_id,
      value: value.value,
      display_value: value.display_value,
      color_code: value.color_code || "",
      image_path: value.image_path || "",
      display_order: value.display_order || 0,
    });
    setShowAttributeValueModal(true);
  };

  // Handle delete attribute
  const confirmDeleteAttribute = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const result = await deleteAttributeById(deleteConfirmId);
      if (result.success) {
        toast.success("Attribute deleted successfully");
        fetchAttributes();
        
        // If deleting the currently selected attribute, close edit modal
        if (selectedAttribute && selectedAttribute.id === deleteConfirmId) {
          setShowEditModal(false);
          setSelectedAttribute(null);
        }
        
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete attribute");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting");
    }
  };

  // Handle delete attribute value
  const confirmDeleteAttributeValue = async () => {
    if (!deleteValueConfirmId) return;
    
    try {
      const result = await deleteAttributeValueById(deleteValueConfirmId);
      if (result.success) {
        toast.success("Attribute value deleted successfully");
        
        // Refresh the selected attribute details
        if (selectedAttribute) {
          fetchAttributeDetails(selectedAttribute.id);
        }
        
        setDeleteValueConfirmId(null);
      } else {
        toast.error(result.message || "Failed to delete attribute value");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting");
    }
  };

  // Reset filters
  const handleReset = () => {
    setSearchQuery("");
    setSortBy("latest");
    setCurrentPage(1);
    setShowFilters(false);
    fetchAttributes();
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </td>
        <td className="p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
    return Array(9).fill(0).map((_, index) => (
      <Card key={`grid-skeleton-${index}`} className="animate-pulse">
        <CardHeader className="p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardFooter className="p-4 pt-0 flex justify-end">
          <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </CardFooter>
      </Card>
    ));
  };

  const getTypeLabel = (type) => {
    const types = {
      text: "Text",
      number: "Number",
      color: "Color",
      size: "Size",
      material: "Material",
      boolean: "Yes/No",
      select: "Select"
    };
    return types[type] || type;
  };

  return (
    <div className="w-full p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attribute Management</h1>
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
              attributeForm.reset();
              setShowCreateModal(true);
            }} 
            variant="default" 
            size="sm" 
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={16} />
            New Attribute
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="text-sm font-medium mb-1 block">Search attributes</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or display name..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
                  <th className="text-left p-4 font-medium text-gray-600">Name</th>
                  <th className="text-left p-4 font-medium text-gray-600">Display Name</th>
                  <th className="text-left p-4 font-medium text-gray-600">Type</th>
                  <th className="text-center p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletons()
                ) : attributes.length > 0 ? (
                  attributes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 border-b border-gray-100">
                        <div className="font-medium">{item.name}</div>
                        {item.is_variant && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs mt-1">
                            Variant
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <div>{item.display_name}</div>
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                          {getTypeLabel(item.type)}
                        </Badge>
                        {item.affects_price && (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                            Price
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex justify-center items-center space-x-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                          >
                            <Edit size={16} />
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
                        <Tags size={48} className="text-gray-300 mb-2" />
                        <p>No attributes found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Add a new attribute or try changing your search filters
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            renderGridSkeletons()
          ) : attributes.length > 0 ? (
            attributes.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    {item.display_name}
                    {item.is_variant && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs ml-2">
                        Variant
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <Badge className="bg-gray-100 text-gray-700">
                      {getTypeLabel(item.type)}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-4 pb-0">
                  <div className="text-sm text-gray-500">
                    {item.AttributeValues?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.AttributeValues.slice(0, 3).map(value => (
                          <Badge key={value.id} variant="secondary" className="text-xs">
                            {value.display_value}
                          </Badge>
                        ))}
                        {item.AttributeValues.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.AttributeValues.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No values</span>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-3 flex justify-end gap-2">
                  <Button
                    onClick={() => handleEdit(item)}
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Edit size={16} className="mr-1" />
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
              <Tags size={48} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No attributes found</h3>
              <p className="text-gray-500 mb-4">Add a new attribute or try changing your search filters</p>
              <Button 
                onClick={() => {
                  attributeForm.reset();
                  setShowCreateModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Add New Attribute
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && attributes.length > 0 && totalPages > 1 && (
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

      {/* Create Attribute Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Attribute</DialogTitle>
            <DialogDescription>
              Add a new attribute to use in your products
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={attributeForm.handleSubmit(onSubmitCreateAttribute)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                placeholder="Internal name (e.g. color, size)"
                {...attributeForm.register("name")}
                className={attributeForm.formState.errors.name ? "border-red-500" : ""}
              />
              {attributeForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {attributeForm.formState.errors.name?.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                placeholder="Customer-facing name (e.g. Color, Size)"
                {...attributeForm.register("display_name")}
                className={attributeForm.formState.errors.display_name ? "border-red-500" : ""}
              />
              {attributeForm.formState.errors.display_name && (
                <p className="text-sm text-red-500">
                  {attributeForm.formState.errors.display_name?.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Attribute Type</Label>
              <Select
                onValueChange={(value) => attributeForm.setValue("type", value)}
                defaultValue={attributeForm.getValues("type")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select attribute type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
              {attributeForm.formState.errors.type && (
                <p className="text-sm text-red-500">
                  {attributeForm.formState.errors.type?.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_variant"
                checked={attributeForm.watch("is_variant")}
                onCheckedChange={(checked) => attributeForm.setValue("is_variant", checked)}
              />
              <Label htmlFor="is_variant" className="text-sm font-medium">
                Can be used for variants
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="affects_price"
                checked={attributeForm.watch("affects_price")}
                onCheckedChange={(checked) => attributeForm.setValue("affects_price", checked)}
              />
              <Label htmlFor="affects_price" className="text-sm font-medium">
                Affects product price
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                {...attributeForm.register("display_order", { valueAsNumber: true })}
                className={attributeForm.formState.errors.display_order ? "border-red-500" : ""}
              />
              {attributeForm.formState.errors.display_order && (
                <p className="text-sm text-red-500">
                  {attributeForm.formState.errors.display_order?.message}
                </p>
              )}
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
                {isCreating ? "Creating..." : "Create Attribute"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Attribute Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Attribute</DialogTitle>
            <DialogDescription>
              Manage attribute details and values
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Attribute Details</TabsTrigger>
              <TabsTrigger value="values">Attribute Values</TabsTrigger>
            </TabsList>
            
            {/* Attribute Details Tab */}
            <TabsContent value="details">
              <form onSubmit={attributeForm.handleSubmit(onSubmitUpdateAttribute)} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">System Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Internal name (e.g. color, size)"
                    {...attributeForm.register("name")}
                    className={attributeForm.formState.errors.name ? "border-red-500" : ""}
                  />
                  {attributeForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {attributeForm.formState.errors.name?.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-display_name">Display Name</Label>
                  <Input
                    id="edit-display_name"
                    placeholder="Customer-facing name (e.g. Color, Size)"
                    {...attributeForm.register("display_name")}
                    className={attributeForm.formState.errors.display_name ? "border-red-500" : ""}
                  />
                  {attributeForm.formState.errors.display_name && (
                    <p className="text-sm text-red-500">
                      {attributeForm.formState.errors.display_name?.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Attribute Type</Label>
                  <Select
                    onValueChange={(value) => attributeForm.setValue("type", value)}
                    defaultValue={attributeForm.getValues("type")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select attribute type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                    </SelectContent>
                  </Select>
                  {attributeForm.formState.errors.type && (
                    <p className="text-sm text-red-500">
                      {attributeForm.formState.errors.type?.message}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is_variant"
                    checked={attributeForm.watch("is_variant")}
                    onCheckedChange={(checked) => attributeForm.setValue("is_variant", checked)}
                  />
                  <Label htmlFor="edit-is_variant" className="text-sm font-medium">
                    Can be used for variants
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-affects_price"
                    checked={attributeForm.watch("affects_price")}
                    onCheckedChange={(checked) => attributeForm.setValue("affects_price", checked)}
                  />
                  <Label htmlFor="edit-affects_price" className="text-sm font-medium">
                    Affects product price
                  </Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-display_order">Display Order</Label>
                  <Input
                    id="edit-display_order"
                    type="number"
                    min="0"
                    {...attributeForm.register("display_order", { valueAsNumber: true })}
                    className={attributeForm.formState.errors.display_order ? "border-red-500" : ""}
                  />
                  {attributeForm.formState.errors.display_order && (
                    <p className="text-sm text-red-500">
                      {attributeForm.formState.errors.display_order?.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isUpdating ? "Updating..." : "Update Attribute"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Attribute Values Tab */}
            <TabsContent value="values">
              <div className="space-y-4 py-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Attribute Values</h3>
                  <Button 
                    onClick={handleAddAttributeValue} 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    <PlusCircle size={16} className="mr-1" />
                    Add Value
                  </Button>
                </div>
                
                {selectedAttribute?.AttributeValues?.length > 0 ? (
                  <div className="border rounded-md divide-y">
                    {selectedAttribute.AttributeValues.map((value) => (
                      <div key={value.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {selectedAttribute.type === 'color' && value.color_code && (
                            <div 
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: value.color_code }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{value.display_value}</div>
                            <div className="text-sm text-gray-500">{value.value}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEditAttributeValue(value)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            onClick={() => setDeleteValueConfirmId(value.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-red-600 hover:text-red-900 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-gray-50">
                    <PenIcon size={36} className="text-gray-400 mb-2" />
                    <p className="text-gray-600">No values defined for this attribute</p>
                    <p className="text-sm text-gray-500 mb-4">Add some values to use in your products</p>
                    <Button 
                      onClick={handleAddAttributeValue}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus size={16} className="mr-1" />
                      Add First Value
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setShowEditModal(false)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Attribute Value Modal */}
      <Dialog open={showAttributeValueModal} onOpenChange={setShowAttributeValueModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {attributeValueForm.getValues("id") ? "Edit Attribute Value" : "Add Attribute Value"}
            </DialogTitle>
            <DialogDescription>
              {attributeValueForm.getValues("id") 
                ? "Update this attribute value" 
                : "Add a new value for this attribute"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={attributeValueForm.handleSubmit(
            attributeValueForm.getValues("id") ? onSubmitUpdateAttributeValue : onSubmitCreateAttributeValue
          )} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value (Internal)</Label>
              <Input
                id="value"
                placeholder="Internal value (e.g. red, xl)"
                {...attributeValueForm.register("value")}
                className={attributeValueForm.formState.errors.value ? "border-red-500" : ""}
              />
              {attributeValueForm.formState.errors.value && (
                <p className="text-sm text-red-500">
                  {attributeValueForm.formState.errors.value?.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_value">Display Value</Label>
              <Input
                id="display_value"
                placeholder="Customer-facing value (e.g. Red, Extra Large)"
                {...attributeValueForm.register("display_value")}
                className={attributeValueForm.formState.errors.display_value ? "border-red-500" : ""}
              />
              {attributeValueForm.formState.errors.display_value && (
                <p className="text-sm text-red-500">
                  {attributeValueForm.formState.errors.display_value?.message}
                </p>
              )}
            </div>
            
            {selectedAttribute?.type === 'color' && (
              <div className="space-y-2">
                <Label htmlFor="color_code">Color Code</Label>
                <div className="flex space-x-2">
                  <div 
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: attributeValueForm.watch("color_code") || '#000000' }}
                  />
                  <Input
                    id="color_code"
                    type="color"
                    placeholder="#000000"
                    {...attributeValueForm.register("color_code")}
                    className={attributeValueForm.formState.errors.color_code ? "border-red-500" : ""}
                  />
                </div>
                {attributeValueForm.formState.errors.color_code && (
                  <p className="text-sm text-red-500">
                    {attributeValueForm.formState.errors.color_code?.message}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                {...attributeValueForm.register("display_order", { valueAsNumber: true })}
                className={attributeValueForm.formState.errors.display_order ? "border-red-500" : ""}
              />
              {attributeValueForm.formState.errors.display_order && (
                <p className="text-sm text-red-500">
                  {attributeValueForm.formState.errors.display_order?.message}
                </p>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowAttributeValueModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingValue || isUpdatingValue}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isCreatingValue || isUpdatingValue
                  ? (attributeValueForm.getValues("id") ? "Updating..." : "Creating...")
                  : (attributeValueForm.getValues("id") ? "Update Value" : "Add Value")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Attribute Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attribute and all its values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAttribute}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Attribute Value Confirmation Dialog */}
      <AlertDialog open={!!deleteValueConfirmId} onOpenChange={(open) => !open && setDeleteValueConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attribute value? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAttributeValue}
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

export default AttributePage