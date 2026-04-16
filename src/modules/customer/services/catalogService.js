/**
 * Customer Catalog Service
 * Business logic for multi-domain catalog browsing (grocery, vegetables, pharmacy)
 */

import * as catalogRepo from '../../../models/catalogRepository.js';
import logger from '../../../utils/logger.js';

export const getCatalogHome = async () => {
  const domains = ['grocery', 'vegetables', 'pharmacy'];
  const homeData = {};

  for (const domain of domains) {
    const items = await catalogRepo.getCatalogHomeItems(domain, 10);
    const stores = await catalogRepo.getStores(domain, 6, 0);
    homeData[domain] = { items, stores };
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
