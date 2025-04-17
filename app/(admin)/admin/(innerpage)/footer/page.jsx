"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  getFooterData, 
  createFooterCategory, 
  updateFooterCategory, 
  deleteFooterCategory,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink
} from '@/actions/footer';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  LayoutIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  CheckCircleIcon,
  LoaderIcon,
  SaveIcon,
  GridIcon,
  ArrowUpDownIcon,
  ExternalLinkIcon,
  EyeOffIcon,
  EyeIcon,
} from "lucide-react";

const FooterAdmin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [footerData, setFooterData] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  
  // Add/Edit Category Dialog States
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isCategoryEditing, setCategoryEditing] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    displayOrder: 0,
    status: 'active'
  });
  
  // Add/Edit Link Dialog States
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false);
  const [isLinkEditing, setLinkEditing] = useState(false);
  const [activeLinkId, setActiveLinkId] = useState(null);
  const [linkForm, setLinkForm] = useState({
    footerCategoryId: null,
    title: '',
    link: '',
    description: '',
    displayOrder: 0,
    status: 'active',
    isExternal: false
  });
  
  // Operation States
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    setIsLoading(true);
    try {
      const response = await getFooterData();
      if (response.success) {
        setFooterData(response.categories);
        if (response.categories.length > 0 && !activeTab) {
          setActiveTab(response.categories[0].id.toString());
        }
      } else {
        toast.error(response.error || "Failed to load footer data");
      }
    } catch (error) {
      console.error("Failed to load footer data", error);
      toast.error("Failed to load footer data");
    } finally {
      setIsLoading(false);
    }
  };

  // Category Management
  const handleAddCategory = () => {
    setCategoryForm({
      title: '',
      displayOrder: footerData.length,
      status: 'active'
    });
    setCategoryEditing(false);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      title: category.title,
      displayOrder: category.displayOrder,
      status: category.status
    });
    setActiveCategoryId(category.id);
    setCategoryEditing(true);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let response;
      if (isCategoryEditing) {
        response = await updateFooterCategory(activeCategoryId, categoryForm);
      } else {
        response = await createFooterCategory(categoryForm);
      }
      
      if (response.success) {
        toast.success(isCategoryEditing ? "Category updated successfully" : "Category added successfully");
        setCategoryDialogOpen(false);
        await fetchFooterData();
      } else {
        toast.error(response.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Failed to save category", error);
      toast.error("An error occurred while saving the category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category? All links within it will also be deleted.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await deleteFooterCategory(categoryId);
      if (response.success) {
        toast.success("Category deleted successfully");
        await fetchFooterData();
        if (activeTab === categoryId.toString()) {
          setActiveTab(footerData.length > 0 ? footerData[0].id.toString() : null);
        }
      } else {
        toast.error(response.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error("An error occurred while deleting the category");
    } finally {
      setIsDeleting(false);
    }
  };

  // Link Management
  const handleAddLink = (categoryId) => {
    setLinkForm({
      footerCategoryId: categoryId,
      title: '',
      link: '',
      description: '',
      displayOrder: 0,
      status: 'active',
      isExternal: false
    });
    setLinkEditing(false);
    setLinkDialogOpen(true);
  };

  const handleEditLink = (link) => {
    setLinkForm({
      footerCategoryId: link.footerCategoryId,
      title: link.title,
      link: link.link,
      description: link.description || '',
      displayOrder: link.displayOrder,
      status: link.status,
      isExternal: link.isExternal
    });
    setActiveLinkId(link.id);
    setLinkEditing(true);
    setLinkDialogOpen(true);
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let response;
      if (isLinkEditing) {
        response = await updateFooterLink(activeLinkId, linkForm);
      } else {
        response = await createFooterLink(linkForm);
      }
      
      if (response.success) {
        toast.success(isLinkEditing ? "Link updated successfully" : "Link added successfully");
        setLinkDialogOpen(false);
        await fetchFooterData();
      } else {
        toast.error(response.error || "Failed to save link");
      }
    } catch (error) {
      console.error("Failed to save link", error);
      toast.error("An error occurred while saving the link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm("Are you sure you want to delete this link?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await deleteFooterLink(linkId);
      if (response.success) {
        toast.success("Link deleted successfully");
        await fetchFooterData();
      } else {
        toast.error(response.error || "Failed to delete link");
      }
    } catch (error) {
      console.error("Failed to delete link", error);
      toast.error("An error occurred while deleting the link");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLinkFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLinkForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStatusChange = (status, type, id) => {
    if (type === 'category') {
      setCategoryForm(prev => ({ ...prev, status }));
    } else if (type === 'link') {
      setLinkForm(prev => ({ ...prev, status }));
    }
  };

  const handleIsExternalChange = (checked) => {
    setLinkForm(prev => ({ ...prev, isExternal: checked }));
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Footer Management</CardTitle>
          <CardDescription>Loading footer data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <LoaderIcon className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <LayoutIcon className="h-5 w-5" />
              Footer Management
            </CardTitle>
            <CardDescription>
              Manage footer categories and links that appear on your website
            </CardDescription>
          </div>
          <Button 
            onClick={handleAddCategory} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>

      {footerData.length === 0 ? (
        <CardContent className="p-6 text-center">
          <div className="py-10 flex flex-col items-center space-y-4">
            <GridIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium">No Footer Categories</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              You haven't created any footer categories yet. Create your first category to organize your footer links.
            </p>
            <Button 
              onClick={handleAddCategory} 
              className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Category
            </Button>
          </div>
        </CardContent>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
              <TabsList className="flex space-x-2 bg-transparent h-auto">
                {footerData.map((category) => (
                  <TabsTrigger 
                    key={category.id}
                    value={category.id.toString()} 
                    className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 rounded-md flex items-center"
                  >
                    {category.status === 'inactive' && (
                      <EyeOffIcon className="h-3 w-3 mr-1 text-gray-400" />
                    )}
                    {category.title}
                    <div className="ml-2 flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {footerData.map((category) => (
              <TabsContent key={category.id} value={category.id.toString()} className="p-0">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">
                      {category.status === 'inactive' && (
                        <span className="inline-flex items-center px-2 py-0.5 mr-2 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          <EyeOffIcon className="h-3 w-3 mr-1" />
                          Hidden
                        </span>
                      )}
                      {category.title} Links
                    </h3>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {category.FooterLinks?.length || 0} link(s)
                    </span>
                  </div>
                  <Button 
                    onClick={() => handleAddLink(category.id)} 
                    variant="outline"
                    className="border-blue-200 hover:border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:hover:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
                
                <div className="p-6">
                  {category.FooterLinks?.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-md">
                      <LinkIcon className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600" />
                      <h3 className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">No links in this category</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Start by adding a link to display in your footer
                      </p>
                      <Button 
                        onClick={() => handleAddLink(category.id)} 
                        variant="outline"
                        className="mt-4 border-blue-200 hover:border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:hover:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add First Link
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Link</TableHead>
                          <TableHead className="w-24 text-center">Status</TableHead>
                          <TableHead className="w-24 text-center">External</TableHead>
                          <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.FooterLinks.sort((a, b) => a.displayOrder - b.displayOrder).map((link) => (
                          <TableRow key={link.id}>
                            <TableCell className="text-center font-medium">{link.displayOrder}</TableCell>
                            <TableCell>{link.title}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {link.link}
                            </TableCell>
                            <TableCell className="text-center">
                              {link.status === 'active' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  <EyeIcon className="h-3 w-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                  <EyeOffIcon className="h-3 w-3 mr-1" />
                                  Hidden
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {link.isExternal ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  <ExternalLinkIcon className="h-3 w-3 mr-1" />
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  No
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLink(link)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCategoryEditing ? "Edit Footer Category" : "Add Footer Category"}
            </DialogTitle>
            <DialogDescription>
              {isCategoryEditing 
                ? "Update the details for this footer category" 
                : "Create a new footer category to organize your footer links"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Category Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={categoryForm.title}
                  onChange={handleCategoryFormChange}
                  placeholder="e.g., Quick Links, Customer Service"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  min="0"
                  value={categoryForm.displayOrder}
                  onChange={handleCategoryFormChange}
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Lower numbers appear first
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={categoryForm.status} 
                  onValueChange={(value) => handleStatusChange(value, 'category')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isLinkEditing ? "Edit Footer Link" : "Add Footer Link"}
            </DialogTitle>
            <DialogDescription>
              {isLinkEditing 
                ? "Update the details for this footer link" 
                : "Create a new link to appear in your website footer"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveLink}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Link Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={linkForm.title}
                  onChange={handleLinkFormChange}
                  placeholder="e.g., About Us, Contact Us"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  name="link"
                  value={linkForm.link}
                  onChange={handleLinkFormChange}
                  placeholder="e.g., /about, https://example.com"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={linkForm.description}
                  onChange={handleLinkFormChange}
                  placeholder="Brief description of this link (optional)"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    name="displayOrder"
                    type="number"
                    min="0"
                    value={linkForm.displayOrder}
                    onChange={handleLinkFormChange}
                    placeholder="0"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={linkForm.status} 
                    onValueChange={(value) => handleStatusChange(value, 'link')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isExternal"
                  checked={linkForm.isExternal}
                  onCheckedChange={handleIsExternalChange}
                />
                <Label htmlFor="isExternal" className="cursor-pointer">
                  Open in new tab (external link)
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FooterAdmin;