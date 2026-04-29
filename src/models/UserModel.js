const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      require: [true, "First name is required."],
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
      require: [true, "First name is required."],
    },
    email: {
      type: String,
      required: [true, "Email address is required."],
      unique: true,
      lowercase: true, // store email in lowercase
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address."],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: [true, "Username is already taken."],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, 
    },
    contact: {
      type: String, 
      required: [true, "Contact number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v); 
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit phone number!`,
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
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("User", userSchema);
