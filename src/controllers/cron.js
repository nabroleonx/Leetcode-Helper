import cron from "node-cron";
import User from "../models/users/index.js";
import bot from "../bot.js";
import { getDailyQuestion } from "./questions.js";
import { withRetries } from "../helpers/retry.js";

const sendDailyChallenges = async () => {
  const users = await User.find({ cron_time: { $exists: true, $ne: null } });

  const dailyQuestion = await withRetries(async () => {
    return await getDailyQuestion();
  });

  users.forEach((user) => {
    const [hours, minutes] = user.cron_time.split(":");

    const cronTime = `${minutes} ${hours} * * *`;

    const message = `<b>⛔ STOP WHAT YOU ARE DOING. ⛔</b>\n\n⌚ Its Leetcode time. 🥳
    \n<b><i><u>Stay Consistent!</u></i></b>\n\n${dailyQuestion.message}`;

    cron.schedule(
      cronTime,
      async () => {
        bot.telegram.sendMessage(user.user_id, message, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Check question detail",
                  web_app: { url: dailyQuestion.url },
                },
              ],
              [
                {
                  text: "Check solution",
                  web_app: { url: dailyQuestion.solutionUrl },
                },
              ],
              ...dailyQuestion.neetcodeSolutions,
            ],
          },
          parse_mode: "HTML",
        });
      },
      {
        timezone: "Africa/Addis_Ababa",
      }
    );
  });
};

export const startCronService = () => {
  cron.schedule(
    "0 17 * * *",
    () => {
      sendDailyChallenges();
    },
    {
      timezone: "America/Los_Angeles",
    }
  );
};
