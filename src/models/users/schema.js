import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true },
  leetcode_username: { type: String },
  cron_time: { type: String },
});

export default userSchema;
