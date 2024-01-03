import mongoose from "mongoose";

const DBConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected!");
  } catch (error) {
    console.log("DB connection failed: ", error);
  }
};

export default DBConnect;
