import mongoose from "mongoose";
import userSchema from "./schema.js";
import * as staticFunctions from "./statics.js";
import * as methodFunctions from "./methods.js";

userSchema.static(staticFunctions);
userSchema.method(methodFunctions);

const User = mongoose.model("User", userSchema);

export default User;
