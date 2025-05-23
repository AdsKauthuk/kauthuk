import { z } from "zod";

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof FileList !== 'undefined';

// Custom file validation for both client and server
const fileValidation = z.any()
  .optional()
  .refine(
    (files) => {
      // In the browser with a FileList
      if (isBrowser && files instanceof FileList) {
        return !files || files.length === 0 || Array.from(files).every(file => 
          ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type) && 
          file.size <= 2 * 1024 * 1024
        );
      }
      // In the server or no files
      return true;
    },
    {
      message: "Image must be JPG or PNG and max 2MB",
    }
  );

// Custom file validation for larger files like banners
const bannerFileValidation = z.any()
  .optional()
  .refine(
    (files) => {
      // In the browser with a FileList
      if (isBrowser && files instanceof FileList) {
        return !files || files.length === 0 || Array.from(files).every(file => 
          ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type) && 
          file.size <= 5 * 1024 * 1024
        );
      }
      // In the server or no files
      return true;
    },
    {
      message: "Banner must be JPG or PNG and max 5MB",
    }
  );

export const CategorySchema = z.object({
  title: z.string().min(1, "Category title is required"),
  description: z.string().optional(),
  image: fileValidation,
  banner: bannerFileValidation,
  order_no: z
    .number({
      invalid_type_error: "Order number must be a number",
    })
    .int("Order number must be an integer")
    .nonnegative("Order number must be a non-negative value")
    .default(0)
    .optional(),
});

export const SubcategorySchema = z.object({
  cat_id: z
    .number({
      required_error: "Parent category is required",
      invalid_type_error: "Parent category must be a number",
    })
    .positive("Invalid category ID"),
  title: z
    .string({
      required_error: "Subcategory title is required",
    })
    .min(2, {
      message: "Subcategory title must be at least 2 characters",
    })
    .max(100, {
      message: "Subcategory title must not exceed 100 characters",
    })
    .trim(),
  description: z.string().optional(),
  image: fileValidation,
  banner: bannerFileValidation,
  order_no: z
    .number({
      invalid_type_error: "Order number must be a number",
    })
    .int("Order number must be an integer")
    .nonnegative("Order number must be a non-negative value")
    .default(0)
    .optional(),
});
export const BlogSchema = z.object({
  title: z.string().min(1, "Blog title is required"),
  description: z.string().min(1, "Blog description is required"),
  image: z
    .any()
    .optional(),
  date: z.date(),
});


export const SliderSchema = z.object({
  title: z.string().min(1, "Slider title is required"),
  subtitle: z.string().min("1",{
    message:"Subtitle is required"
  }),
  image: z.any().optional(),
  href: z.string().min("1",{
    message:"Href is required"
  }),
  link: z.string().min("1",{
    message:"Link is required"
  }),
  textColor: z.string().min("1",{
    message:"Text Color is required"
  }),
  alignment: z.enum(["left", "center", "right"]).default("right"),
  linkTitle: z.string().min("1",{
    message:"Link Title is required"
  }),
 
});




export const AttributeSchema = z.object({
  title: z.string().min(1, "Attribute name is required"),
});

export const AttributeValueSchema = z.object({
  value: z.string().min(1, "Attribute value is required"),
  attribute_id: z.number().min(1, "Attribute is required"),
});


export const AdminEnumSchema = z.enum(["admin", "staff"]);


// Admin Schema
export const AdminSchema = z.object({
  username: z.string().min(1, "Username is required").max(255, "Username is too long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  user_type: AdminEnumSchema.default("admin"),
});

// Admin Schema
export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required").max(255, "Username is too long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const StatusEnum = z.enum(["active", "inactive"]);
const YesNoEnum = z.enum(["yes", "no"]);
const ImageTypeEnum = z.enum(["main", "thumbnail", "gallery", "banner"]);

// Schema for image file from form
const FileSchema = z.any()
  .refine((file) => file instanceof File, {
    message: "Must be a valid file"
  })
  .refine((file) => file.size < 5 * 1024 * 1024, {
    message: "File must be less than 5MB"
  })
  .refine((file) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return validTypes.includes(file.type);
  }, {
    message: "File must be a valid image (JPEG, PNG, or WebP)"
  });

// Schema for product attribute value
const ProductAttributeValueSchema = z.object({
  attribute_value_id: z.string().or(z.number()).transform(val => parseInt(val)),
  price_adjustment_rupees: z.string().or(z.number()).optional()
    .transform(val => val ? parseFloat(val) : null),
  price_adjustment_dollars: z.string().or(z.number()).optional()
    .transform(val => val ? parseFloat(val) : null),
});

