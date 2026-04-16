/**
 * Vendor Product Service
 * Business logic for vendor product/menu management
 */

import * as productRepo from '../../../models/productRepository.js';
import * as productImageRepo from '../../../models/productImageRepository.js';
import logger from '../../../utils/logger.js';

export const getProducts = async (vendorId, storeId = null) => {
  const products = await productRepo.getProductsByVendor(vendorId, storeId);
  return products.map(formatProduct);
};

export const createProduct = async (vendorId, data) => {
  const product = await productRepo.createProduct(vendorId, data);
  return formatProduct(product);
};

export const updateProduct = async (productId, vendorId, data) => {
  const product = await productRepo.updateProduct(productId, vendorId, data);
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  return formatProduct(product);
};

export const deleteProduct = async (productId, vendorId) => {
  const result = await productRepo.deleteProduct(productId, vendorId);
  if (!result) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  return result;
};

export const addProductImage = async (productId, vendorId, imageUrl, isPrimary = false) => {
  const owned = await productRepo.isOwnedByVendor(productId, vendorId);
  if (!owned) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  return await productImageRepo.addImage(productId, imageUrl, isPrimary);
};

const formatProduct = (p) => ({
  id: p.id,
  storeId: p.store_id,
  vendorId: p.vendor_id,
  name: p.name,
  description: p.description,
  category: p.category,
  price: parseFloat(p.price),
  originalPrice: parseFloat(p.original_price) || parseFloat(p.price),
  imageUrl: p.image_url,
  thumbnailUrl: p.thumbnail_url,
  isVegetarian: p.is_vegetarian,
  discountPercentage: parseFloat(p.discount_percentage) || 0,
  requiresPrescription: p.requires_prescription,
  isAvailable: p.is_available,
  stockQuantity: p.stock_quantity || 0,
  extraImages: p.extra_images || [],
  createdAt: p.created_at
});
