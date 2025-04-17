"use server";

import { db } from "@/lib/prisma";

/**
 * Get dashboard summary data
 * @returns {Object} Dashboard statistics and data
 */
export async function getDashboardData() {
  try {
    // Fetch counts for main entities
    const [
      productsCount,
      categoriesCount,
      subcategoriesCount,
      ordersCount,
      usersCount,
      blogsCount,
      contactSubmissionsCount
    ] = await Promise.all([
      db.product.count(),
      db.category.count(),
      db.subCategory.count(),
      db.order.count(),
      db.user.count(),
      db.blog.count(),
      db.contactSubmission.count()
    ]);

    // Fetch recent orders
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: {
        order_date: 'desc'
      },
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate summary statistics
    const totalRevenue = await db.order.aggregate({
      where: {
        payment_status: 'completed'
      },
      _sum: {
        total: true
      }
    });

    // Get order stats by status
    const ordersByStatus = await db.order.groupBy({
      by: ['order_status'],
      _count: {
        id: true
      }
    });

    // Format order status data for display
    const orderStatusData = ordersByStatus.map(item => ({
      status: item.order_status,
      count: item._count.id
    }));

    // Create featured products count
    const featuredProductsCount = await db.product.count({
      where: {
        featured: 'yes'
      }
    });

    // Get recent contact submissions
    const recentContactSubmissions = await db.contactSubmission.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stock status
    const lowStockProducts = await db.product.count({
      where: {
        stock_count: {
          lt: 10
        },
        stock_status: 'yes'
      }
    });

    // Format the response
    return {
      success: true,
      data: {
        counts: {
          products: productsCount,
          categories: categoriesCount,
          subcategories: subcategoriesCount,
          orders: ordersCount,
          users: usersCount,
          blogs: blogsCount,
          contactSubmissions: contactSubmissionsCount,
          featuredProducts: featuredProductsCount,
          lowStockProducts
        },
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderId: `ORD-${order.id.toString().padStart(4, '0')}`,
          customer: order.User?.name || 'Guest',
          date: order.order_date,
          status: order.order_status,
          amount: order.total.toString(),
          currency: order.currency
        })),
        revenue: {
          total: totalRevenue._sum.total || 0
        },
        orderStatusData,
        recentContactSubmissions: recentContactSubmissions.map(submission => ({
          id: submission.id,
          name: submission.name,
          email: submission.email,
          subject: submission.subject || '',
          date: submission.createdAt,
          status: submission.status
        }))
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { 
      success: false, 
      error: "Failed to load dashboard data." 
    };
  }
}

/**
 * Repair product subcategories (if needed)
 * This can be a utility function if your database needs maintenance
 */
export async function repairProductSubcategories() {
  try {
    // Check for products with invalid subcategory references
    const invalidProducts = await db.product.findMany({
      where: {
        subcat_id: {
          notIn: {
            select: {
              id: true
            },
            from: 'SubCategory'
          }
        }
      },
      select: {
        id: true,
        title: true,
        cat_id: true,
        subcat_id: true
      }
    });

    if (invalidProducts.length === 0) {
      return {
        success: true,
        message: "No products with invalid subcategories found."
      };
    }

    // Log which products have issues
    console.log(`Found ${invalidProducts.length} products with invalid subcategory references.`);

    // This is just a placeholder for actual repair logic
    // You would implement the actual repair based on your business rules
    const repairResults = {
      processed: invalidProducts.length,
      fixed: 0,
      failed: 0
    };

    return {
      success: true,
      message: `Processed ${repairResults.processed} products. Fixed: ${repairResults.fixed}, Failed: ${repairResults.failed}`,
      invalidProducts
    };
  } catch (error) {
    console.error("Error repairing product subcategories:", error);
    return { 
      success: false, 
      error: "Failed to repair product subcategories." 
    };
  }
}