import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
    try {
        let token;

        // Prefer the httpOnly cookie (browser clients); fall back to the
        // Authorization header for non-browser API consumers.
        if (req.cookies?.token) {
            token = req.cookies.token;
        } else {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token provided",
                statusCode: 401,
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request (excluding password)
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, user not found",
                statusCode: 401,
            });
        }

        // Token was issued before the last password change → no longer valid
        if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
            return res.status(401).json({
                success: false,
                message: "Password was changed recently, please log in again",
                statusCode: 401,
            });
        }

        req.user = user;
        next();
    } catch (error) {
        // jwt.verify throws JsonWebTokenError / TokenExpiredError,
        // which your errorHandler already maps to 401
        next(error);
    }
};

export default protect;