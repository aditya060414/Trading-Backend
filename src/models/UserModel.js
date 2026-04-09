const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true, // Always store email in lowercase
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // This hides the password from search results by default
    },
    contact: {
      type: String, // String to preserve leading zeros
      required: [true, "Contact number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v); // Regex is more reliable than length on Numbers
        },
        message: (props) => `${props.value} is not a valid 10-digit phone number!`,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    // Automatically remove password and __v when converting to JSON
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 1. FIX: Only hash password if it's new or modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 2. Helper method to compare passwords
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


module.exports = mongoose.model("User", userSchema);
