import { Scenes } from "telegraf";
import User from "./models/users/index.js";

/**
 * Scene for collecting LeetCode username from the user and storing it in the database.
 */
const usernameScene = new Scenes.BaseScene("username_scene");

usernameScene.enter(async (ctx) => {
  const existingUser = await User.findOne({ user_id: ctx.from.id });

  if (existingUser && existingUser.leetcode_username) {
    await ctx.reply(
      `Your current LeetCode username is "${existingUser.leetcode_username}". \n\nDo you want to update it? if you don't send 'no', \notherwise send your new username`
    );
    return;
  }
  await ctx.reply("Please enter your LeetCode username:");
});

usernameScene.on("message", async (ctx) => {
  const username = ctx.message.text.toLowerCase();

  const existingUser = await User.findOne({ user_id: ctx.from.id });

  if (existingUser && existingUser.leetcode_username) {
    const confirmation = ctx.message.text.toLowerCase();
    if (confirmation.toLowerCase() !== "no") {
      try {
        existingUser.leetcode_username = username;
        await existingUser.save();
        await ctx.reply(`Your username has been updated to "${username}".`);
      } catch (err) {
        console.error(err);
        await ctx.reply("Error occurred while updating your username.");
      }
    } else {
      await ctx.reply("Your current LeetCode username remains unchanged.");
    }
  } else {
    try {
      await User.create({ user_id: ctx.from.id, leetcode_username: username });
      await ctx.reply(
        `Your username "${username}" has been saved. \nCheck /user_info for your LeetCode info`
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("Error occurred while saving your username.");
    }
  }

  return ctx.scene.leave();
});

export { usernameScene };
