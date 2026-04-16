/**
 * Customer Address Service
 * Business logic for customer address management
 */

import * as addressRepo from '../../../models/addressRepository.js';
import logger from '../../../utils/logger.js';

export const getUserAddresses = async (userId) => {
  return await addressRepo.getUserAddresses(userId);
};

export const addAddress = async (userId, data) => {
  const newAddress = await addressRepo.createAddress(userId, data);
  // If new address should be primary, set it (clears others automatically)
  if (data.isPrimary) {
    await addressRepo.setPrimaryAddress(newAddress.id, userId);
  }
  return newAddress;
};

export const updateAddress = async (addressId, userId, data) => {
  const address = await addressRepo.getAddressById(addressId, userId);
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });

  if (data.isPrimary) {
    await addressRepo.setPrimaryAddress(addressId, userId);
  }

  return await addressRepo.updateAddress(addressId, userId, data);
};

export const deleteAddress = async (addressId, userId) => {
  const address = await addressRepo.getAddressById(addressId, userId);
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });
  return await addressRepo.deleteAddress(addressId, userId);
};

export const setPrimaryAddress = async (addressId, userId) => {
  const address = await addressRepo.getAddressById(addressId, userId);
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });
  return await addressRepo.setPrimaryAddress(addressId, userId);
};
