import { optional, z } from "zod";

export const CategorySchema = z.object({
  title: z.string().min(1, "Category title is required"),
});
export const SubcategorySchema = z.object({
  title: z.string().min(1, "Subcategory title is required"),
  cat_id: z.number().min(1, "Category is required"),
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
  highlights: z.string().optional(),
  meta_title: z.string().optional(),
  meta_keywords: z.string().optional(),
  meta_description: z.string().optional(),
  hsn_code: z.string().optional(),
  tax: z.string().or(z.number()).optional().transform(val => val ? parseFloat(val) : null),
  weight: z.string().or(z.number()).optional().transform(val => val ? parseFloat(val) : null),
  free_shipping: YesNoEnum.default("no"),
  cod: YesNoEnum.default("yes"),
  
  // Product images (main product images, not variant-specific)
  images: z.array(FileSchema),
  
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