const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Your email address is required"],
      unique: true,
    },
    username: {
      type: String,
      required: [true, "Your username is required"],
    },
    password: {
      type: String,
      required: [true, "Your Password is required"],
    },
    contact: {
      type: Number,
      required: true,
      validate: {
      validator: function(val) {
        return val.toString().length === 10;
      },
      message: '{VALUE} must be exactly 10 digits'
    }
    },
  },
  {
    timestamps: true,
  },
);
userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("User", userSchema);
