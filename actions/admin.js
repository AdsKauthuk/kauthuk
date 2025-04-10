"use server";
import bcrypt from "bcrypt";
import { db } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function createAdmin(data) {
  try {
    // console.log("Received data:", data);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    // Create the admin
    const admin = await db.admin.create({
      data: {
        username: data.username,
        password: hashedPassword,
        user_type: data.user_type,
      },
    });

    // console.log("Admin created successfully:", admin);
    return admin;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("username")) {
      throw new Error("Admin with this name already exists.");
    }

    console.error("Error creating admin:", error);
    throw new Error("Failed to create the admin. Please try again.");
  }
}



export async function adminLogin(data) {
  try {
    const { username, password } = data;
    console.log("Login attempt data:", data);
    
    // Validate input
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }
    // console.log("tokenPayload")

    // Check if the admin exists
    const admin = await db.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new Error("Invalid username or password.");
    }

    // Check if the account is active
    if (admin.status !== "active") {
      throw new Error(
        "Your account is inactive. Please contact the administrator."
      );
    }
// console.log("apple")
    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log("isPasswordValid")
    if (!isPasswordValid) {
      throw new Error("Invalid username or password.");
    }
    
    // Create token payload
    const tokenPayload = {
      id: admin.id,
      username: admin.username,
      user_type: admin.user_type,
      status: admin.status,
    };
    console.log("tokenPayload")

    // Use JWT_SECRET from environment or fallback
    const secret = process.env.JWT_SECRET || "fallback_secret_for_development_only";
    
    // Sign JWT token
    const token = jwt.sign(tokenPayload, secret, { expiresIn: "1d" });
    
    // Return admin details with token
    return {
      id: admin.id,
      username: admin.username,
      user_type: admin.user_type,
      status: admin.status,
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(error.message || "Failed to log in. Please try again.");
  }
}

export async function getAdmins({
  page = 1,
  limit = 15,
  search = "",
  sort = "latest",
}) {
  // console.log("search",search)
  try {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          username: {
            contains: search, // Case-insensitive by default in MySQL with proper collation
          },
        }
      : {};

    // Fetch admins with pagination and search filter
    const admins = await db.admin.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        id: sort === "latest" ? "desc" : "asc", // Sort by creation date
      },
    });

    // Get total count for pagination calculation
    const totalCount = await db.admin.count({ where });

    return {
      admins: admins || [], // Ensure admins is never null
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching admins:", error.message);
    throw new Error("Failed to fetch admins. Please try again later.");
  }
}

export async function getAdmins2() {
  // console.log("search",search)
  try {
    // Fetch admins with pagination and search filter
    const admins = await db.admin.findMany();

    // Get total count for pagination calculation

    return {
      admins: admins || [], // Ensure admins is never null
    };
  } catch (error) {
    console.error("Error fetching admins:", error.message);
    throw new Error("Failed to fetch admins. Please try again later.");
  }
}

export async function updateAdmin(data) {
  try {
    const id = data.id;
    // Validate input
    if (!id || !data?.username || typeof data.username !== "string") {
      throw new Error("Invalid input. 'id' and valid 'username' are required.");
    }

    // Update the admin
    const updatedAdmin = await db.admin.update({
      where: { id },
      data: {
        username: data.username,
      },
    });

    return updatedAdmin;
  } catch (error) {
    // Handle unique constraint error
    if (error.code === "P2002" && error.meta?.target?.includes("username")) {
      throw new Error("Admin with this name already exists.");
    }

    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Admin not found.");
    }

    console.error("Error updating admin:", error);
    throw new Error("Failed to update the admin. Please try again.");
  }
}

export async function toggleAdmin(id) {
  try {
    const admin = await db.admin.findUnique({
      where: {
        id: id, // Find the admin by its unique ID
      },
    });

    // Update the admin
    const toggleData = await db.admin.update({
      where: { id },
      data: {
        status: admin.status == "active" ? "inactive" : "active",
      },
    });

    return toggleData;
  } catch (error) {
    // Handle unique constraint error
    if (error.code === "P2002" && error.meta?.target?.includes("username")) {
      throw new Error("Admin with this name already exists.");
    }

    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Admin not found.");
    }

    console.error("Error updating admin:", error);
    throw new Error("Failed to update the admin. Please try again.");
  }
}

export async function deleteAdminById(id) {
  console.log("id", id);
  if (!id) {
    throw new Error("Admin ID is required");
  }

  // Delete the admin by its unique ID
  const deletedAdmin = await db.admin.delete({
    where: {
      id: id, // Specify the recipe ID to delete
    },
  });

  return {
    success: true,
    deletedAdmin,
  };
}
