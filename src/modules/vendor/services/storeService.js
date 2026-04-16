/**
 * Vendor Store Service
 * Business logic for vendor store management
 */

import * as vendorStoreRepo from '../../../models/vendorStoreRepository.js';
import * as vendorDetailRepo from '../../../models/vendorDetailRepository.js';
import logger from '../../../utils/logger.js';

export const getStores = async (vendorId) => {
  const stores = await vendorStoreRepo.getByVendorId(vendorId);
  return stores.map(formatStore);
};

export const createStore = async (vendorId, data) => {
  const store = await vendorStoreRepo.create(vendorId, data);
  return formatStore(store);
};

export const updateStore = async (storeId, vendorId, data) => {
  const store = await vendorStoreRepo.update(storeId, vendorId, data);
  if (!store) throw Object.assign(new Error('Store not found'), { statusCode: 404 });
  return formatStore(store);
};

export const updateStoreStatus = async (vendorId, isActive) => {
  let result = await vendorStoreRepo.updateStatus(vendorId, isActive);

  // Auto-create store if none exists
  if (!result) {
    const vd = await vendorDetailRepo.getByUserId(vendorId);
    const name = vd?.business_name || 'My Store';
    const storeType = vd?.business_type || null;
    const store = await vendorStoreRepo.create(vendorId, { name, storeType, city: '' });
    result = { id: store.id, is_active: store.is_active };
  }

  return result;
};

const formatStore = (s) => ({
  id: s.id,
  name: s.name,
  storeType: s.store_type,
  description: s.description,
  logoUrl: s.logo_url,
  bannerUrl: s.banner_url,
  rating: parseFloat(s.rating) || 0,
  deliveryTime: s.delivery_time,
  deliveryCharge: parseFloat(s.delivery_charge) || 0,
  latitude: s.latitude ? parseFloat(s.latitude) : null,
  longitude: s.longitude ? parseFloat(s.longitude) : null,
  isActive: s.is_active,
  approvalStatus: s.approval_status,
  city: s.city || null
});
