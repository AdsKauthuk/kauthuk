"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { revalidatePath } from "next/cache";

// For image uploads
import os from "os";
import fs from "fs/promises";
import path from "path";
import * as ftp from "basic-ftp";

const localTempDir = os.tmpdir();

// Get user profile data
export async function getUserProfile() {
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        mobile_verified: true,
        status: true,
        createdAt: true,
        DeliveryAddresses: true,
        BillingAddresses: true,
        Orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            OrderProducts: true,
            ShippingDetail: true
          }
        }
      }
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    return { 
      success: true, 
      user: {
        ...user,
        memberSince: new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        }),
        // For avatar, we'll use a placeholder or actual avatar if available
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      }
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { success: false, error: "Failed to get profile data" };
  }
}

// Get user orders
export async function getUserOrders() {
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get orders
    const orders = await db.order.findMany({
      where: { user_id: decoded.id },
      orderBy: { order_date: 'desc' },
      include: {
        OrderProducts: {
          include: {
            // This would actually point to product, but we're simplifying here
          }
        },
        ShippingDetail: true
      }
    });
    
    // Format orders for display
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: `ORD-${order.id.toString().padStart(4, '0')}`,
      date: new Date(order.order_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      }),
      status: order.order_status,
      total: parseFloat(order.total.toString()),
      items: order.OrderProducts.length,
      shippingStatus: order.ShippingDetail?.status || null,
      currency: order.currency
    }));
    
    return { success: true, orders: formattedOrders };
  } catch (error) {
    console.error("Error getting user orders:", error);
    return { success: false, error: "Failed to get orders" };
  }
}

// Update user profile
export async function updateUserProfile(formData) {
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get form data
    const name = formData.get("name");
    const email = formData.get("email");
    const mobile = formData.get("mobile");

    if (!name || !email) {
      return { success: false, error: "Name and email are required" };
    }
    
    // Update user
    await db.user.update({
      where: { id: decoded.id },
      data: {
        name,
        email,
        mobile: mobile || undefined
      }
    });
    
    // Revalidate the profile page to update the data
    revalidatePath('/my-account');
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    
    // More specific error messages
    if (error.code === 'P2002') {
      return { success: false, error: "This email is already in use by another account" };
    }
    
    return { success: false, error: "Failed to update profile" };
  }
}

// Update profile picture 
export async function updateProfilePicture(formData) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;
  
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the avatar file
    const avatarFile = formData.get("avatar");
    
    if (!avatarFile) {
      return { success: false, error: "No file uploaded" };
    }

    // Validate file type
    const fileType = avatarFile.type;
    if (!fileType.startsWith('image/')) {
      return { success: false, error: "Only image files are allowed" };
    }

    // Get file extension from mime type
    const fileExt = fileType.split('/')[1];
    
    // Generate a unique file name
    const timestamp = Date.now();
    const fileName = `user_${decoded.id}_avatar_${timestamp}.${fileExt}`;
    
    // Temporary save location on the server
    const tempFilePath = path.join(localTempDir, fileName);
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    
    // Save the file temporarily
    await fs.writeFile(tempFilePath, buffer);
    
    // Connect to FTP server
    await ftpClient.access({
      host: "ftp.greenglow.in",
      port: 21,
      user: "u737108297.kauthuktest",
      password: "Test_kauthuk#123",
    });
    
    // Upload to FTP server
    const remoteFilePath = `/kauthuk_test/users/avatars/${fileName}`;
    await ftpClient.uploadFrom(tempFilePath, remoteFilePath);
    
    // Generate the avatar URL
    const avatarUrl = `https://greenglow.in/kauthuk_test/users/avatars/${fileName}`;
    
    // Get current user to check if we need to delete an old avatar
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: { avatar: true }
    });
    
    // If using MySQL/PostgreSQL and the table has an 'avatar' column
    // You'll need to add an avatar column to your User model in Prisma
    await db.user.update({
      where: { id: decoded.id },
      data: {
        avatar: avatarUrl
      }
    });
    
    // Remove the temporary file
    await fs.unlink(tempFilePath);
    
    // Delete old avatar if it exists
    if (user?.avatar && user.avatar.includes('kauthuk_test/users/avatars/')) {
      try {
        const oldFileName = user.avatar.split('/').pop();
        await ftpClient.remove(`/kauthuk_test/users/avatars/${oldFileName}`);
      } catch (deleteError) {
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }
    
    // Revalidate the profile page
    revalidatePath('/my-account');
    
    return { success: true, avatarUrl };
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return { success: false, error: "Failed to update profile picture" };
  } finally {
    ftpClient.close();
  }
}

