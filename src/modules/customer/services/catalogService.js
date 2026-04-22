/**
 * Customer Catalog Service
 * Business logic for multi-domain catalog browsing (grocery, vegetables, pharmacy)
 */

import * as catalogRepo from '../../../models/catalogRepository.js';
import logger from '../../../utils/logger.js';

const DUMMY_IMAGES = {
  food: 'https://placehold.co/1200x360/FF6A00/FFFFFF?text=DailyBox+Food',
  grocery: 'https://placehold.co/1200x360/2ECC71/FFFFFF?text=DailyBox+Grocery',
  vegetables: 'https://placehold.co/1200x360/4CAF50/FFFFFF?text=DailyBox+Vegetables',
  pharmacy: 'https://placehold.co/1200x360/1976D2/FFFFFF?text=DailyBox+Pharmacy'
};

const getDummyImageUrl = (domain) => {
  const normalized = (domain || 'grocery').toString().trim().toLowerCase();
  if (normalized === 'veg') return DUMMY_IMAGES.vegetables;
  return DUMMY_IMAGES[normalized] || DUMMY_IMAGES.grocery;
};

const pickBannerImageUrl = ({ domain, stores = [], items = [] }) => {
  const storeBanner = stores.find(store => store?.banner_url)?.banner_url;
  if (storeBanner) return storeBanner;

  const storeLogo = stores.find(store => store?.logo_url)?.logo_url;
  if (storeLogo) return storeLogo;

  const itemImage = items.find(item => item?.image_url)?.image_url;
  if (itemImage) return itemImage;

  return getDummyImageUrl(domain);
};

export const getCatalogHome = async () => {
  const domains = ['food', 'grocery', 'vegetables', 'pharmacy'];
  const homeData = {};

  for (const domain of domains) {
    const items = await catalogRepo.getCatalogHomeItems(domain, 10);
    const stores = await catalogRepo.getStores(domain, 6, 0);
    homeData[domain] = {
      items,
      stores,
      banner_image_url: pickBannerImageUrl({ domain, stores, items })
    };
  }

  return homeData;
};

export const getCatalogSection = async (domain, page, limit) => {
  const offset = (page - 1) * limit;
  const [items, stores, categories, total] = await Promise.all([
    catalogRepo.getCatalogItems({ domain }, limit, offset),
    catalogRepo.getStores(domain, 10, 0),
    catalogRepo.getCategories(domain),
    catalogRepo.countCatalogItems({ domain })
  ]);
  return { items, stores, categories, total };
};

export const getCatalogItems = async (domain, filters, page, limit) => {
  const offset = (page - 1) * limit;
  const fullFilters = { ...filters, domain };
  const [items, total] = await Promise.all([
    catalogRepo.getCatalogItems(fullFilters, limit, offset),
    catalogRepo.countCatalogItems(fullFilters)
  ]);
  return { items, total };
};

export const getCatalogItemDetails = async (itemId) => {
  const item = await catalogRepo.getCatalogItemById(itemId);
  if (!item) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
  return item;
};

export const searchCatalogItems = async (domain, searchTerm, page, limit) => {
  const offset = (page - 1) * limit;
  const filters = { domain, search: searchTerm };
  const [items, total] = await Promise.all([
    catalogRepo.getCatalogItems(filters, limit, offset),
    catalogRepo.countCatalogItems(filters)
  ]);
  return { items, total };
};

export const getCatalogCategories = async (domain) => {
  return await catalogRepo.getCategories(domain);
};

export const getCatalogStoreDetails = async (storeId, domain, page, limit) => {
  const offset = (page - 1) * limit;
  const store = await catalogRepo.getStoreById(storeId, domain);
  if (!store) throw Object.assign(new Error('Store not found'), { statusCode: 404 });

  const [items, categories, total] = await Promise.all([
    catalogRepo.getCatalogItems({ storeId, domain }, limit, offset),
    catalogRepo.getCategories(domain),
    catalogRepo.countCatalogItems({ storeId, domain })
  ]);

  return { store, items, categories, total };
};
