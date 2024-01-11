import { Scenes } from "telegraf";
import User from "./models/users/index.js";
import moment from "moment-timezone";

const baseYoutubeUrl = "https://www.youtube.com/watch?v=";
const leetcodeUrl = "https://www.leetcode.com/problems/";

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
        `Your username "${username}" has been saved. \nCheck /user_info for your LeetCode info\n\nP.S. You can also use /settime to set your preferred time to get leetcode daily challenges.`
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("Error occurred while saving your username.");
    }
  }

  return ctx.scene.leave();
});

/**
 * Scene for handling quizzes.
 */
const quizScene = new Scenes.BaseScene("quiz_scene");

quizScene.enter(async (ctx) => {
  const { quiz, currentQuestionIndex, score } = ctx.session;
  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (currentQuestionIndex === 0) {
    await ctx.reply(quiz.leetcodePrompt, {
      parse_mode: "Markdown",
    });
  }

  const questionText = `${currentQuestionIndex + 1}. <b>${
    currentQuestion.questionPrompt
  }</b>\n\n${currentQuestion.choices
    .map((choice, index) => `<b>${index + 1}</b>. <i>${choice.choice}</i>`)
    .join("\n")}`;

  ctx.reply(questionText, {
    parse_mode: "HTML",
  });
});

quizScene.on("message", async (ctx) => {
  const { quiz, currentQuestionIndex, score } = ctx.session;
  const currentQuestion = quiz.questions[currentQuestionIndex];

  if (ctx.message && ctx.message.text) {
    const userAnswer = ctx.message.text.trim();
    const correctAnswer = +currentQuestion.answerIndex + 1;

    if (+userAnswer === correctAnswer) {
      await ctx.reply("🥳 Correct!");
      ctx.session.score += 1;
    } else {
      await ctx.reply("❌ Incorrect!");
    }

    await ctx.replyWithHTML(
      `<b>Answer:</b> ${correctAnswer} \n\n <b>Explanation:</b> <i>${currentQuestion.explanation}</i>`
    );

    if (
      currentQuestionIndex < quiz.questions.length - 1 &&
      quiz.questions[currentQuestionIndex + 1]
    ) {
      const nextQuestComingMsg = await ctx.reply(
        "Next question will be shown in 5 seconds"
      );

      setTimeout(async () => {
        await ctx.deleteMessage(nextQuestComingMsg.message_id);
        ctx.session.currentQuestionIndex += 1;
        ctx.scene.reenter();
      }, 5000);
    } else {
      const scorePercentage = (ctx.session.score / quiz.questions.length) * 100;

      let message = `<b>Congratulations! 🎉 You have completed the quiz. You got ${ctx.session.score} out of ${quiz.questions.length}.\n\n</b>`;
      if (scorePercentage > 50) {
        message += `<i><b>Great job!</b> Consider revisiting the question or watching the solution video to solidify your understanding even more.</i>`;
      } else {
        message += `<i><b>You will do better next time. Keep practicing!</b> 💪🏾 Check out the question and watch the solution video to improve your understanding.</i>`;
      }

      ctx.replyWithHTML(message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Check question detail",
                web_app: { url: leetcodeUrl + quiz.id },
              },
            ],
            [
              {
                text: "Check solution",
                web_app: { url: baseYoutubeUrl + quiz.video },
              },
            ],
          ],
        },
      });
      ctx.scene.leave();
    }
  } else {
    ctx.reply("Please respond with a text answer.");
  }
});

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

export { usernameScene, quizScene, setTimeScene };
