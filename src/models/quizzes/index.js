import mongoose from "mongoose";
import quizSchema from "./schema.js";
import * as staticFunctions from "./statics.js";
import * as methodFunctions from "./methods.js";

quizSchema.static(staticFunctions);
quizSchema.method(methodFunctions);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
