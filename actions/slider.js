"use server";

import { db } from "@/lib/prisma";
import os from "os";
import fs from "fs/promises"; // Using promise-based FS operations
import path from "path";
import * as ftp from "basic-ftp"; // Use FTP client instead of SFTP client

const localTempDir = os.tmpdir();

export async function createSlider(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received data:", data);

    // Store slider details in the database first
    const slider = await db.slider.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        href: data.href,
        link: data.link,
        linkTitle: data.linkTitle,
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

      // Update slider entry with image path
      await db.slider.update({
        where: { id: slider.id },
        data: { image: newImageName },
      });

      console.log("Slider updated with image path");

      // Remove local temporary file
      await fs.unlink(tempImagePath);
    }

    return slider;
  } catch (error) {
    if (error.code === "P2002") {
      return { success: false, error: "This title is already exist." };
    }
    console.error("Error creating slider:", error);
    throw new Error("Failed to create the slider. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getOneSlider(id) {
  try {
    // console.log(id);
    // console.log("ID type:", typeof id, "ID value:", id);
    const slider = await db.slider.findUnique({
      where: {
        id: id, // Find the slider by its unique ID
      },
    });
    console.log("slider:", slider);

    if (!slider) {
      throw new Error("Failed to fetch the slider. Please try again.");
    }

    return slider;
  } catch (error) {
    throw new Error("Failed to fetch the slider. Please try again.");
  }
}

export async function deleteSliderById(id) {
  console.log("Deleting slider with id:", id);
  if (!id) {
    throw new Error("Slider ID is required");
  }

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    // Fetch the slider to check if it has an associated image
    const slider = await db.slider.findUnique({
      where: { id: id },
      select: { image: true },
    });

    if (!slider) {
      throw new Error("Slider not found");
    }

    if (slider.image) {
      await ftpClient.access({
        host: "ftp.greenglow.in",
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");

      // Define remote image path
      const remoteFilePath = `/kauthuk_test/${slider.image}`;

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

    // Delete the slider from the database
    const deletedSlider = await db.slider.delete({
      where: { id: id },
    });

    return {
      success: true,
      deletedSlider,
    };
  } catch (error) {
    console.error("Error deleting slider:", error);
    throw new Error("Failed to delete the slider. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getSliders({
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

    // Fetch sliders with pagination and search filter
    const sliders = await db.slider.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        id: sort === "latest" ? "desc" : "asc", // Sort by creation date
      },
    });

    // Get total count for pagination calculation
    const totalCount = await db.slider.count({ where });

    return {
      sliders: sliders || [], // Ensure sliders is never null
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching sliders:", error.message);
    throw new Error("Failed to fetch sliders. Please try again later.");
  }
}

export async function updateSlider(id, data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received update data:", data);

    // Fetch the existing slider entry
    const existingSlider = await db.slider.findUnique({
      where: { id },
    });

    if (!existingSlider) {
      throw new Error("Slider not found");
    }

    // Prepare the update data
    const updateData = {
      title: data.title || existingSlider.title,
    };
    // console.log("data",typeof(data.image))
    if (data.image && data.image.length > 0 && typeof data.image != "string") {
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
      if (existingSlider.image) {
        const oldRemoteFilePath = `/kauthuk_test/${existingSlider.image}`;
        try {
          await ftpClient.remove(oldRemoteFilePath);
          console.log("Old image removed from FTP server:", oldRemoteFilePath);
        } catch (err) {
          console.warn("Failed to remove old image from FTP server:", err);
        }
      }
    }

    // Update slider entry in the database
    const updatedSlider = await db.slider.update({
      where: { id },
      data: updateData,
    });

    console.log("Slider updated successfully:", updatedSlider);

    return updatedSlider;
  } catch (error) {
    if (error.code === "P2002") {
      return { success: false, error: "This title is already exist." };
    }
    console.error("Error updating slider:", error);
    throw new Error("Failed to update the slider. Please try again.");
  } finally {
    ftpClient.close();
  }
}