// Get all countries for address form
export async function getCountries() {
  try {
    const countries = await db.country.findMany({
      orderBy: {
        country_enName: 'asc'
      }
    });
    
    return { success: true, countries };
  } catch (error) {
    console.error("Error fetching countries:", error);
    return { success: false, error: "Failed to fetch countries" };
  }
}

// Get states for a specific country
export async function getStatesByCountry(countryId) {
  try {
    const states = await db.states.findMany({
      where: {
        country_id: parseInt(countryId)
      },
      orderBy: {
        state_en: 'asc'
      }
    });
    
    return { success: true, states };
  } catch (error) {
    console.error("Error fetching states:", error);
    return { success: false, error: "Failed to fetch states" };
  }
}

// Add new delivery address
export async function addDeliveryAddress(formData) {
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get form data
    const name = formData.get("name");
    const address = formData.get("address");
    const city = formData.get("city");
    const countryId = parseInt(formData.get("country_id"));
    const stateId = parseInt(formData.get("state_id"));
    const pin = formData.get("pin");
    const phone = formData.get("phone");
    const isDefault = formData.get("is_default") === "on";
    
    // Validate required fields
    if (!name || !address || !city || !countryId || !stateId || !pin || !phone) {
      return { success: false, error: "All fields are required" };
    }
    
    // If setting as default, update existing addresses
    if (isDefault) {
      await db.deliveryAddress.updateMany({
        where: { user_id: decoded.id, is_default: true },
        data: { is_default: false }
      });
    }
    
    // Create new address
    const newAddress = await db.deliveryAddress.create({
      data: {
        user_id: decoded.id,
        name,
        address,
        city,
        country_id: countryId,
        state_id: stateId,
        pin,
        phone,
        is_default: isDefault
      }
    });
    
    // Revalidate the profile page
    revalidatePath('/my-account');
    
    return { success: true, address: newAddress };
  } catch (error) {
    console.error("Error adding delivery address:", error);
    return { success: false, error: "Failed to add delivery address" };
  }
}

// Update delivery address
export async function updateDeliveryAddress(formData) {
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get form data
    const addressId = parseInt(formData.get("address_id"));
    const name = formData.get("name");
    const address = formData.get("address");
    const city = formData.get("city");
    const countryId = parseInt(formData.get("country_id"));
    const stateId = parseInt(formData.get("state_id"));
    const pin = formData.get("pin");
    const phone = formData.get("phone");
    const isDefault = formData.get("is_default") === "on";
    
    // Verify the address belongs to the user
    const existingAddress = await db.deliveryAddress.findFirst({
      where: {
        id: addressId,
        user_id: decoded.id
      }
    });
    
    if (!existingAddress) {
      return { success: false, error: "Address not found" };
    }
    
    // If setting as default, update existing addresses
    if (isDefault) {
      await db.deliveryAddress.updateMany({
        where: { user_id: decoded.id, is_default: true },
        data: { is_default: false }
      });
    }
    
    // Update the address
    const updatedAddress = await db.deliveryAddress.update({
      where: { id: addressId },
      data: {
        name,
        address,
        city,
        country_id: countryId,
        state_id: stateId,
        pin,
        phone,
        is_default: isDefault
      }
    });
    
    // Revalidate the profile page
    revalidatePath('/my-account');
    
    return { success: true, address: updatedAddress };
  } catch (error) {
    console.error("Error updating delivery address:", error);
    return { success: false, error: "Failed to update delivery address" };
  }
}

// Delete delivery address
export async function deleteDeliveryAddress(formData) {
  try {
    const token = cookies().get("userToken")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get address ID
    const addressId = parseInt(formData.get("address_id"));
    
    // Verify the address belongs to the user
    const existingAddress = await db.deliveryAddress.findFirst({
      where: {
        id: addressId,
        user_id: decoded.id
      }
    });
    
    if (!existingAddress) {
      return { success: false, error: "Address not found" };
    }
    
    // Delete the address
    await db.deliveryAddress.delete({
      where: { id: addressId }
    });
    
    // Revalidate the profile page
    revalidatePath('/my-account');
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting delivery address:", error);
    return { success: false, error: "Failed to delete delivery address" };
  }
}

// Logout user
export async function logoutUser() {
  cookies().delete("userToken");
  redirect("/");
}