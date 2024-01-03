import { Telegraf, Scenes, session } from "telegraf";
import dotenv from "dotenv";

// import User from "./models/users";
import { getUserInfo } from "./models/users/statics.js";
import {
  getDailyQuestion,
  getProblemsList,
  getRandomQuestion,
} from "./controllers/questions.js";
import { withRetries } from "./helpers/retry.js";
import {
  getBooks,
  resourceTypeInlineKeyboard,
} from "./controllers/resources.js";
import Resource from "./models/resource/index.js";
import { usernameScene } from "./scenes.js";

dotenv.config();

const welcome = (name) => `
Ola ${name}, How you doing, It's nice to see that you are taking control of your DSA journey.

Use /help command to see all the available actions.
`;

const help = `
<b>Commands</b>

/user_info - Get your leetcode info
/daily_question - Get daily leetcode challenge
/set_username - Add your leetcode username to track your progress
/get_random_question - Get random question
/get_questions - Get questions with topics filter
/resources - Get DSA resources
`;

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([usernameScene]);
bot.use(session());
bot.use(stage.middleware());

bot.telegram.setMyCommands([
  { command: "/start", description: "start the bot" },
  { command: "/user_info", description: "Get your leetcode info " },
  { command: "/daily_question", description: "Get today's leetcode challenge" },
  {
    command: "/set_username",
    description: "Add your leetcode username to track your progress",
  },
  {
    command: "/get_random_question",
    description: "Get random question",
  },
  {
    command: "/get_questions",
    description: "Get questions with topics filter",
  },
  {
    command: "/resources",
    description: "Get DSA resources",
  },
]);

bot.start((ctx) => ctx.reply(welcome(ctx.from.first_name)));

bot.help((ctx) => ctx.replyWithHTML(help));

bot.command("user_info", async (ctx) => {
  try {
    const userInfo = await withRetries(async () => {
      return await getUserInfo(ctx.chat.id);
    });

    ctx.replyWithHTML(userInfo, {
      disable_web_page_preview: true,
    });
  } catch (e) {
    console.error("Failed to process command /user_info\n" + e);
  }
});

bot.command("daily_question", async (ctx) => {
  try {
    const dailyQuestion = await withRetries(async () => {
      return await getDailyQuestion();
    });

    const chatId = ctx.chat.id;

    await bot.telegram.sendMessage(chatId, dailyQuestion.message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Check question detail",
              web_app: { url: dailyQuestion.url },
            },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Failed to process command /daily_question\n" + error);
  }
});

bot.command("get_random_question", async (ctx) => {
  try {
    const randomQuestion = await withRetries(async () => {
      return await getRandomQuestion();
    });

    const chatId = ctx.chat.id;

    await bot.telegram.sendMessage(chatId, randomQuestion.message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Check question detail",
              web_app: { url: randomQuestion.url },
            },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Failed to process command /get_random_question\n" + error);
  }
});

bot.command("get_questions", async (ctx) => {
  try {
    const questions = await withRetries(async () => {
      return await getProblemsList();
    });

    const chatId = ctx.chat.id;

    await bot.telegram.sendMessage(chatId, questions, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error("Failed to process command /get_questions\n" + error);
  }
});

bot.command("resources", (ctx) => {
  try {
    ctx.replyWithHTML(
      "What kind of resource are you looking for",
      resourceTypeInlineKeyboard
    );
  } catch (error) {
    console.error("Failed to process command /resources\n" + error);
  }
});

bot.command("set_username", (ctx) => {
  try {
    ctx.scene.enter("username_scene");
  } catch (error) {
    console.error("Failed to process command /set_username\n" + error);
  }
});

bot.action(/^(Books|Videos|Links)$/, async (ctx) => {
  const chatId = ctx.chat.id;

  const resourceType = ctx.match[0];

  if (resourceType === "Books") {
    await getBooks();
  }

  await bot.telegram.sendMessage(chatId, `Sending ${resourceType}`);
});

bot.on("message", async (ctx) => {
  const chatId = ctx.message.chat.id;

  if (ctx.message) {
    const forwardedMessage = ctx.message;

    let fileId = "";
    let hashtags = forwardedMessage.caption.match(/#\w+/g) || [];
    let file_name = "";
    let unique_file_id = "";

    if (forwardedMessage.document) {
      fileId = forwardedMessage.document.file_id;
      file_name = forwardedMessage.document.file_name;
      unique_file_id = forwardedMessage.document.file_unique_id;
    }

    try {
      const file = await Resource.findOne({ unique_file_id: unique_file_id });

      if (!file) {
        await Resource.create({
          file_id: fileId,
          tag: hashtags,
          file_name,
          unique_file_id,
        });
      }
    } catch (err) {
      console.error(err);
      await ctx.reply("Error occurred while storing data.");
    }
  }
});

export default bot;
