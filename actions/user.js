"use server";

import { db } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

/**
 * Get users with pagination, filtering and sorting
 */
export async function getUsers({ search = "", page = 1, limit = 15, sort = "latest", status = "all" } = {}) {
  try {
    // Validate and parse input parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = ((isNaN(pageNum) ? 1 : Math.max(1, pageNum)) - 1) * (isNaN(limitNum) ? 15 : Math.max(1, limitNum));
    
    // Build the where clause for filtering
    const where = {};
    
    // Apply status filter if specified
    if (status && status !== "all") {
      where.status = status;
    }
    
    // Apply search filter if provided
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim() } },
        { email: { contains: search.trim() } },
        { mobile: { contains: search.trim() } }
      ];
    }
    
    // Determine the orderBy configuration based on sort parameter
    let orderBy = {};
    switch (sort) {
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "most_orders":
        orderBy = { Orders: { _count: "desc" } };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    
    // Execute the query with pagination
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        mobile_verified: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            Orders: true
          }
        }
      },
      orderBy,
      skip,
      take: isNaN(limitNum) ? 15 : Math.max(1, limitNum)
    });
    
    // Count total matching records for pagination
    const totalCount = await db.user.count({ where });
    
    // Format the response data to match the component's expected structure
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      mobileVerified: user.mobile_verified || 'no',
      status: user.status || 'inactive',
      createdAt: user.createdAt || new Date(),
      ordersCount: user._count?.Orders || 0
    }));
    
    return {
      users: formattedUsers,
      totalUsers: totalCount,
      totalPages: Math.ceil(totalCount / (isNaN(limitNum) ? 15 : Math.max(1, limitNum)))
    };
  } catch (error) {
    // Fix for the null payload error - stringify the error or use specific properties
    const errorMessage = error.message || 'Unknown error';
    console.error("Error fetching users: " + errorMessage);
    
    // Return an error response instead of throwing
    return {
      success: false,
      error: "Failed to fetch users: " + errorMessage,
      users: [],
      totalUsers: 0,
      totalPages: 0
    };
  }
}

/**
 * Get a single user by ID with associated data
 */
export async function getUserById(id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "User ID is required"
      };
    }
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return {
        success: false,
        error: "Invalid user ID format"
      };
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        DeliveryAddresses: {
          include: {
            Country: true,
            States: true
          },
          orderBy: { is_default: 'desc' } // Show default addresses first
        },
        BillingAddresses: {
          include: {
            Country: true,
            States: true
          },
          orderBy: { is_default: 'desc' } // Show default addresses first
        },
        Orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            OrderProducts: true,
            ShippingDetail: true
          }
        },
        _count: {
          select: {
            Orders: true,
            DeliveryAddresses: true,
            BillingAddresses: true
          }
        }
      }
    });
    
    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }
    
    // Format the response with additional counts
    const formattedUser = {
      ...user,
      ordersCount: user._count?.Orders || 0,
      deliveryAddressCount: user._count?.DeliveryAddresses || 0,
      billingAddressCount: user._count?.BillingAddresses || 0
    };
    
    delete formattedUser._count;
    delete formattedUser.password; // Remove sensitive information
    
    return {
      success: true,
      user: formattedUser
    };
  } catch (error) {
    // Fix for the null payload error - extract useful information from the error
    const errorMessage = error.message || 'Unknown error';
    console.error("Error fetching user: " + errorMessage);
    
    return {
      success: false,
      error: "Failed to fetch user details: " + errorMessage
    };
  }
}

/**
 * Create a new user
 */
