"use server";

import { db } from "@/lib/prisma";
import { cache } from "react";

/**
 * Create a new menu item
 * @param {Object} data - Menu data
 * @returns {Promise<Object>} Created menu
 */
export async function createMenu(data) {
  try {
    if (!data || !data.name || !data.display_name || !data.path) {
      throw new Error("Menu name, display name, and path are required");
    }

    // Create the menu
    const menu = await db.menu.create({
      data: {
        name: data.name.trim(),
        display_name: data.display_name.trim(),
        path: data.path.trim(),
        icon: data.icon?.trim(),
        parent_id: data.parent_id ? parseInt(data.parent_id) : null,
        sort_order: data.sort_order ? parseInt(data.sort_order) : 0,
        is_submenu: !!data.is_submenu,
        is_header: !!data.is_header,
        status: data.status || "active",
      },
    });

    return menu;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Menu with this name already exists.");
    }

    console.error("Error creating menu:", error);
    throw new Error("Failed to create the menu. Please try again.");
  }
}

/**
 * Get all menus with pagination and filtering options
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Menus with pagination info
 */
export async function getMenus({
  page = 1,
  limit = 15,
  search = "",
  sort = "order",
} = {}) {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = ((isNaN(pageNum) ? 1 : pageNum) - 1) * (isNaN(limitNum) ? 15 : limitNum);

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { display_name: { contains: search } },
            { path: { contains: search } },
          ]
        }
      : {};

    // Determine sort order
    let orderBy = {};
    switch (sort) {
      case "name":
        orderBy = { name: "asc" };
        break;
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "order":
      default:
        orderBy = [
          { is_header: "asc" },
          { is_submenu: "asc" },
          { sort_order: "asc" },
          { name: "asc" }
        ];
        break;
    }

    // Fetch menus with pagination and search filter
    const menus = await db.menu.findMany({
      where,
      skip,
      take: isNaN(limitNum) ? 15 : limitNum,
      orderBy,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            display_name: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            display_name: true,
          }
        }
      }
    });

    // Get total count for pagination calculation
    const totalCount = await db.menu.count({ where });

    return {
      menus: menus || [],
      totalPages: Math.ceil(totalCount / (isNaN(limitNum) ? 15 : limitNum)),
    };
  } catch (error) {
    console.error("Error fetching menus:", error.message);
    throw new Error("Failed to fetch menus. Please try again later.");
  }
}

/**
 * Get all menus in a hierarchical structure
 * @returns {Promise<Object>} Hierarchical menu structure
 */
export const getMenuHierarchy = cache(async () => {
  try {
    // Get all header/section menus
    const headers = await db.menu.findMany({
      where: { 
        is_header: true,
        status: 'active'
      },
      orderBy: { sort_order: 'asc' }
    });
    
    // Get all parent menus (non-submenu items)
    const parents = await db.menu.findMany({
      where: { 
        is_submenu: false,
        is_header: false,
        status: 'active'
      },
      orderBy: { sort_order: 'asc' }
    });
    
    // Get all submenu items
    const submenus = await db.menu.findMany({
      where: { 
        is_submenu: true,
        status: 'active'
      },
      orderBy: { sort_order: 'asc' }
    });
    
    // Organize into hierarchy
    const menuStructure = headers.map(header => {
      // Find parent menus for this header
      const headerMenus = parents.filter(parent => parent.parent_id === header.id);
      
      // For each parent menu, find its submenus
      const menuWithChildren = headerMenus.map(parent => {
        const children = submenus.filter(sub => sub.parent_id === parent.id);
        return {
          ...parent,
          children: children || []
        };
      });
      
      return {
        ...header,
        items: menuWithChildren || []
      };
    });
    
    return { menuStructure };
  } catch (error) {
    console.error("Error fetching menu hierarchy:", error);
    return { menuStructure: [] };
  }
});

/**
 * Get menu by ID
 * @param {number} id - Menu ID
 * @returns {Promise<Object>} Menu details
 */
