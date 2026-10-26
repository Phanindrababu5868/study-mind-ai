import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validatePassword } from "../utils/passwordValidation.js";

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

// 7 days in ms — matches the default token expiry above.
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    ageRange: user.ageRange,
    occupation: user.occupation,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
});

// Chrome rejects SameSite=None cookies that aren't also Secure, and Secure
// cookies need HTTPS. In dev, localhost:5173 -> localhost:8000 is same-site
// (ports don't matter), so "lax" works over plain http. In production the
// frontend and API are typically on different sites, which needs None+Secure.
const cookieOptions = () => {
    const isProd = process.env.NODE_ENV === "production";
    return {
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
    };
};

function setUserInfoCookie(res, user) {
    // Readable by the frontend so Redux can hydrate instantly on first paint
    // without waiting on a /profile round trip. Never put the token in here.
    res.cookie("user_info", JSON.stringify(publicUser(user)), {
        ...cookieOptions(),
        httpOnly: false,
        maxAge: COOKIE_MAX_AGE,
    });
}

function setAuthCookies(res, token, user) {
    // httpOnly: JS on the frontend can never read this, only the browser
    // sends it back automatically on same-site requests.
    res.cookie("token", token, {
        ...cookieOptions(),
        httpOnly: true,
        maxAge: COOKIE_MAX_AGE,
    });

    setUserInfoCookie(res, user);
}

// Browsers only clear a cookie when the attributes match the ones it was
// set with, so reuse the same options here.
function clearAuthCookies(res) {
    res.clearCookie("token", { ...cookieOptions(), httpOnly: true });
    res.clearCookie("user_info", cookieOptions());
}

// ============================================================
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ============================================================
export const register = async (req, res, next) => {
    try {
        const { username, email, password, ageRange, occupation } = req.body||{};

        // Validate required fields
        if (!username || !email || !password || !ageRange || !occupation) {
            return res.status(400).json({
                success: false,
                message: "Please provide username, email, password, age range and occupation",
                statusCode: 400,
            });
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({
                success: false,
                message: passwordCheck.message,
                failedRules: passwordCheck.failedRules,
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
            ageRange,
            occupation,
        });

        const token = generateToken(user._id);
        setAuthCookies(res, token, user);

        // Send response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: publicUser(user),
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

        const token = generateToken(user._id);
        setAuthCookies(res, token, user);

        // Send response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: publicUser(user),
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// @desc    Log out current user
// @route   POST /api/auth/logout
// @access  Public (just clears whatever auth cookies are present)
// ============================================================
export const logout = async (req, res) => {
    clearAuthCookies(res);
    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
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
                ...publicUser(user),
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
        const { username, email, profileImage, ageRange, occupation } = req.body||{};

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

        if (ageRange) {
            user.ageRange = ageRange;
        }

        if (occupation) {
            user.occupation = occupation;
        }

        const updatedUser = await user.save();

        // The readable user_info cookie is a cached copy — keep it in sync
        // whenever the underlying profile changes.
        setUserInfoCookie(res, updatedUser);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: publicUser(updatedUser),
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

        const newPasswordCheck = validatePassword(newPassword);
        if (!newPasswordCheck.valid) {
            return res.status(400).json({
                success: false,
                message: newPasswordCheck.message,
                failedRules: newPasswordCheck.failedRules,
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
