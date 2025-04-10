import { getOneProduct } from '@/actions/product';
import React from 'react';
import ProductDetails from './_components/ProductData';

export async function generateMetadata({ params }) {
  // Bug fix 1: Safely handle params and access the details array
  const id = params?.details?.[0];
  
  // Bug fix 2: Add error handling around the product fetch
  let product;
  try {
    if (!id) throw new Error('Product ID is missing');
    product = await getOneProduct(id);
    if (!product) throw new Error('Product not found');
  } catch (error) {
    console.error('Error fetching product metadata:', error);
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found',
    };
  }
  
  // Bug fix 3: Safely access properties with null coalescing and optional chaining
  return {
    title: product.meta_title || product.title || 'Product Details',
    description: product.meta_description || product.description?.substring(0, 160) || 'Product information',
    keywords: product.meta_keywords || '',
    openGraph: {
      title: product.meta_title || product.title || 'Product Details',
      description: product.meta_description || product.description?.substring(0, 160) || 'Product information',
      // Bug fix 4: Safely handle image paths and add a default image fallback
      images: product.ProductImages?.length > 0 ? 
        [`https://greenglow.in/kauthuk_test/${product.ProductImages[0].image_path}`] : 
        ['https://greenglow.in/kauthuk_test/default-product.jpg'],
    },
  };
}

// Bug fix 5: Make page component receive and pass params to ProductDetails
const Page = async ({ params }) => {
  const id = params?.details?.[0];
  
  return (
    <ProductDetails productId={id} />
  );
};

export default Page;