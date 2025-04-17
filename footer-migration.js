// footer-migration.js
// Run this script with Node.js to migrate your current footer data to the new structure
// Usage: node footer-migration.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateFooterData() {
  console.log('Starting footer migration...');

  try {
    // Check if data already exists
    const existingCategories = await prisma.footerCategory.count();
    
    if (existingCategories > 0) {
      console.log('Footer data already exists. To prevent duplication, please truncate the tables first if you want to re-run this migration.');
      console.log('You can do this by running: await prisma.footerLink.deleteMany() and await prisma.footerCategory.deleteMany()');
      return;
    }

    // Create the categories
    const quickLinks = await prisma.footerCategory.create({
      data: {
        title: 'Quick Links',
        displayOrder: 0,
        status: 'active'
      }
    });
    console.log('Created "Quick Links" category');

    const customerService = await prisma.footerCategory.create({
      data: {
        title: 'Customer Service',
        displayOrder: 1,
        status: 'active'
      }
    });
    console.log('Created "Customer Service" category');

    // Add Quick Links
    const quickLinksData = [
      {
        title: 'About Us',
        link: '/pages/about',
        displayOrder: 0,
        status: 'active',
        isExternal: false
      },
      {
        title: 'Shop',
        link: '/products',
        displayOrder: 1,
        status: 'active',
        isExternal: false
      },
      {
        title: 'Contact',
        link: '/contact',
        displayOrder: 2,
        status: 'active',
        isExternal: false
      },
      {
        title: 'Blog',
        link: '/blog',
        displayOrder: 3,
        status: 'active',
        isExternal: false
      },
      {
        title: 'FAQ',
        link: '/faq',
        displayOrder: 4,
        status: 'active',
        isExternal: false
      }
    ];

    for (const linkData of quickLinksData) {
      await prisma.footerLink.create({
        data: {
          ...linkData,
          footerCategoryId: quickLinks.id
        }
      });
    }
    console.log('Added Quick Links');

    // Add Customer Service Links
    const customerServiceData = [
      {
        title: 'Shipping Policy',
        link: '/pages/shipping',
        displayOrder: 0,
        status: 'active',
        isExternal: false
      },
      {
        title: 'Returns & Refunds',
        link: '/pages/returns',
        displayOrder: 1,
        status: 'active',
        isExternal: false
      },
      {
        title: 'Track Your Order',
        link: '/track-order',
        displayOrder: 2,
        status: 'active',
        isExternal: false
      }
    ];

    for (const linkData of customerServiceData) {
      await prisma.footerLink.create({
        data: {
          ...linkData,
          footerCategoryId: customerService.id
        }
      });
    }
    console.log('Added Customer Service Links');

    // Add bottom links for Privacy Policy and Terms of Service
    const legalCategory = await prisma.footerCategory.create({
      data: {
        title: 'Legal',
        displayOrder: 3,
        status: 'active'
      }
    });
    console.log('Created "Legal" category');

    const legalLinks = [
      {
        title: 'Privacy Policy',
        link: '/pages/privacy',
        displayOrder: 0,
        status: 'active',
        isExternal: false
      },
      {
        title: 'Terms of Service',
        link: '/pages/terms',
        displayOrder: 1,
        status: 'active',
        isExternal: false
      }
    ];

    for (const linkData of legalLinks) {
      await prisma.footerLink.create({
        data: {
          ...linkData,
          footerCategoryId: legalCategory.id
        }
      });
    }
    console.log('Added Legal Links');

    console.log('Footer migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFooterData();