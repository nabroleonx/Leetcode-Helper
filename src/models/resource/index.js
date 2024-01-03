import mongoose from "mongoose";
import resourceSchema from "./schema.js";
import * as staticFunctions from "./statics.js";
import * as methodFunctions from "./methods.js";

resourceSchema.static(staticFunctions);
resourceSchema.method(methodFunctions);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
