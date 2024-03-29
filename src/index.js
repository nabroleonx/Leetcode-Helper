import dotenv from "dotenv";
import mongoose from "mongoose";

import bot from "./bot.js";
import DBConnect from "./config/db.js";
import { startCronService } from "./controllers/cron.js";
// import User from "./models/users";

dotenv.config();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  mongoose.connection.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  mongoose.connection.close();
});

const startBot = async () => {
  console.log("Starting app...");

  await DBConnect()
    .then(() => {
      bot.launch();
      console.log("Bot started");
      startCronService();
    })
    .catch((error) => "Bot failed to launch:" + error);
};

startBot();
