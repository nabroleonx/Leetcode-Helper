import { Markup } from "telegraf";
import bot from "../bot.js";

export const resourceTypeInlineKeyboard = Markup.inlineKeyboard([
  Markup.button.callback("Books", "Books"),
  Markup.button.callback("Videos", "Videos"),
  Markup.button.callback("Links", "Links"),
]);

export async function getBooks() {
  try {
    // const channel = await bot.telegram.getChat("2142420211");
  } catch (error) {}
}
