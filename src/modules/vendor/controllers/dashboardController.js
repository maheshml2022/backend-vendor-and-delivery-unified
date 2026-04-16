/**
 * Vendor Dashboard Controller
 */

import * as dashboardService from '../services/dashboardService.js';
import { successResponse } from '../../../utils/response.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboard(req.user.userId);
  res.json(successResponse(dashboard));
});
