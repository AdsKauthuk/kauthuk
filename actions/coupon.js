"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Create a new coupon
 * @param {Object} data - Coupon data
 * @returns {Promise<Object>} Created coupon
 */
export async function createCoupon(data) {
  try {
    // Validate the coupon code format
    if (!data.code || !/^[A-Z0-9_-]+$/.test(data.code.toUpperCase())) {
      throw new Error("Invalid coupon code format. Use only alphanumeric characters, dashes, and underscores.");
    }

    // Validate discount value
    if (data.discount_type === "percentage" && (data.discount_value <= 0 || data.discount_value > 100)) {
      throw new Error("Percentage discount must be between 0 and 100");
    }

    if (data.discount_type === "fixed" && data.discount_value <= 0) {
      throw new Error("Fixed discount amount must be greater than 0");
    }

    // Convert empty strings to null for optional fields
    const cleanData = {
      ...data,
      description: data.description || null,
      min_order_value: data.min_order_value || 0,
      max_discount: data.max_discount || 0,
      product_ids: data.product_ids || null,
      category_ids: data.category_ids || null,
    };

    // Create the coupon in the database
    const coupon = await db.coupon.create({
      data: {
        code: cleanData.code.toUpperCase(),
        description: cleanData.description,
        discount_type: cleanData.discount_type,
        discount_value: cleanData.discount_value,
        min_order_value: cleanData.min_order_value,
        max_discount: cleanData.max_discount,
        start_date: cleanData.start_date,
        end_date: cleanData.end_date,
        usage_limit: cleanData.usage_limit,
        user_usage_limit: cleanData.user_usage_limit,
        is_first_order: cleanData.is_first_order,
        product_ids: cleanData.product_ids,
        category_ids: cleanData.category_ids,
        status: "active",
      },
    });

    revalidatePath("/admin/coupons");
    return coupon;
  } catch (error) {
    console.error("Error creating coupon:", error);
    
    // Provide specific error messages for unique constraint violations
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      throw new Error("A coupon with this code already exists");
    }
    
    throw new Error(error.message || "Failed to create coupon");
  }
}

/**
 * Update an existing coupon
 * @param {Object} data - Updated coupon data
 * @returns {Promise<Object>} Updated coupon
 */
export async function updateCoupon(data) {
  try {
    if (!data.id) {
      throw new Error("Coupon ID is required for updating");
    }

    // Validate the coupon code format
    if (!data.code || !/^[A-Z0-9_-]+$/.test(data.code.toUpperCase())) {
      throw new Error("Invalid coupon code format. Use only alphanumeric characters, dashes, and underscores.");
    }

    // Validate discount value
    if (data.discount_type === "percentage" && (data.discount_value <= 0 || data.discount_value > 100)) {
      throw new Error("Percentage discount must be between 0 and 100");
    }

    if (data.discount_type === "fixed" && data.discount_value <= 0) {
      throw new Error("Fixed discount amount must be greater than 0");
    }

    // Check if the coupon exists
    const existingCoupon = await db.coupon.findUnique({
      where: { id: data.id },
    });

    if (!existingCoupon) {
      throw new Error("Coupon not found");
    }

    // Check if another coupon with the same code exists (excluding this one)
    if (data.code !== existingCoupon.code) {
      const duplicateCode = await db.coupon.findFirst({
        where: {
          code: data.code.toUpperCase(),
          id: { not: data.id },
        },
      });

      if (duplicateCode) {
        throw new Error("A coupon with this code already exists");
      }
    }

    // Update the coupon
    const updatedCoupon = await db.coupon.update({
      where: { id: data.id },
      data: {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_value: data.min_order_value || 0,
        max_discount: data.max_discount || 0,
        start_date: data.start_date,
        end_date: data.end_date,
        usage_limit: data.usage_limit,
        user_usage_limit: data.user_usage_limit,
        is_first_order: data.is_first_order,
        product_ids: data.product_ids || null,
        category_ids: data.category_ids || null,
      },
    });

    revalidatePath("/admin/coupons");
    return updatedCoupon;
  } catch (error) {
    console.error("Error updating coupon:", error);
    throw new Error(error.message || "Failed to update coupon");
  }
}

/**
 * Toggle coupon status (active/inactive)
 * @param {number} id - Coupon ID
 * @returns {Promise<Object>} Updated coupon
 */
