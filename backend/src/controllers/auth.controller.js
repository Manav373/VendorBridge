const authService = require('../services/auth.service');
const { success, created, badRequest } = require('../utils/apiResponse');

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    return created(res, result, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login({
      ...req.body,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    return success(res, result, 'Logged in successfully');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token is required');
    const tokens = await authService.refreshToken(refreshToken);
    return success(res, tokens, 'Token refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    return success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return success(res, null, result.message);
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    return success(res, null, result.message);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    return success(res, profile);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await authService.updateProfile(req.user.id, req.body);
    return success(res, profile, 'Profile updated successfully');
  } catch (err) { next(err); }
};

module.exports = { signup, login, refreshToken, logout, forgotPassword, resetPassword, changePassword, getProfile, updateProfile };
