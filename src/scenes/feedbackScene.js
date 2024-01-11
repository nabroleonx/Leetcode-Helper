import { Scenes, Markup } from "telegraf";
import mongoose from "mongoose";

/**
 * Scene for handling feedbacks.
 */
const feedbackScene = new Scenes.BaseScene("feedbackScene");

feedbackScene.enter((ctx) => {
  ctx.reply(
    "Send your feedback or click the button below to cancel:",
    Markup.inlineKeyboard([
      Markup.button.callback("Cancel Feedback", "cancel_feedback"),
    ])
  );
});

feedbackScene.on("message", async (ctx) => {
  const userId = ctx.from.id;
  const feedback = ctx.message.text;

  const feedbacks_collection = mongoose.connection.collection("feedbacks");
  await feedbacks_collection.updateOne(
    { userId },
    { $set: { feedback } },
    { upsert: true }
  );

  ctx.reply("Thanks for your feedback! 🙏");
  ctx.scene.leave();
});

feedbackScene.action("cancel_feedback", (ctx) => {
  ctx.reply("Feedback process cancelled.");
  ctx.scene.leave();
});

export default feedbackScene;
