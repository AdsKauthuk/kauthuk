"use server";

import { db } from "@/lib/prisma";
import os from "os";
import fs from "fs/promises"; // Using promise-based FS operations
import path from "path";
import * as ftp from "basic-ftp"; // Use FTP client instead of SFTP client

const localTempDir = os.tmpdir();

export async function createBlog(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received data:", data);

    // Store blog details in the database first
    const blog = await db.blog.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date), // Ensure proper date format
      },
    });

    if (data.image && data.image.length > 0) {
      const image = data.image[0];

      // Add current timestamp to the image filename
      const timestamp = Date.now();
      const newImageName = `${timestamp}_${image.name}`;

      // Temporary save location on the server
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await image.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempImagePath, buffer);

      console.log("Temporary image saved at:", tempImagePath);

      // Connect to FTP server
      await ftpClient.access({
        host: "ftp.greenglow.in", // FTP IP address
        port: 21, // FTP port (default is 21)
        user: "u737108297.kauthuktest", // FTP username
        password: "Test_kauthuk#123", // Replace with actual password
      });

      console.log("Connected to FTP server");

      // Upload image to FTP server in the 'public_html/kauthuk_test' directory
      const remoteFilePath = `/kauthuk_test/${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);

      console.log("Image uploaded successfully to:", remoteFilePath);

      // Update blog entry with image path
      await db.blog.update({
        where: { id: blog.id },
        data: { image: newImageName },
      });

      console.log("Blog updated with image path");

      // Remove local temporary file
      await fs.unlink(tempImagePath);
    }

    return blog;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw new Error("Failed to create the blog. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getOneBlog(id) {
  try {
    // console.log(id);
    // console.log("ID type:", typeof id, "ID value:", id);
    const blog = await db.blog.findUnique({
      where: {
        id: id, // Find the blog by its unique ID
      },
    });
    console.log("blog:",blog)

    if (!blog) {
      throw new Error("Failed to fetch the blog. Please try again.");
    }

    return blog;
  } catch (error) {
    throw new Error("Failed to fetch the blog. Please try again.");
  }
}

export async function deleteBlogById(id) {
  console.log("Deleting blog with id:", id);
  if (!id) {
    throw new Error("Blog ID is required");
  }

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    // Fetch the blog to check if it has an associated image
    const blog = await db.blog.findUnique({
      where: { id: id },
      select: { image: true },
    });

    if (!blog) {
      throw new Error("Blog not found");
    }

    if (blog.image) {
      await ftpClient.access({
        host: "ftp.greenglow.in",
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");

      // Define remote image path
      const remoteFilePath = `/kauthuk_test/${blog.image}`;

      // Check if the file exists and delete it
      try {
        await ftpClient.remove(remoteFilePath);
        console.log("Image deleted from FTP:", remoteFilePath);
      } catch (ftpError) {
        console.warn(
          "Error deleting image or file not found:",
          ftpError.message
        );
      }
    }

    // Delete the blog from the database
    const deletedBlog = await db.blog.delete({
      where: { id: id },
    });

    return {
      success: true,
      deletedBlog,
    };
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new Error("Failed to delete the blog. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getBlogs({
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
          title: {
            contains: search, // Case-insensitive by default in MySQL with proper collation
          },
        }
      : {};

    // Fetch blogs with pagination and search filter
    const blogs = await db.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        id: sort === "latest" ? "desc" : "asc", // Sort by creation date
      },
    });

    // Get total count for pagination calculation
    const totalCount = await db.blog.count({ where });

    return {
      blogs: blogs || [], // Ensure blogs is never null
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    throw new Error("Failed to fetch blogs. Please try again later.");
  }
}

export async function updateBlog(id, data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received update data:", data);

    // Fetch the existing blog entry
    const existingBlog = await db.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      throw new Error("Blog not found");
    }

    // Prepare the update data
    const updateData = {
      title: data.title || existingBlog.title,
      description: data.description || existingBlog.description,
      date: data.date ? new Date(data.date) : existingBlog.date,
    };
// console.log("data",typeof(data.image))
    if (data.image && data.image.length > 0 && typeof(data.image)!="string") {
      const image = data.image[0];

      // Add current timestamp to the new image filename
      const timestamp = Date.now();
      const newImageName = `${timestamp}_${image.name}`;

      // Temporary save location on the server
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await image.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempImagePath, buffer);

      console.log("Temporary image saved at:", tempImagePath);

      // Connect to the FTP server
      await ftpClient.access({
        host: "ftp.greenglow.in",
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");

      // Upload new image to FTP server in the 'public_html/kauthuk_test' directory
      const remoteFilePath = `/kauthuk_test/${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);

      console.log("New image uploaded successfully to:", remoteFilePath);

      // Update image path in the update data
      updateData.image = newImageName;

      // Remove local temporary file
      await fs.unlink(tempImagePath);

      // Optionally: delete the old image from the FTP server if desired
      if (existingBlog.image) {
        const oldRemoteFilePath = `/kauthuk_test/${existingBlog.image}`;
        try {
          await ftpClient.remove(oldRemoteFilePath);
          console.log("Old image removed from FTP server:", oldRemoteFilePath);
        } catch (err) {
          console.warn("Failed to remove old image from FTP server:", err);
        }
      }
    }

    // Update blog entry in the database
    const updatedBlog = await db.blog.update({
      where: { id },
      data: updateData,
    });

    console.log("Blog updated successfully:", updatedBlog);

    return updatedBlog;
  } catch (error) {
    console.error("Error updating blog:", error);
    throw new Error("Failed to update the blog. Please try again.");
  } finally {
    ftpClient.close();
  }
}
