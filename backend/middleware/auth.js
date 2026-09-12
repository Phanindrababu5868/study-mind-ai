import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
    try {
        let token;

        // Expect header: Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
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

        req.user = user;
        next();
    } catch (error) {
        // jwt.verify throws JsonWebTokenError / TokenExpiredError,
        // which your errorHandler already maps to 401
        next(error);
    }
};

export default protect;