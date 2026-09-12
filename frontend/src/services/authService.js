import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const login = async (email, password) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

// Takes the whole payload object rather than positional args — the register
// form now has five fields and positional arguments were becoming a
// footgun (easy to silently transpose email/password/occupation).
const register = async ({ username, email, password, ageRange, occupation }) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
      username,
      email,
      password,
      ageRange,
      occupation,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

// Server-side clear of the httpOnly cookie. JS cannot delete it directly,
// so this round trip is required for a real logout.
const logout = async () => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const getProfile = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const updateProfile = async (userData) => {
  try {
    const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const changePassword = async (passwords) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, passwords);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An unknown error occurred' };
  }
};

const authServices = {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};

export default authServices;