// Schema for product attribute
const ProductAttributeSchema = z.object({
  attribute_id: z.string().or(z.number()).transform(val => parseInt(val)),
  is_required: z.boolean().default(false),
  values: z.array(ProductAttributeValueSchema).optional(),
});

// Schema for variant attribute value
const VariantAttributeValueSchema = z.object({
  attribute_value_id: z.string().or(z.number()).transform(val => parseInt(val)),
});

// Schema for product variant
const ProductVariantSchema = z.object({
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  price_rupees: z.string().or(z.number()).transform(val => parseFloat(val)),
  price_dollars: z.string().or(z.number()).transform(val => parseFloat(val)),
  stock_count: z.string().or(z.number()).default(0).transform(val => parseInt(val)),
  stock_status: YesNoEnum.default("yes"),
  weight: z.string().or(z.number()).optional().transform(val => val ? parseFloat(val) : null),
  is_default: z.boolean().default(false),
  attribute_values: z.array(VariantAttributeValueSchema),
  images: z.array(FileSchema).optional(),
});

// Main product creation schema
export const createProductSchema = z.object({
  cat_id: z.string().or(z.number()).transform(val => parseInt(val)),
  subcat_id: z.string().or(z.number()).transform(val => parseInt(val)),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: StatusEnum.default("active"),
  hasVariants: z.boolean().default(false),
  base_price: z.string().or(z.number()).transform(val => parseFloat(val)),
  price_rupees: z.string().or(z.number()).transform(val => parseFloat(val)),
  price_dollars: z.string().or(z.number()).transform(val => parseFloat(val)),
  stock_count: z.string().or(z.number()).default(0).transform(val => parseInt(val)),
  stock_status: YesNoEnum.default("yes"),
  quantity_limit: z.string().or(z.number()).default(10).transform(val => parseInt(val)),
  terms_condition: z.string().optional(),
  highlights: z.any().optional(),
  meta_title: z.any().optional(),
  meta_keywords: z.any().optional(),
  meta_description: z.string().optional(),
  hsn_code: z.any().optional(),
  tax: z.any().or(z.number()).optional().transform(val => val ? parseFloat(val) : null),
  weight: z.any().or(z.number()).optional().transform(val => val ? parseFloat(val) : null),
  free_shipping: YesNoEnum.default("no"),
  cod: YesNoEnum.default("yes"),
  
  // Product images (main product images, not variant-specific)
  images: z.array(FileSchema).optional(),
  
  // Product attributes
  attributes: z.array(ProductAttributeSchema).optional(),
  
  // Product variants (only used if hasVariants is true)
  variants: z.array(ProductVariantSchema)
    .optional()
    .superRefine((variants, ctx) => {
      // Validate that if hasVariants is true, at least one variant is provided
      const formData = ctx.data;
      if (formData?.hasVariants && (!variants || variants.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one variant must be provided when 'Has Variants' is enabled",
          path: ["variants"]
        });
      }
      
      // Validate that variants have unique SKUs
      if (variants && variants.length > 0) {
        const skus = new Set();
        variants.forEach((variant, index) => {
          if (skus.has(variant.sku)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Variant SKUs must be unique",
              path: [`variants.${index}.sku`]
            });
          }
          skus.add(variant.sku);
        });
      }
      
      // Check that at least one variant is marked as default
      if (variants && variants.length > 0 && !variants.some(v => v.is_default)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one variant must be marked as default",
          path: ["variants"]
        });
      }
    }),
});

// Schema for product update
export const updateProductSchema = createProductSchema.extend({
  // For updates, we need to identify which images to delete
  deletedImageIds: z.array(z.string().or(z.number()).transform(val => parseInt(val))).optional(),
  
  // New images to add (optional for updates)
  newImages: z.array(FileSchema).optional(),
  
  // For updates, we need to specify which variants to delete
  deletedVariantIds: z.array(z.string().or(z.number()).transform(val => parseInt(val))).optional(),
  
  // For updates, variants can be updated or new ones added
  updatedVariants: z.array(
    ProductVariantSchema.extend({
      id: z.string().or(z.number()).transform(val => parseInt(val)),
      updated_attribute_values: z.array(VariantAttributeValueSchema).optional(),
      deletedImageIds: z.array(z.string().or(z.number()).transform(val => parseInt(val))).optional(),
      newImages: z.array(FileSchema).optional(),
    })
  ).optional(),
  
  newVariants: z.array(ProductVariantSchema).optional(),
  
  // For updates, attributes can be completely replaced
  updatedAttributes: z.array(ProductAttributeSchema).optional(),
});

