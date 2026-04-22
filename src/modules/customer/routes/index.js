/**
 * Customer Module Routes
 * All customer-specific endpoints
 */

import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../../middleware/authentication.js';
import { requireRole } from '../../../middleware/rbac.js';

// Controllers
import * as addressCtrl from '../controllers/addressController.js';
import * as catalogCtrl from '../controllers/catalogController.js';
import * as menuReviewCtrl from '../controllers/menuReviewController.js';
import * as storeReviewCtrl from '../controllers/storeReviewController.js';
import * as favoritesCtrl from '../controllers/favoritesController.js';

const router = Router();

// ── Address Management (auth required) ─────────────────────────────────────────

router.get('/addresses', authenticate, addressCtrl.getAddresses);
router.post('/addresses', authenticate, addressCtrl.createAddress);
router.put('/addresses/:addressId', authenticate, addressCtrl.updateAddress);
router.delete('/addresses/:addressId', authenticate, addressCtrl.deleteAddress);
router.put('/addresses/:addressId/primary', authenticate, addressCtrl.makePrimaryAddress);

// ── Menu Item Reviews ──────────────────────────────────────────────────────────

router.get('/menu/:menuItemId/reviews', optionalAuthenticate, menuReviewCtrl.listMenuItemReviews);
router.post('/menu/:menuItemId/reviews', authenticate, menuReviewCtrl.createOrUpdateMenuItemReview);
router.delete('/menu/:menuItemId/reviews/:reviewId', authenticate, menuReviewCtrl.removeMenuItemReview);
router.get('/menu/:menuItemId/details', optionalAuthenticate, menuReviewCtrl.getMenuItemDetails);

// ── Store Reviews ──────────────────────────────────────────────────────────────

router.get('/stores/:storeId/reviews', optionalAuthenticate, storeReviewCtrl.listStoreReviews);
router.post('/stores/:storeId/reviews', authenticate, storeReviewCtrl.createOrUpdateStoreReview);
router.delete('/stores/:storeId/reviews/:reviewId', authenticate, storeReviewCtrl.removeStoreReview);
router.get('/stores/:storeId/details', optionalAuthenticate, storeReviewCtrl.getStoreDetails);


// ── Catalog: Home & Generic ────────────────────────────────────────────────────

router.get('/catalog', optionalAuthenticate, catalogCtrl.getCatalogHome);
router.get('/catalog/items/:itemId', optionalAuthenticate, catalogCtrl.getCatalogItemDetails);

// ── Catalog: Grocery ───────────────────────────────────────────────────────────

router.get('/catalog/grocery', optionalAuthenticate, catalogCtrl.grocery.getStores);
router.get('/catalog/grocery/items', optionalAuthenticate, catalogCtrl.grocery.getItems);
router.get('/catalog/grocery/search', optionalAuthenticate, catalogCtrl.grocery.search);
router.get('/catalog/grocery/categories', optionalAuthenticate, catalogCtrl.grocery.getCategories);
router.get('/catalog/grocery/stores/:storeId', optionalAuthenticate, catalogCtrl.grocery.getStoreDetails);

// ── Catalog: Vegetables ────────────────────────────────────────────────────────

router.get('/catalog/vegetables', optionalAuthenticate, catalogCtrl.vegetables.getStores);
router.get('/catalog/vegetables/items', optionalAuthenticate, catalogCtrl.vegetables.getItems);
router.get('/catalog/vegetables/search', optionalAuthenticate, catalogCtrl.vegetables.search);
router.get('/catalog/vegetables/categories', optionalAuthenticate, catalogCtrl.vegetables.getCategories);
router.get('/catalog/vegetables/stores/:storeId', optionalAuthenticate, catalogCtrl.vegetables.getStoreDetails);

// ── Catalog: Pharmacy ──────────────────────────────────────────────────────────

router.get('/catalog/pharmacy', optionalAuthenticate, catalogCtrl.pharmacy.getStores);
router.get('/catalog/pharmacy/items', optionalAuthenticate, catalogCtrl.pharmacy.getItems);
router.get('/catalog/pharmacy/search', optionalAuthenticate, catalogCtrl.pharmacy.search);
router.get('/catalog/pharmacy/categories', optionalAuthenticate, catalogCtrl.pharmacy.getCategories);
router.get('/catalog/pharmacy/stores/:storeId', optionalAuthenticate, catalogCtrl.pharmacy.getStoreDetails);

// ── Catalog: Generic domain endpoints ──────────────────────────────────────

router.get('/catalog/:domain/categories', optionalAuthenticate, catalogCtrl.getCatalogCategories);
router.get('/catalog/:domain/search', optionalAuthenticate, catalogCtrl.searchCatalogItems);
router.get('/catalog/:domain/items', optionalAuthenticate, catalogCtrl.getCatalogItems);
router.get('/catalog/:domain', optionalAuthenticate, catalogCtrl.getCatalogSection);

// ── Favorites Management (auth required) ────────────────────────────────────

// Favorite Restaurants
router.post('/favorites/restaurants', authenticate, favoritesCtrl.addFavoriteRestaurant);
router.delete('/favorites/restaurants/:storeId', authenticate, favoritesCtrl.removeFavoriteRestaurant);
router.get('/favorites/restaurants/:storeId/is-favorite', authenticate, favoritesCtrl.isFavoriteRestaurant);
router.get('/favorites/restaurants', authenticate, favoritesCtrl.getFavoriteRestaurants);

// Favorite Items/Products
router.post('/favorites/items', authenticate, favoritesCtrl.addFavoriteItem);
router.delete('/favorites/items/:itemId', authenticate, favoritesCtrl.removeFavoriteItem);
router.get('/favorites/items/:itemId/is-favorite', authenticate, favoritesCtrl.isFavoriteItem);
router.get('/favorites/items', authenticate, favoritesCtrl.getFavoriteItems);
router.get('/favorites/items/domain/:domain', authenticate, favoritesCtrl.getFavoriteItemsByDomain);

// Favorites Summary
router.get('/favorites/summary', authenticate, favoritesCtrl.getFavoritesSummary);

export default router;