export async function toggleCouponStatus(id) {
  try {
    if (!id) {
      throw new Error("Coupon ID is required");
    }

    const coupon = await db.coupon.findUnique({
      where: { id: parseInt(id) },
    });

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Toggle the status
    const updatedCoupon = await db.coupon.update({
      where: { id: parseInt(id) },
      data: {
        status: coupon.status === "active" ? "inactive" : "active",
      },
    });

    revalidatePath("/admin/coupons");
    return updatedCoupon;
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    throw new Error(error.message || "Failed to toggle coupon status");
  }
}

/**
 * Delete a coupon
 * @param {number} id - Coupon ID
 * @returns {Promise<Object>} Operation result
 */
export async function deleteCouponById(id) {
  try {
    if (!id) {
      throw new Error("Coupon ID is required");
    }

    // Check if there are any coupon usages that would be orphaned
    const usageCount = await db.couponUsage.count({
      where: { coupon_id: parseInt(id) },
    });

    if (usageCount > 0) {
      // Instead of blocking deletion, we'll just warn the user
      console.warn(`Deleting coupon with ${usageCount} usage records. These will be orphaned.`);
    }

    // Delete the coupon
    await db.coupon.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    
    // Check if the error is due to the coupon not existing
    if (error.code === "P2025") {
      throw new Error("Coupon not found");
    }
    
    throw new Error(error.message || "Failed to delete coupon");
  }
}

/**
 * Get all coupons with pagination, filtering and sorting
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated coupons list
 */