export async function getMenuById(id) {
  try {
    if (!id) {
      throw new Error("Menu ID is required");
    }

    const menuId = parseInt(id);
    if (isNaN(menuId)) {
      throw new Error("Invalid menu ID format");
    }

    const menu = await db.menu.findUnique({
      where: { id: menuId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            display_name: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            display_name: true,
          }
        }
      }
    });

    if (!menu) {
      throw new Error("Menu not found");
    }

    return { menu };
  } catch (error) {
    console.error("Error fetching menu:", error);
    throw new Error(`Failed to fetch menu: ${error.message}`);
  }
}

/**
 * Update an existing menu
 * @param {Object} data - Updated menu data
 * @returns {Promise<Object>} Updated menu
 */
export async function updateMenu(data) {
  try {
    if (!data || !data.id) {
      throw new Error("Menu ID is required");
    }

    const id = parseInt(data.id);
    if (isNaN(id)) {
      throw new Error("Invalid menu ID format");
    }

    // Check if menu exists
    const existingMenu = await db.menu.findUnique({
      where: { id }
    });

    if (!existingMenu) {
      throw new Error("Menu not found");
    }

    // Update the menu
    const updatedMenu = await db.menu.update({
      where: { id },
      data: {
        name: data.name?.trim() || existingMenu.name,
        display_name: data.display_name?.trim() || existingMenu.display_name,
        path: data.path?.trim() || existingMenu.path,
        icon: data.icon?.trim() || existingMenu.icon,
        parent_id: data.parent_id !== undefined ? (data.parent_id ? parseInt(data.parent_id) : null) : existingMenu.parent_id,
        sort_order: data.sort_order !== undefined ? parseInt(data.sort_order) : existingMenu.sort_order,
        is_submenu: data.is_submenu !== undefined ? !!data.is_submenu : existingMenu.is_submenu,
        is_header: data.is_header !== undefined ? !!data.is_header : existingMenu.is_header,
        status: data.status || existingMenu.status,
      },
    });

    return updatedMenu;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Menu with this name already exists.");
    }

    console.error("Error updating menu:", error);
    throw new Error(`Failed to update the menu: ${error.message}`);
  }
}

/**
 * Toggle menu active status
 * @param {number} id - Menu ID
 * @returns {Promise<Object>} Updated menu
 */
export async function toggleMenuStatus(id) {
  try {
    if (!id) {
      throw new Error("Menu ID is required");
    }

    const menuId = parseInt(id);
    if (isNaN(menuId)) {
      throw new Error("Invalid menu ID format");
    }

    const menu = await db.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new Error("Menu not found");
    }

    // Toggle status
    const updatedMenu = await db.menu.update({
      where: { id: menuId },
      data: {
        status: menu.status === "active" ? "inactive" : "active",
      },
    });

    return updatedMenu;
  } catch (error) {
    console.error("Error toggling menu status:", error);
    throw new Error(`Failed to toggle menu status: ${error.message}`);
  }
}

/**
 * Delete menu by ID
 * @param {number} id - Menu ID
 * @returns {Promise<Object>} Result of operation
 */
export async function deleteMenuById(id) {
  try {
    if (!id) {
      throw new Error("Menu ID is required");
    }

    const menuId = parseInt(id);
    if (isNaN(menuId)) {
      throw new Error("Invalid menu ID format");
    }

    // Check if there are any children menus
    const childrenCount = await db.menu.count({
      where: { parent_id: menuId },
    });

    if (childrenCount > 0) {
      throw new Error("Cannot delete menu with child menus. Please delete child menus first.");
    }

    // Delete menu permissions first
    await db.menuPermission.deleteMany({
      where: { menu_id: menuId },
    });

    // Delete the menu
    const deletedMenu = await db.menu.delete({
      where: { id: menuId },
    });

    return {
      success: true,
      deletedMenu,
    };
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Menu not found.");
    }
    
    console.error("Error deleting menu:", error);
    throw new Error(`Failed to delete the menu: ${error.message}`);
  }
}

/**
 * Get menu permissions for a specific admin
 * @param {number} adminId - Admin ID
 * @returns {Promise<Object>} Menu permissions for admin
 */
