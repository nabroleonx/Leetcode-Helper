import { Scenes } from "telegraf";
import User from "../models/users/index.js";
import moment from "moment-timezone";

/**
 * A scene to set preferred time to get notified
 */
const setTimeScene = new Scenes.BaseScene("setTimeScene");

setTimeScene.enter((ctx) => {
  ctx.reply(
    "You can set your preffered time to get notified about Leetcode daily challenge.\n\nPlease set your preferred time in 12-hour format (HH:MM AM/PM)\n\ne.g. <code>9:30 PM</code>",
    {
      parse_mode: "HTML",
    }
  );
});

setTimeScene.on("message", async (ctx) => {
  const { text } = ctx.message;
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;

  if (text[0] === "/") {
    ctx.scene.leave();
  }

  if (timeRegex.test(text)) {
    const user_id = ctx.message.from.id;

    const userTime = moment(text, "hh:mm A");
    const eatTime = userTime.tz("Africa/Addis_Ababa").format("HH:mm");

    await User.findOneAndUpdate(
      { user_id },
      { cron_time: eatTime },
      { upsert: true, new: true }
    );

    ctx.reply("Your preferred time has been set successfully!");
    ctx.scene.leave();
  } else {
    ctx.reply("Please enter a valid time in HH:MM AM/PM format.");
  }
});

export default setTimeScene;