// Schema for product filtering
export const productFilterSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum([
    "latest", "oldest", "price-high", "price-low", "name-asc", "name-desc"
  ]).default("latest"),
});

// Schema for product deletion
export const deleteProductSchema = z.object({
  id: z.string().or(z.number()).transform(val => parseInt(val)),
});

// Schema for getting a single product
export const getProductSchema = z.object({
  id: z.string().or(z.number()).transform(val => parseInt(val)),
});

export const SiteContentSchema = z.object({
  page: z.string().min(2, "Page identifier is required").max(50, "Page identifier cannot exceed 50 characters"),
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  content: z.string().min(1, "Content is required"),
  link: z.string().min(1, "Link is required"),
});

// In your validators file

export const EnquirySchema = z.object({
  name: z.string().min(2, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  phone: z.string().max(20, "Phone number is too long").optional(),
  message: z.string().min(10, "Please provide a more detailed message")
});

export const MenuSchema = z.object({
  name: z.string().min(1, "Menu name is required")
    .max(100, "Menu name cannot exceed 100 characters")
    .regex(/^[a-z0-9_]+$/, "Name should contain only lowercase letters, numbers and underscores"),
  
  display_name: z.string().min(1, "Display name is required")
    .max(100, "Display name cannot exceed 100 characters"),
  
  path: z.string().optional(),
  
  icon: z.string().nullable().optional(),
  
  parent_id: z.number().nullable().optional(),
  
  sort_order: z.number().nonnegative().default(0),
  
  is_submenu: z.boolean().default(false),
  
  is_header: z.boolean().default(false),
  
  status: z.enum(["active", "inactive"]).default("active"),
}).refine(data => {
  // If marked as header, path should be empty
  if (data.is_header && data.path) {
    return false;
  }
  return true;
}, {
  message: "Section headers should not have a path",
  path: ["path"]
}).refine(data => {
  // Can't be both a header and a submenu
  if (data.is_header && data.is_submenu) {
    return false;
  }
  return true;
}, {
  message: "An item cannot be both a header and a submenu",
  path: ["is_submenu"]
}).refine(data => {
  // Submenu items must have a parent
  if (data.is_submenu && !data.parent_id) {
    return false;
  }
  return true;
}, {
  message: "Submenu items must have a parent menu",
  path: ["parent_id"]
});
export const CouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(30, "Coupon code must be less than 30 characters")
    .refine((val) => /^[A-Z0-9_-]+$/.test(val.toUpperCase()), {
      message: "Coupon code can only contain alphanumeric characters, dashes, and underscores",
    }),
  description: z
    .string()
    .max(255, "Description must be less than 255 characters")
    .optional(),
  discount_type: z.enum(["percentage", "fixed"], {
    required_error: "Please select a discount type",
  }),
  discount_value: z
    .number({
      required_error: "Discount value is required",
      invalid_type_error: "Discount value must be a number",
    })
    .min(0.01, "Discount value must be greater than 0")
    .refine(
      (val, ctx) => {
        if (ctx.data.discount_type === "percentage" && val > 100) {
          return false;
        }
        return true;
      },
      {
        message: "Percentage discount cannot exceed 100%",
      }
    ),
  min_order_value: z
    .number()
    .min(0, "Minimum order value cannot be negative")
    .optional()
    .default(0),
  max_discount: z
    .number()
    .min(0, "Maximum discount cannot be negative")
    .optional()
    .default(0),
  start_date: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date must be a valid date",
  }),
  end_date: z.date().optional().nullable(),
  usage_limit: z
    .number()
    .int("Usage limit must be a whole number")
    .min(0, "Usage limit cannot be negative")
    .optional()
    .nullable(),
  user_usage_limit: z
    .number()
    .int("User usage limit must be a whole number")
    .min(0, "User usage limit cannot be negative")
    .optional()
    .nullable(),
  is_first_order: z.boolean().default(false),
  product_ids: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^(\d+)(,\d+)*$/.test(val);
      },
      {
        message: "Product IDs must be numbers separated by commas (e.g., 1,2,3)",
      }
    ),
  category_ids: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^(\d+)(,\d+)*$/.test(val);
      },
      {
        message: "Category IDs must be numbers separated by commas (e.g., 1,2,3)",
      }
    ),
});