export async function getMenuPermissionsForAdmin(adminId) {
  try {
    if (!adminId) {
      throw new Error("Admin ID is required");
    }

    const admin = await db.admin.findUnique({
      where: { id: parseInt(adminId) },
      include: {
        MenuPermissions: {
          include: {
            Menu: true
          }
        }
      }
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Check if admin is 'admin' type, which has full access
    if (admin.user_type === 'admin') {
      // Return all menus with full permissions
      const allMenus = await db.menu.findMany({
        where: { status: 'active' }
      });
      
      const fullPermissions = allMenus.map(menu => ({
        menu,
        permissions: {
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true
        }
      }));
      
      return { permissions: fullPermissions };
    }

    // For staff users, return actual permissions
    return { 
      permissions: admin.MenuPermissions.map(perm => ({
        menu: perm.Menu,
        permissions: {
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete
        }
      }))
    };
  } catch (error) {
    console.error("Error fetching menu permissions:", error);
    throw new Error(`Failed to fetch menu permissions: ${error.message}`);
  }
}

/**
 * Set menu permissions for a specific admin
 * @param {Object} data - Permission data
 * @returns {Promise<Object>} Updated permissions
 */
export async function setMenuPermission(data) {
  try {
    if (!data || !data.admin_id || !data.menu_id) {
      throw new Error("Admin ID and Menu ID are required");
    }

    const adminId = parseInt(data.admin_id);
    const menuId = parseInt(data.menu_id);

    if (isNaN(adminId) || isNaN(menuId)) {
      throw new Error("Invalid ID format");
    }

    // Check if admin and menu exist
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    const menu = await db.menu.findUnique({ where: { id: menuId } });

    if (!admin) throw new Error("Admin not found");
    if (!menu) throw new Error("Menu not found");

    // Don't allow changing permissions for admin type users
    if (admin.user_type === 'admin') {
      throw new Error("Cannot modify permissions for administrator accounts");
    }

    // Check if permission already exists
    const existingPermission = await db.menuPermission.findFirst({
      where: {
        admin_id: adminId,
        menu_id: menuId
      }
    });

    let permission;
    if (existingPermission) {
      // Update existing permission
      permission = await db.menuPermission.update({
        where: { id: existingPermission.id },
        data: {
          can_view: data.can_view !== undefined ? !!data.can_view : existingPermission.can_view,
          can_create: data.can_create !== undefined ? !!data.can_create : existingPermission.can_create,
          can_edit: data.can_edit !== undefined ? !!data.can_edit : existingPermission.can_edit,
          can_delete: data.can_delete !== undefined ? !!data.can_delete : existingPermission.can_delete,
        }
      });
    } else {
      // Create new permission
      permission = await db.menuPermission.create({
        data: {
          admin_id: adminId,
          menu_id: menuId,
          can_view: !!data.can_view,
          can_create: !!data.can_create,
          can_edit: !!data.can_edit,
          can_delete: !!data.can_delete,
        }
      });
    }

    return permission;
  } catch (error) {
    console.error("Error setting menu permission:", error);
    throw new Error(`Failed to set menu permission: ${error.message}`);
  }
}

/**
 * Delete a menu permission
 * @param {Object} data - Permission data to delete
 * @returns {Promise<Object>} Result of operation
 */
export async function deleteMenuPermission(data) {
  try {
    if (!data || !data.admin_id || !data.menu_id) {
      throw new Error("Admin ID and Menu ID are required");
    }

    const adminId = parseInt(data.admin_id);
    const menuId = parseInt(data.menu_id);

    if (isNaN(adminId) || isNaN(menuId)) {
      throw new Error("Invalid ID format");
    }

    // Check if permission exists
    const existingPermission = await db.menuPermission.findFirst({
      where: {
        admin_id: adminId,
        menu_id: menuId
      }
    });

    if (!existingPermission) {
      throw new Error("Permission not found");
    }

    // Delete the permission
    await db.menuPermission.delete({
      where: { id: existingPermission.id }
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting menu permission:", error);
    throw new Error(`Failed to delete menu permission: ${error.message}`);
  }
}

/**
 * Get sidebar menu structure for specific admin
 * Filters based on permissions for staff users
 * @param {number} adminId - Admin ID
 * @returns {Promise<Object>} Sidebar menu structure
 */
export const getSidebarMenuForAdmin = cache(async (adminId) => {
  try {
    if (!adminId) {
      throw new Error("Admin ID is required");
    }

    const admin = await db.admin.findUnique({
      where: { id: parseInt(adminId) }
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // If admin type, return all active menus
    if (admin.user_type === 'admin') {
      const menuStructure = await getMenuHierarchy();
      return menuStructure;
    }

    // For staff, get only permitted menus
    const permittedMenuIds = await db.menuPermission.findMany({
      where: {
        admin_id: parseInt(adminId),
        can_view: true
      },
      select: {
        menu_id: true
      }
    });

    const menuIdSet = new Set(permittedMenuIds.map(p => p.menu_id));

    // Get all header/section menus
    const headers = await db.menu.findMany({
      where: { 
        is_header: true,
        status: 'active',
        id: { in: Array.from(menuIdSet) }
      },
      orderBy: { sort_order: 'asc' }
    });
    
    // Get all parent menus (non-submenu items)
    const parents = await db.menu.findMany({
      where: { 
        is_submenu: false,
        is_header: false,
        status: 'active',
        id: { in: Array.from(menuIdSet) }
      },
      orderBy: { sort_order: 'asc' }
    });
    
    // Get all submenu items
    const submenus = await db.menu.findMany({
      where: { 
        is_submenu: true,
        status: 'active',
        id: { in: Array.from(menuIdSet) }
      },
      orderBy: { sort_order: 'asc' }
    });
    
    // Organize into hierarchy
    const menuStructure = headers.map(header => {
      // Find parent menus for this header
      const headerMenus = parents.filter(parent => parent.parent_id === header.id);
      
      // For each parent menu, find its submenus
      const menuWithChildren = headerMenus.map(parent => {
        const children = submenus.filter(sub => sub.parent_id === parent.id);
        return {
          ...parent,
          children: children || []
        };
      });
      
      return {
        ...header,
        items: menuWithChildren || []
      };
    });
    
    return { menuStructure };
  } catch (error) {
    console.error("Error fetching sidebar menu:", error);
    return { menuStructure: [] };
  }
});

export async function getMenuForSidebar() {
    try {
      // Fetch all menu items
      const menuItems = await db.menu.findMany({
        where: {
          status: "active",
        },
        orderBy: [
          { is_header: "desc" },
          { sort_order: "asc" }
        ],
        include: {
          parent: true,
          children: {
            where: {
              status: "active",
            },
            orderBy: {
              sort_order: "asc"
            }
          }
        }
      });
  
      // Transform into hierarchical structure
      const sections = [];
      const headers = menuItems.filter(item => item.is_header);
      
      headers.forEach(header => {
        // Find main menu items that belong to this section
        const mainItems = menuItems.filter(item => 
          !item.is_header && !item.is_submenu && item.parent_id === header.id
        );
        
        const sectionItems = mainItems.map(item => {
          // Find submenu items for this main item
          const subMenuItems = menuItems.filter(subItem => 
            subItem.is_submenu && subItem.parent_id === item.id
          );
          
          const formattedItem = {
            label: item.display_name,
            icon: item.icon,
            href: item.path || null,
          };
          
          // Add submenu if exists
          if (subMenuItems.length > 0) {
            formattedItem.subMenu = subMenuItems.map(sub => ({
              label: sub.display_name,
              href: sub.path,
            }));
          }
          
          return formattedItem;
        });
        
        sections.push({
          section: header.display_name,
          items: sectionItems
        });
      });
      
      return { success: true, data: sections };
    } catch (error) {
      console.error("Error fetching menu data:", error);
      return { 
        success: false, 
        error: error.message || "Failed to load menu" 
      };
    }
  }
  
  // This function is for debugging purposes - can be removed in production
  export async function getMenuItems() {
    try {
      const menuItems = await db.menu.findMany({
        orderBy: [
          { is_header: "desc" },
          { sort_order: "asc" }
        ]
      });
      
      return { success: true, data: menuItems };
    } catch (error) {
      console.error("Error fetching raw menu data:", error);
      return { success: false, error: error.message };
    }
  }