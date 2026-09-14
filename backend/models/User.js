
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { validatePassword, MAX_LENGTH } from "../utils/passwordValidation.js";

export const AGE_RANGES = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },

    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      maxlength: MAX_LENGTH,
      select: false,
      // Only runs when the plaintext password is being set (pre-save hashes
      // it right after, so this never re-validates the bcrypt hash later).
      validate: {
        validator: function (value) {
          if (!this.isModified("password")) return true;
          return validatePassword(value).valid;
        },
        message: (props) => validatePassword(props.value).message || "Password does not meet strength requirements",
      },
    },

    ageRange: {
      type: String,
      required: [true, "Please provide your age range"],
      enum: {
        values: AGE_RANGES,
        message: "Please provide a valid age range",
      },
    },

    occupation: {
      type: String,
      required: [true, "Please provide your occupation"],
      trim: true,
      maxlength: [120, "Occupation must be no more than 120 characters"],
    },

    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  // Don't hash if password hasn't changed
  if (!this.isModified("password")) {
    return
  }

  // Generate salt
  const salt = await bcrypt.genSalt(10);

  // Hash password
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

