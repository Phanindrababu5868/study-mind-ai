import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY || "7d",
        }
    );
};

// ============================================================
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ============================================================
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body||{};

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide username, email and password",
                statusCode: 400,
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
            ],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    existingUser.email === email
                        ? "User with this email already exists"
                        : "Username already taken",
                statusCode: 400,
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
        });

        // Send response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
            },
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ============================================================
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body||{};

        // Validate fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password",
                statusCode: 400,
            });
        }

        // Find user and explicitly select password
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
                statusCode: 401,
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
                statusCode: 401,
            });
        }

        // Send response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
// ============================================================
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                statusCode: 404,
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// ============================================================
export const updateProfile = async (req, res, next) => {
    try {
        const { username, email, profileImage } = req.body||{};

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                statusCode: 404,
            });
        }

        // Update only provided fields
        if (username) {
            user.username = username;
        }

        if (email) {
            user.email = email;
        }

        if (profileImage) {
            user.profileImage = profileImage;
        }

        const updatedUser = await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profileImage: updatedUser.profileImage,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================================
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body||{};

        // Validate fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide current and new password",
                statusCode: 400,
            });
        }

        // Find user and explicitly select password
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                statusCode: 404,
            });
        }

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
                statusCode: 401,
            });
        }

        // Update password
        user.password = newPassword;

        // Password should be hashed by User schema pre("save") middleware
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        next(error);
    }
};