export async function createUser(formData) {
  try {
    if (!formData) {
      return {
        success: false,
        error: "No form data provided"
      };
    }
    
    const name = formData.get("name")?.trim() || '';
    const email = formData.get("email")?.trim() || '';
    const password = formData.get("password") || '';
    const confirmPassword = formData.get("confirmPassword") || '';
    const mobile = formData.get("mobile")?.trim() || '';
    const mobile_verified = formData.get("mobile_verified") || "no";
    const status = formData.get("status") || "active";
    
    // Validate required fields
    if (!name || !email) {
      return {
        success: false,
        error: "Name and email are required"
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Invalid email format"
      };
    }
    
    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return {
        success: false,
        error: "Email is already in use"
      };
    }
    
    // If password is provided, validate and hash it
    let hashedPassword;
    if (password) {
      if (password !== confirmPassword) {
        return {
          success: false,
          error: "Passwords do not match"
        };
      }
      
      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long"
        };
      }
      
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Generate a random password if none provided
      const randomPassword = Math.random().toString(36).slice(-8);
      hashedPassword = await bcrypt.hash(randomPassword, 10);
    }
    
    // Create the user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile: mobile || undefined,
        mobile_verified,
        status
      }
    });
    
    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        status: newUser.status
      }
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || '';
    console.error("Error creating user: " + errorMessage);
    
    if (errorCode === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        success: false,
        error: "Email is already in use"
      };
    }
    return {
      success: false,
      error: "Failed to create user: " + errorMessage
    };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(id, formData) {
  try {
    if (!id || !formData) {
      return {
        success: false,
        error: "User ID and form data are required"
      };
    }
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return {
        success: false,
        error: "Invalid user ID format"
      };
    }
    
    // Check if the user exists
    const userExists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      return {
        success: false,
        error: "User not found"
      };
    }
    
    const name = formData.get("name")?.trim() || '';
    const email = formData.get("email")?.trim() || '';
    const password = formData.get("password") || '';
    const confirmPassword = formData.get("confirmPassword") || '';
    const mobile = formData.get("mobile")?.trim() || '';
    const mobile_verified = formData.get("mobile_verified");
    const status = formData.get("status");
    
    // Validate required fields
    if (!name || !email) {
      return {
        success: false,
        error: "Name and email are required"
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Invalid email format"
      };
    }
    
    // Check if email is already used by another user
    const existingUser = await db.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId
        }
      }
    });
    
    if (existingUser) {
      return {
        success: false,
        error: "Email is already in use by another user"
      };
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
      mobile: mobile || undefined
    };
    
    // Update status if provided
    if (status) {
      updateData.status = status;
    }
    
    // Update mobile verification status if provided
    if (mobile_verified) {
      updateData.mobile_verified = mobile_verified;
    }
    
    // If password is provided and confirmed, update it
    if (password) {
      if (password !== confirmPassword) {
        return {
          success: false,
          error: "Passwords do not match"
        };
      }
      
      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long"
        };
      }
      
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update the user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData
    });
    
    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        status: updatedUser.status
      }
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || '';
    console.error("Error updating user: " + errorMessage);
    
    if (errorCode === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        success: false,
        error: "Email is already in use by another user"
      };
    }
    return {
      success: false,
      error: "Failed to update user: " + errorMessage
    };
  }
}

/**
 * Update user status (activate/deactivate)
 */
export async function updateUserStatus(id, status) {
  try {
    if (!id) {
      return {
        success: false,
        error: "User ID is required"
      };
    }
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return {
        success: false,
        error: "Invalid user ID format"
      };
    }
    
    // Validate status value
    if (status !== "active" && status !== "inactive") {
      return {
        success: false,
        error: "Invalid status value. Status must be 'active' or 'inactive'."
      };
    }
    
    // Check if the user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, name: true }
    });
    
    if (!existingUser) {
      return {
        success: false,
        error: "User not found"
      };
    }
    
    // Skip update if status is already the desired value
    if (existingUser.status === status) {
      return {
        success: true,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          status: existingUser.status
        },
        message: `User is already ${status}`
      };
    }
    
    // Update the user status
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { status }
    });
    
    console.log(`User ${updatedUser.id} (${updatedUser.name}) status changed from ${existingUser.status} to ${status}`);
    
    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        status: updatedUser.status
      },
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    console.error(`Error updating user status (ID: ${id}, Status: ${status}): ${errorMessage}`);
    
    return {
      success: false,
      error: "Failed to update user status: " + errorMessage
    };
  }
}

/**
 * Delete a user by ID
 */
export async function deleteUserById(id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "User ID is required"
      };
    }
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return {
        success: false,
        error: "Invalid user ID format"
      };
    }
    
    // Check if the user exists
    const userExists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      return {
        success: false,
        error: "User not found"
      };
    }
    
    // Check if user has orders
    const userOrders = await db.order.count({
      where: { user_id: userId }
    });
    
    if (userOrders > 0) {
      return {
        success: false,
        error: "Cannot delete user with existing orders. Please deactivate the account instead."
      };
    }
    
    // Delete the user
    await db.user.delete({
      where: { id: userId }
    });
    
    return {
      success: true,
      message: "User deleted successfully"
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || '';
    console.error("Error deleting user: " + errorMessage);
    
    if (errorCode === 'P2003') {
      return {
        success: false,
        error: "Cannot delete user with associated data. Please deactivate the account instead."
      };
    }
    return {
      success: false,
      error: "Failed to delete user: " + errorMessage
    };
  }
}

/**
 * Get user statistics for dashboard
 */
export async function getUserStats() {
  try {
    // Get total counts
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({
      where: { status: "active" }
    });
    const inactiveUsers = await db.user.count({
      where: { status: "inactive" }
    });
    
    // Get new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // Get users with orders
    const usersWithOrders = await db.user.count({
      where: {
        Orders: {
          some: {}
        }
      }
    });
    
    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers,
        usersWithOrders,
        usersWithoutOrders: totalUsers - usersWithOrders
      }
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    console.error("Error fetching user stats: " + errorMessage);
    
    return {
      success: false,
      error: "Failed to fetch user statistics: " + errorMessage,
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        newUsers: 0,
        usersWithOrders: 0,
        usersWithoutOrders: 0
      }
    };
  }
}

/**
 * Check authentication status
 * For use with UserAuthProvider.js
 */
