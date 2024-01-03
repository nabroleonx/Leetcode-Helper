import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  file_name: { type: String },
  file_id: { type: String, required: true, unique: true },
  unique_file_id: { type: String },
  tags: { type: Array },
});

export default resourceSchema;
