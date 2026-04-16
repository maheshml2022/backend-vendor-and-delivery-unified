/**
 * Customer Catalog Controller
 * Handles catalog browsing for grocery, vegetables, pharmacy
 */

import * as catalogService from '../services/catalogService.js';
import { successResponse, paginatedResponse, errorResponse } from '../../../utils/response.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getCatalogHome = asyncHandler(async (req, res) => {
  const data = await catalogService.getCatalogHome();
  res.json(successResponse(data, 'Catalog home retrieved'));
});

export const getCatalogSection = asyncHandler(async (req, res) => {
  const domain = req.params.domain || req.query.domain;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const data = await catalogService.getCatalogSection(domain, page, limit);
  res.json(paginatedResponse(data.items, data.total, page, limit, `${domain} section retrieved`));
});

export const getCatalogItems = asyncHandler(async (req, res) => {
  const domain = req.params.domain || req.query.domain;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filters = {
    category: req.query.category,
    search: req.query.search,
    storeId: req.query.storeId
  };
  const data = await catalogService.getCatalogItems(domain, filters, page, limit);
  res.json(paginatedResponse(data.items, data.total, page, limit));
});

export const getCatalogItemDetails = asyncHandler(async (req, res) => {
  const item = await catalogService.getCatalogItemDetails(req.params.itemId);
  res.json(successResponse(item));
});

export const searchCatalogItems = asyncHandler(async (req, res) => {
  const domain = req.params.domain || req.query.domain;
  const { query: searchQuery } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (!searchQuery) {
    return res.status(400).json(errorResponse(null, 400, 'Search query is required'));
  }

  const data = await catalogService.searchCatalogItems(domain, searchQuery, page, limit);
  res.json(paginatedResponse(data.items, data.total, page, limit));
});

export const getCatalogCategories = asyncHandler(async (req, res) => {
  const domain = req.params.domain || req.query.domain;
  const categories = await catalogService.getCatalogCategories(domain);
  res.json(successResponse(categories, 'Categories retrieved'));
});

export const getCatalogStoreDetails = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const domain = req.params.domain || req.query.domain;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const data = await catalogService.getCatalogStoreDetails(storeId, domain, page, limit);
  res.json(successResponse(data));
});

// ── Domain-specific convenience endpoints ──────────────────────────────────────

const createDomainHandlers = (domain) => ({
  getStores: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await catalogService.getCatalogItems(domain, {}, page, limit);
    res.json(paginatedResponse(data.items, data.total, page, limit));
  }),

  getItems: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = { category: req.query.category };
    const data = await catalogService.getCatalogItems(domain, filters, page, limit);
    res.json(paginatedResponse(data.items, data.total, page, limit));
  }),

  search: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await catalogService.searchCatalogItems(domain, req.query.query || '', page, limit);
    res.json(paginatedResponse(data.items, data.total, page, limit));
  }),

  getStoreDetails: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await catalogService.getCatalogStoreDetails(req.params.storeId, domain, page, limit);
    res.json(successResponse(data));
  }),

  getCategories: asyncHandler(async (req, res) => {
    const categories = await catalogService.getCatalogCategories(domain);
    res.json(successResponse(categories));
  })
});

export const grocery = createDomainHandlers('grocery');
export const vegetables = createDomainHandlers('vegetables');
export const pharmacy = createDomainHandlers('pharmacy');
