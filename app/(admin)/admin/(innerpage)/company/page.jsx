"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCompanyContact } from '@/actions/contact';
import { updateCompanyContact } from '@/actions/contact'; // You need to create this function

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
  AlertCircleIcon,
  SaveIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  LinkIcon,
  MapIcon,
  CheckCircleIcon,
  Globe2Icon,
  LoaderIcon,
} from "lucide-react";

const CompanyContactAdmin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    email: '',
    phone: '',
    alt_phone: '',
    whatsapp: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    map_embed_url: '',
    map_latitude: '',
    map_longitude: '',
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await getCompanyContact();
        if (response.success && response.contact) {
          setContactInfo(response.contact);
        }
      } catch (error) {
        toast.error("Failed to load company contact information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // You need to implement this server action
      const response = await updateCompanyContact(contactInfo);
      
      if (response.success) {
        setSaveSuccess(true);
        toast.success("Company contact information updated successfully");
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        toast.error(response.error || "Failed to update company information");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Contact Information</CardTitle>
          <CardDescription>Loading contact information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <LoaderIcon className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-gray-200 dark:border-gray-800">
          <CardTitle className="text-xl text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Globe2Icon className="h-5 w-5" />
            Company Contact Information
          </CardTitle>
          <CardDescription>
            Update your company's contact details displayed on your website
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="address" className="w-full">
          <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-800">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 h-auto gap-2 sm:gap-4 bg-transparent">
              <TabsTrigger 
                value="address" 
                className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 rounded-md"
              >
                <MapPinIcon className="h-4 w-4 mr-1" />
                Address
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 rounded-md"
              >
                <PhoneIcon className="h-4 w-4 mr-1" />
                Contact
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 rounded-md"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Social Media
              </TabsTrigger>
              <TabsTrigger 
                value="map" 
                className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 rounded-md"
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Address Tab */}
          <TabsContent value="address" className="p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  value={contactInfo.address_line1 || ''}
                  onChange={handleChange}
                  placeholder="Street address, P.O. box, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line2"
                  name="address_line2"
                  value={contactInfo.address_line2 || ''}
                  onChange={handleChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={contactInfo.city || ''}
                  onChange={handleChange}
                  placeholder="City"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  name="state"
                  value={contactInfo.state || ''}
                  onChange={handleChange}
                  placeholder="State/Province"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={contactInfo.postal_code || ''}
                  onChange={handleChange}
                  placeholder="Postal code"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={contactInfo.country || ''}
                  onChange={handleChange}
                  placeholder="Country"
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={contactInfo.email || ''}
                  onChange={handleChange}
                  placeholder="contact@yourbusiness.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={contactInfo.phone || ''}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="alt_phone">Alternative Phone (Optional)</Label>
                <Input
                  id="alt_phone"
                  name="alt_phone"
                  value={contactInfo.alt_phone || ''}
                  onChange={handleChange}
                  placeholder="+1 (555) 987-6543"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={contactInfo.whatsapp || ''}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="facebook_url">Facebook URL (Optional)</Label>
                <Input
                  id="facebook_url"
                  name="facebook_url"
                  value={contactInfo.facebook_url || ''}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourbusiness"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="instagram_url">Instagram URL (Optional)</Label>
                <Input
                  id="instagram_url"
                  name="instagram_url"
                  value={contactInfo.instagram_url || ''}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourbusiness"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="twitter_url">Twitter URL (Optional)</Label>
                <Input
                  id="twitter_url"
                  name="twitter_url"
                  value={contactInfo.twitter_url || ''}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourbusiness"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="youtube_url">YouTube URL (Optional)</Label>
                <Input
                  id="youtube_url"
                  name="youtube_url"
                  value={contactInfo.youtube_url || ''}
                  onChange={handleChange}
                  placeholder="https://youtube.com/c/yourbusiness"
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="p-6 pt-4">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="map_embed_url">Google Maps Embed URL (Optional)</Label>
                <Input
                  id="map_embed_url"
                  name="map_embed_url"
                  value={contactInfo.map_embed_url || ''}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Paste the embed URL from Google Maps to display your location on the contact page
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="map_latitude">Latitude (Optional)</Label>
                  <Input
                    id="map_latitude"
                    name="map_latitude"
                    value={contactInfo.map_latitude || ''}
                    onChange={handleChange}
                    placeholder="e.g. 40.7128"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="map_longitude">Longitude (Optional)</Label>
                  <Input
                    id="map_longitude"
                    name="map_longitude"
                    value={contactInfo.map_longitude || ''}
                    onChange={handleChange}
                    placeholder="e.g. -74.0060"
                    className="mt-1"
                  />
                </div>
              </div>

              {contactInfo.map_embed_url && (
                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden h-64">
                  <iframe
                    src={contactInfo.map_embed_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Company Location"
                  ></iframe>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between items-center border-t border-gray-200 dark:border-gray-800 p-6">
          <div>
            {saveSuccess && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-5 w-5 mr-1" />
                <span>Saved successfully</span>
              </div>
            )}
          </div>
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
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default CompanyContactAdmin;