export async function getCoupons({
  search = "",
  page = 1,
  limit = 15,
  sort = "latest",
  status = "all",
} = {}) {
  try {
    // Parse pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = ((isNaN(pageNum) ? 1 : Math.max(1, pageNum)) - 1) * 
                 (isNaN(limitNum) ? 15 : Math.max(1, limitNum));

    // Build the where clause for filtering
    const where = {};

    // Apply status filter
    if (status !== "all") {
      if (status === "expired") {
        where.end_date = {
          not: null,
          lt: new Date(),
        };
      } else {
        where.status = status;
      }
    }

    // Apply search filter if provided
    if (search && search.trim() !== "") {
      where.OR = [
        { code: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    // Determine sorting based on the sort parameter
    let orderBy = {};
    switch (sort) {
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "code_asc":
        orderBy = { code: "asc" };
        break;
      case "code_desc":
        orderBy = { code: "desc" };
        break;
      case "expiry_soon":
        // Sort by end_date, with null (no expiry) at the end
        orderBy = [
          { end_date: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ];
        break;
      case "discount_high":
        // Order by discount value (high to low)
        orderBy = { discount_value: "desc" };
        break;
      case "usage_high":
        // Would need to count coupon usages for a proper implementation
        // This is a simplified version
        orderBy = { _count: { CouponUsages: "desc" } };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Fetch coupons with pagination and filters
    const coupons = await db.coupon.findMany({
      where,
      take: isNaN(limitNum) ? 15 : Math.max(1, limitNum),
      skip,
      orderBy,
      include: {
        _count: {
          select: {
            CouponUsages: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await db.coupon.count({ where });

    // Format the coupons for response
    const formattedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      min_order_value: coupon.min_order_value ? parseFloat(coupon.min_order_value) : 0,
      max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : 0,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      usage_limit: coupon.usage_limit,
      user_usage_limit: coupon.user_usage_limit,
      is_first_order: coupon.is_first_order,
      product_ids: coupon.product_ids,
      category_ids: coupon.category_ids,
      status: coupon.status,
      usage_count: coupon._count.CouponUsages,
      currency: "INR", // Default currency
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    }));

    return {
      coupons: formattedCoupons,
      totalPages: Math.ceil(totalCount / (isNaN(limitNum) ? 15 : Math.max(1, limitNum))),
      totalCoupons: totalCount,
    };
  } catch (error) {
    console.error("Error fetching coupons:", error);
    throw new Error(error.message || "Failed to fetch coupons");
  }
}

/**
 * Get coupon by its code
 * @param {string} code - Coupon code to look up
 * @returns {Promise<Object>} Coupon details
 */
export async function getCouponByCode(code) {
  try {
    if (!code) {
      return { success: false, error: "Coupon code is required" };
    }

    const coupon = await db.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        status: "active",
      },
      include: {
        _count: {
          select: {
            CouponUsages: true,
          },
        },
      },
    });

    if (!coupon) {
      return { success: false, error: "Coupon not found" };
    }

    // Check if coupon is expired
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
      return { success: false, error: "Coupon has expired" };
    }

    // Format the coupon for response
    const formattedCoupon = {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      min_order_value: coupon.min_order_value ? parseFloat(coupon.min_order_value) : 0,
      max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : 0,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      usage_limit: coupon.usage_limit,
      user_usage_limit: coupon.user_usage_limit,
      is_first_order: coupon.is_first_order,
      product_ids: coupon.product_ids,
      category_ids: coupon.category_ids,
      usage_count: coupon._count.CouponUsages,
      currency: "INR", // Default currency
    };

    return { success: true, coupon: formattedCoupon };
  } catch (error) {
    console.error("Error fetching coupon by code:", error);
    return { success: false, error: error.message || "Failed to fetch coupon" };
  }
}

/**
 * Apply a coupon code to a cart
 * @param {string} code - Coupon code
 * @param {number} total - Cart total
 * @param {number} userId - User ID (0 for guest)
 * @param {Array} items - Cart items
 * @returns {Promise<Object>} Discount information
 */
export async function applyCoupon(code, total, userId = 0, items = []) {
  try {
    // Fetch the coupon by code
    const couponResult = await getCouponByCode(code);
    
    if (!couponResult.success) {
      return couponResult; // Return the error from getCouponByCode
    }
    
    const coupon = couponResult.coupon;
    
    // Check minimum order value
    if (coupon.min_order_value > 0 && total < coupon.min_order_value) {
      return {
        success: false,
        error: `Minimum order value of ${coupon.currency === "INR" ? "₹" : "$"}${coupon.min_order_value} required`,
        min_order_value: coupon.min_order_value,
      };
    }
    
    // Check if it's a first-order coupon and the user has previous orders
    if (coupon.is_first_order && userId > 0) {
      const orderCount = await db.order.count({
        where: { user_id: userId },
      });
      
      if (orderCount > 0) {
        return {
          success: false,
          error: "This coupon is for first-time orders only",
        };
      }
    }
    
    // Check usage limits
    if (coupon.usage_limit !== null) {
      const totalUsage = await db.couponUsage.count({
        where: { coupon_id: coupon.id },
      });
      
      if (totalUsage >= coupon.usage_limit) {
        return {
          success: false,
          error: "This coupon has reached its usage limit",
        };
      }
    }
    
    // Check per-user usage limit
    if (coupon.user_usage_limit !== null && userId > 0) {
      const userUsage = await db.couponUsage.count({
        where: {
          coupon_id: coupon.id,
          user_id: userId,
        },
      });
      
      if (userUsage >= coupon.user_usage_limit) {
        return {
          success: false,
          error: `You have already used this coupon ${coupon.user_usage_limit} time${coupon.user_usage_limit > 1 ? 's' : ''}`,
        };
      }
    }
    
    // Check product restrictions if applicable
    if (coupon.product_ids && items.length > 0) {
      const applicableProductIds = coupon.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (applicableProductIds.length > 0) {
        const hasApplicableProducts = items.some(item => 
          applicableProductIds.includes(item.id)
        );
        
        if (!hasApplicableProducts) {
          return {
            success: false,
            error: "This coupon doesn't apply to any items in your cart",
          };
        }
      }
    }
    
    // Check category restrictions if applicable
    if (coupon.category_ids && items.length > 0) {
      const applicableCategoryIds = coupon.category_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (applicableCategoryIds.length > 0) {
        const hasApplicableCategories = items.some(item => 
          applicableCategoryIds.includes(item.cat_id)
        );
        
        if (!hasApplicableCategories) {
          return {
            success: false,
            error: "This coupon doesn't apply to any categories in your cart",
          };
        }
      }
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    
    if (coupon.discount_type === "percentage") {
      discountAmount = total * (coupon.discount_value / 100);
      
      // Apply maximum discount cap if set
      if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      // Fixed amount discount
      discountAmount = coupon.discount_value;
      
      // Ensure discount doesn't exceed cart total
      if (discountAmount > total) {
        discountAmount = total;
      }
    }
    
    // Format the response
    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        currency: coupon.currency || "INR",
      },
    };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return { 
      success: false, 
      error: error.message || "Failed to apply coupon" 
    };
  }
}

/**
 * Get available coupons for a user
 * @param {number} userId - User ID (0 for guest)
 * @param {boolean} isFirstOrder - Whether this is user's first order
 * @returns {Promise<Object>} Available coupons
 */
export async function getAvailableCoupons(userId = 0, isFirstOrder = false) {
  try {
    const currentDate = new Date();
    
    // Base query conditions
    const where = {
      status: "active",
      start_date: { lte: currentDate },
      OR: [
        { end_date: null },
        { end_date: { gt: currentDate } },
      ],
    };
    
    // If not a first order, exclude first-order-only coupons
    if (!isFirstOrder) {
      where.is_first_order = false;
    }
    
    // Get available coupons
    const coupons = await db.coupon.findMany({
      where,
      select: {
        id: true,
        code: true,
        description: true,
        discount_type: true,
        discount_value: true,
        min_order_value: true,
        max_discount: true,
        end_date: true,
        usage_limit: true,
        user_usage_limit: true,
        is_first_order: true,
      },
      orderBy: [
        { is_first_order: "desc" }, // Show first-order coupons first
        { discount_value: "desc" }, // Then highest discount value
      ],
      take: 5, // Limit to top 5 coupons
    });
    
    // Format coupon data for response
    const formattedCoupons = await Promise.all(coupons.map(async (coupon) => {
      // If user is logged in, check if they've already used this coupon
      let userCanUse = true;
      if (userId > 0 && coupon.user_usage_limit !== null) {
        const userUsageCount = await db.couponUsage.count({
          where: {
            coupon_id: coupon.id,
            user_id: userId,
          },
        });
        
        if (userUsageCount >= coupon.user_usage_limit) {
          userCanUse = false;
        }
      }
      
      // Check if coupon has reached global usage limit
      let hasReachedLimit = false;
      if (coupon.usage_limit !== null) {
        const totalUsageCount = await db.couponUsage.count({
          where: { coupon_id: coupon.id },
        });
        
        if (totalUsageCount >= coupon.usage_limit) {
          hasReachedLimit = true;
        }
      }
      
      // Only include coupons the user can actually use
      if (!userCanUse || hasReachedLimit) {
        return null;
      }
      
      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description || (coupon.discount_type === "percentage" ? 
          `${coupon.discount_value}% off your order` : 
          `${coupon.discount_value} off your order`),
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        min_order_value: coupon.min_order_value ? parseFloat(coupon.min_order_value) : null,
        max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
        expires: coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'Never',
        is_first_order: coupon.is_first_order,
        currency: "INR", // Default currency
      };
    }));
    
    // Filter out null entries (coupons user can't use)
    const availableCoupons = formattedCoupons.filter(coupon => coupon !== null);
    
    return {
      success: true,
      coupons: availableCoupons,
    };
  } catch (error) {
    console.error("Error getting available coupons:", error);
    return {
      success: false,
      error: error.message || "Failed to get available coupons",
      coupons: [],
    };
  }
}

/**
 * Record a coupon usage when an order is placed
 * @param {number} orderId - Order ID
 * @param {number} couponId - Coupon ID
 * @param {number} userId - User ID
 * @param {number} discountAmount - Discount amount applied
 * @returns {Promise<Object>} Result of recording usage
 */
export async function recordCouponUsage(orderId, couponId, userId, discountAmount) {
  try {
    if (!orderId || !couponId) {
      return { success: false, error: "Order ID and Coupon ID are required" };
    }
    
    // Create the coupon usage record
    const couponUsage = await db.couponUsage.create({
      data: {
        coupon_id: parseInt(couponId),
        order_id: parseInt(orderId),
        user_id: userId || 0, // Default to 0 for guest users
        discount_amount: parseFloat(discountAmount),
      },
    });
    
    return { success: true, couponUsage };
  } catch (error) {
    console.error("Error recording coupon usage:", error);
    return { success: false, error: error.message || "Failed to record coupon usage" };
  }
}

export async function validateCoupon(code, cartTotal, userId = 0, cartItems = []) {
  try {
    if (!code) {
      return {
        success: false,
        error: "Coupon code is required",
      };
    }

    // Find the coupon
    const coupon = await db.coupon.findUnique({
      where: {
        code: code.toUpperCase(),
        status: "active",
      },
    });

    if (!coupon) {
      return {
        success: false,
        error: "Invalid coupon code",
      };
    }

    // Check if coupon is expired
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
      return {
        success: false,
        error: "Coupon has expired",
      };
    }

    // Check if coupon has not started yet
    if (coupon.start_date && new Date(coupon.start_date) > new Date()) {
      return {
        success: false,
        error: "Coupon is not active yet",
      };
    }

    // Check minimum order value
    if (coupon.min_order_value && Number(cartTotal) < Number(coupon.min_order_value)) {
      return {
        success: false,
        error: `Minimum order value of ${coupon.min_order_value} required`,
        min_order_value: Number(coupon.min_order_value),
      };
    }

    // Check if this is a first-order coupon
    if (coupon.is_first_order && userId > 0) {
      // Count previous orders for this user
      const previousOrders = await db.order.count({
        where: {
          user_id: userId,
        },
      });

      if (previousOrders > 0) {
        return {
          success: false,
          error: "This coupon is valid for first-time orders only",
        };
      }
    }

    // Check usage limits
    if (coupon.usage_limit) {
      const totalUsage = await db.couponUsage.count({
        where: {
          coupon_id: coupon.id,
        },
      });

      if (totalUsage >= coupon.usage_limit) {
        return {
          success: false,
          error: "Coupon usage limit has been reached",
        };
      }
    }

    // Check per-user usage limits
    if (coupon.user_usage_limit && userId > 0) {
      const userUsage = await db.couponUsage.count({
        where: {
          coupon_id: coupon.id,
          user_id: userId,
        },
      });

      if (userUsage >= coupon.user_usage_limit) {
        return {
          success: false,
          error: `You have already used this coupon ${userUsage} times`,
        };
      }
    }

    // Check product/category restrictions if applicable
    if (coupon.product_ids && cartItems.length > 0) {
      const applicableProductIds = coupon.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (applicableProductIds.length > 0) {
        const hasApplicableProducts = cartItems.some(item => 
          applicableProductIds.includes(item.id)
        );

        if (!hasApplicableProducts) {
          return {
            success: false,
            error: "This coupon doesn't apply to any items in your cart",
          };
        }
      }
    }

    if (coupon.category_ids && cartItems.length > 0) {
      const applicableCategoryIds = coupon.category_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (applicableCategoryIds.length > 0) {
        const hasApplicableCategories = cartItems.some(item => 
          applicableCategoryIds.includes(item.cat_id)
        );

        if (!hasApplicableCategories) {
          return {
            success: false,
            error: "This coupon doesn't apply to any items in your cart",
          };
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = Number(cartTotal) * (Number(coupon.discount_value) / 100);
      
      // Apply maximum discount cap if set
      if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
        discountAmount = Number(coupon.max_discount);
      }
    } else {
      // Fixed amount discount
      discountAmount = Number(coupon.discount_value);
      
      // Ensure discount doesn't exceed cart total
      if (discountAmount > Number(cartTotal)) {
        discountAmount = Number(cartTotal);
      }
    }

    // Format the response
    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount_amount: discountAmount.toFixed(2),
      },
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      success: false,
      error: "Failed to validate coupon: " + error.message,
    };
  }
}

/**
 * Apply a coupon to an order
 * @param {number} orderId - Order ID
 * @param {number} couponId - Coupon ID
 * @param {number} userId - User ID
 * @param {number} discountAmount - Calculated discount amount
 * @returns {Promise<Object>} Result of coupon application
 */
export async function applyCouponToOrder(orderId, couponId, userId, discountAmount) {
  try {
    // Update the order with coupon information
    const updatedOrder = await db.order.update({
      where: { id: parseInt(orderId) },
      data: {
        discount_amount: discountAmount,
      },
    });

    // Record the coupon usage
    await db.couponUsage.create({
      data: {
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
      },
    });

    return {
      success: true,
      order: updatedOrder,
    };
  } catch (error) {
    console.error("Error applying coupon to order:", error);
    return {
      success: false,
      error: "Failed to apply coupon: " + error.message,
    };
  }
}