export async function checkAuthStatus() {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return {
        authenticated: false,
        user: null
      };
    }
    
    // Look up session in database
    const session = await db.userSession.findUnique({
      where: {
        token: sessionToken,
        expires: {
          gt: new Date()
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            mobile_verified: true,
            status: true
          }
        }
      }
    });
    
    // If no session found or it's expired
    if (!session || !session.User) {
      // Clear invalid session cookie
      cookieStore.delete('session_token');
      return {
        authenticated: false,
        user: null
      };
    }
    
    // If user account is inactive
    if (session.User.status === 'inactive') {
      return {
        authenticated: false,
        user: null,
        error: "Account is inactive"
      };
    }
    
    // User is authenticated
    return {
      authenticated: true,
      user: session.User
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    console.error("Auth check error: " + errorMessage);
    
    return {
      authenticated: false,
      user: null,
      error: "Authentication check failed: " + errorMessage
    };
  }
}

/**
 * Get the current user's profile information
 * @returns {Promise<Object>} User profile data and success status
 */
export async function getUserProfile() {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return {
        success: false,
        error: "Not authenticated",
        user: null
      };
    }
    
    // Lookup the session and associated user
    const session = await db.userSession.findUnique({
      where: {
        token: sessionToken,
        expires: {
          gt: new Date()
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            mobile_verified: true,
            status: true,
            DeliveryAddresses: true,
            BillingAddresses: true,
            Orders: {
              take: 5,
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });
    
    if (!session || !session.User) {
      // Clear invalid session cookie
      cookieStore.delete('session_token');
      return {
        success: false,
        error: "Invalid or expired session",
        user: null
      };
    }
    
    // If user account is inactive
    if (session.User.status === 'inactive') {
      return {
        success: false,
        error: "Account is inactive",
        user: null
      };
    }
    
    return {
      success: true,
      user: session.User
    };
  } catch (error) {
    // Fix for the null payload error
    const errorMessage = error.message || 'Unknown error';
    console.error("Error fetching user profile: " + errorMessage);
    
    return {
      success: false,
      error: "Failed to retrieve user profile: " + errorMessage,
      user: null
    };
  }
}

/**
 * Log in a user
 */
export async function loginUser(formData) {
  try {
    // Extract credentials from form data
    const email = formData.get("email")?.trim() || '';
    const password = formData.get("password") || '';
    
    // Basic validation
    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required"
      };
    }
    
    // Find the user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        mobile: true,
        mobile_verified: true,
        status: true
      }
    });
    
    // Check if user exists
    if (!user) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }
    
    // Check if user is active
    if (user.status === 'inactive') {
      return {
        success: false,
        error: "Your account is currently inactive. Please contact support."
      };
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }
    
    // Generate a session token
    const token = generateRandomToken(32); // You can implement this helper function
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
    
    // Create or update the user session in database
    await db.userSession.upsert({
      where: { userId: user.id },
      update: {
        token,
        expires: expiresAt
      },
      create: {
        userId: user.id,
        token,
        expires: expiresAt
      }
    });
    
    // Set the session token in the cookies
    cookies().set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      path: '/',
      expires: expiresAt,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Return user data without password
    const { password: _, ...userData } = user;
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    console.error("Login error: " + errorMessage);
    
    return {
      success: false,
      error: "Failed to login: " + errorMessage
    };
  }
}

/**
 * Register a new user
 */
export async function registerUser(formData) {
  try {
    // Extract data from form
    const name = formData.get("name")?.trim() || '';
    const email = formData.get("email")?.trim() || '';
    const password = formData.get("password") || '';
    const confirmPassword = formData.get("confirmPassword") || '';
    const mobile = formData.get("mobile")?.trim() || undefined;
    
    // Basic validation
    if (!name || !email || !password) {
      return {
        success: false,
        error: "Name, email and password are required"
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Invalid email format"
      };
    }
    
    // Check password confirmation
    if (password !== confirmPassword) {
      return {
        success: false,
        error: "Passwords do not match"
      };
    }
    
    // Check password length
    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long"
      };
    }
    
    // Check if email is already registered
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      return {
        success: false,
        error: "Email is already registered"
      };
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        mobile_verified: true,
        status: true
      }
    });
    
    // Generate a session token for automatic login
    const token = generateRandomToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
    
    // Create a session for the user
    await db.userSession.create({
      data: {
        userId: newUser.id,
        token,
        expires: expiresAt
      }
    });
    
    // Set the session cookie
    cookies().set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      path: '/',
      expires: expiresAt,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return {
      success: true,
      user: newUser
    };
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || '';
    console.error("Registration error: " + errorMessage);
    
    if (errorCode === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        success: false,
        error: "Email is already registered"
      };
    }
    
    return {
      success: false,
      error: "Failed to register: " + errorMessage
    };
  }
}

/**
 * Log out a user
 */
export async function logoutUser() {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    // Clear the session cookie
    cookieStore.delete('session_token');
    
    // If no session token was found, return success
    if (!sessionToken) {
      return {
        success: true,
        message: "Already logged out"
      };
    }
    
    // Delete the session from the database
    await db.userSession.deleteMany({
      where: { token: sessionToken }
    });
    
    return {
      success: true,
      message: "Successfully logged out"
    };
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    console.error("Logout error: " + errorMessage);
    
    return {
      success: false,
      error: "Failed to log out: " + errorMessage
    };
  }
}

/**
 * Helper function to generate a random token
 */
function generateRandomToken(length = 32) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return token;
}