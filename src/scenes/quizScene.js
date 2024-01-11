import { Scenes } from "telegraf";

const baseYoutubeUrl = "https://www.youtube.com/watch?v=";
const leetcodeUrl = "https://www.leetcode.com/problems/";

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

export default quizScene;
