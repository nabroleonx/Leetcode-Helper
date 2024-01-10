import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  file_name: { type: String },
  file_id: { type: String, required: true, unique: true },
  unique_file_id: { type: String },
  tags: { type: Array },
  type: { type: String },
  file_ext: { type: String },
  file_size: { type: Number },
});

export default resourceSchema;
