"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";
import nodemailer from "nodemailer";

// Define validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  subject: z.string().min(3, { message: "Subject must be at least 3 characters long" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters long" })
});

/**
 * Handle contact form submission
 * @param {FormData} formData - Form data from the contact form
 */
export async function submitContactForm(formData) {
  try {
    // Extract data from FormData
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || "",
      subject: formData.get("subject"),
      message: formData.get("message")
    };

    // Validate the input
    const result = contactFormSchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: result.error.errors
      };
    }

    // Store in database
    const contact = await db.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        status: "new"
      }
    });

    // Attempt to send email notification
    let emailSent = false;
    try {
      emailSent = await sendNotificationEmail(data);
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Continue with the process even if email fails
    }

    // Return success
    return { 
      success: true, 
      contact, 
      emailSent,
      message: "Your message has been received. We'll get back to you soon!"
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return { 
      success: false, 
      error: "Failed to submit contact form. Please try again later." 
    };
  }
}

/**
 * Get company contact information
 */
export async function getCompanyContact() {
  try {
    const contact = await db.companyContact.findFirst();
    return { 
      success: true, 
      contact: contact || null 
    };
  } catch (error) {
    console.error("Error fetching company contact:", error);
    return { 
      success: false, 
      error: "Failed to fetch company contact information." 
    };
  }
}

/**
 * Send an email notification about the new contact submission
 * @param {Object} data - Contact form data
 */
async function sendNotificationEmail(data) {
  // Get company contact information to find admin email
  const companyData = await db.companyContact.findFirst();
  
  if (!companyData || !companyData.email) {
    throw new Error("No admin email configured for notifications");
  }

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Email content
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@kauthuk.com',
    to: companyData.email,
    subject: `New Contact: ${data.subject}`,
    text: `
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone || 'Not provided'}
      
      Message:
      ${data.message}
    `,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <h3>Message:</h3>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  return !!info.messageId; // Return true if message ID exists
}

/**
 * Update contact submission status
 * @param {number} id - Contact submission ID
 * @param {string} status - New status
 */
export async function updateContactStatus(id, status) {
  try {
    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return { success: false, error: "Invalid contact ID format" };
    }

    // Validate status
    if (!["new", "read", "responded", "archived"].includes(status)) {
      return { success: false, error: "Invalid status value" };
    }

    // Update the contact status
    const updatedContact = await db.contactSubmission.update({
      where: { id: contactId },
      data: { status }
    });

    return { success: true, contact: updatedContact };
  } catch (error) {
    console.error("Error updating contact status:", error);
    return { success: false, error: "Failed to update contact status." };
  }
}

/**
 * Get all contact submissions with pagination
 * @param {Object} options - Pagination and filtering options
 */
export async function getContactSubmissions({
  page = 1,
  limit = 10,
  status = null,
  sort = "latest"
} = {}) {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = ((isNaN(pageNum) ? 1 : pageNum) - 1) * (isNaN(limitNum) ? 10 : limitNum);

    const where = status ? { status } : {};

    // Fetch submissions with pagination and filters
    const submissions = await db.contactSubmission.findMany({
      where,
      skip,
      take: isNaN(limitNum) ? 10 : limitNum,
      orderBy: {
        createdAt: sort === "latest" ? "desc" : "asc"
      }
    });

    // Get total count for pagination
    const totalCount = await db.contactSubmission.count({ where });

    return {
      success: true,
      submissions: submissions || [],
      totalPages: Math.ceil(totalCount / (isNaN(limitNum) ? 10 : limitNum)),
      totalCount
    };
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return { success: false, error: "Failed to fetch contact submissions." };
  }
}

/**
 * Get a single contact submission by ID
 * @param {number} id - Contact submission ID
 */
export async function getContactSubmission(id) {
  try {
    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return { success: false, error: "Invalid contact ID format" };
    }

    const submission = await db.contactSubmission.findUnique({
      where: { id: contactId }
    });

    if (!submission) {
      return { success: false, error: "Contact submission not found" };
    }

    return { success: true, submission };
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    return { success: false, error: "Failed to fetch contact submission." };
  }
}

/**
 * Delete a contact submission
 * @param {number} id - Contact submission ID
 */
export async function deleteContactSubmission(id) {
  try {
    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return { success: false, error: "Invalid contact ID format" };
    }

    await db.contactSubmission.delete({
      where: { id: contactId }
    });

    return { success: true, message: "Contact submission deleted successfully" };
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    return { success: false, error: "Failed to delete contact submission." };
  }
}

/**
 * Respond to a contact submission
 * @param {number} id - Contact submission ID
 * @param {string} response - Response message
 */
export async function respondToContact(id, response) {
  try {
    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return { success: false, error: "Invalid contact ID format" };
    }

    // Find the contact submission
    const submission = await db.contactSubmission.findUnique({
      where: { id: contactId }
    });

    if (!submission) {
      return { success: false, error: "Contact submission not found" };
    }

    // Update the submission with response
    const updatedSubmission = await db.contactSubmission.update({
      where: { id: contactId },
      data: {
        response,
        responded: true,
        status: "responded"
      }
    });

    // Send response email
    let emailSent = false;
    try {
      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.example.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'support@kauthuk.com',
        to: submission.email,
        subject: `Re: ${submission.subject}`,
        text: response,
        html: `<div>${response.replace(/\n/g, '<br>')}</div>`
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      emailSent = !!info.messageId;
    } catch (emailError) {
      console.error("Failed to send response email:", emailError);
    }

    return { 
      success: true, 
      submission: updatedSubmission, 
      emailSent 
    };
  } catch (error) {
    console.error("Error responding to contact:", error);
    return { success: false, error: "Failed to send response." };
  }
}

/**
 * Update company contact information
 * @param {Object} data - Company contact data
 */
export async function updateCompanyContact(data) {
    try {
      // Validate required fields
      if (!data.address_line1 || !data.city || !data.country || !data.email || !data.phone) {
        return { 
          success: false, 
          error: "Address line 1, city, country, email, and phone are required fields." 
        };
      }
  
      // Check if a record already exists
      const existingContact = await db.companyContact.findFirst();
  
      let contact;
      if (existingContact) {
        // Update existing record
        contact = await db.companyContact.update({
          where: { id: existingContact.id },
          data: {
            address_line1: data.address_line1,
            address_line2: data.address_line2 || null,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
            email: data.email,
            phone: data.phone,
            alt_phone: data.alt_phone || null,
            whatsapp: data.whatsapp || null,
            facebook_url: data.facebook_url || null,
            instagram_url: data.instagram_url || null,
            twitter_url: data.twitter_url || null,
            youtube_url: data.youtube_url || null,
            map_embed_url: data.map_embed_url || null,
            map_latitude: data.map_latitude || null,
            map_longitude: data.map_longitude || null,
          },
        });
      } else {
        // Create new record if none exists
        contact = await db.companyContact.create({
          data: {
            address_line1: data.address_line1,
            address_line2: data.address_line2 || null,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
            email: data.email,
            phone: data.phone,
            alt_phone: data.alt_phone || null,
            whatsapp: data.whatsapp || null,
            facebook_url: data.facebook_url || null,
            instagram_url: data.instagram_url || null,
            twitter_url: data.twitter_url || null,
            youtube_url: data.youtube_url || null,
            map_embed_url: data.map_embed_url || null,
            map_latitude: data.map_latitude || null,
            map_longitude: data.map_longitude || null,
          },
        });
      }
  
      return { success: true, contact };
    } catch (error) {
      console.error("Error updating company contact:", error);
      return { success: false, error: "Failed to update company contact information." };
    }
  }