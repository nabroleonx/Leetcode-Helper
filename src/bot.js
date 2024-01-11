import { Telegraf, Scenes, session, Markup } from "telegraf";
import { message } from "telegraf/filters";
import dotenv from "dotenv";
import { telegrafThrottler } from "telegraf-throttler";

// import User from "./models/users";
import { getUserInfo } from "./models/users/statics.js";
import {
  createQuestionPaginationKeyboard,
  getDailyQuestion,
  getProblemWithSlug,
  getProblemsList,
  getRandomQuestion,
} from "./controllers/questions.js";
import { withRetries } from "./helpers/retry.js";
import {
  bookTypeInlineKeyboard,
  createResourcePaginationKeyboard,
  getResources,
  resourceTypeInlineKeyboard,
} from "./controllers/resources.js";
import Resource from "./models/resource/index.js";
import {
  quizScene,
  setTimeScene,
  usernameScene,
  feedbackScene,
} from "./scenes/index.js";
import Quiz from "./models/quizzes/index.js";
import createQuizPaginationKeyboard, {
  getQuizzes,
} from "./controllers/quiz.js";
import { formatBytes } from "./helpers/utils.js";

dotenv.config();

const welcome = (name) => `
Hello ${name}! 😊 Welcome to Leetcode Helper, your trusted companion in the world of Data Structures and Algorithms.

🚀 <b>Features:</b>
- Get daily Leetcode challenges.
- Take quizzes on specific topics.
- Set a preferred time for daily challenge notifications.
- Compare your Leetcode progress with others.

🤖 <b>How to get started:</b>
1. Use /help command to see all available actions.
2. Set your preferred daily challenge notification time using /settime.
3. Start a quiz with /quiz to test your knowledge.

Stay consistent and enjoy your coding journey! 🌟

This bot is highly inspired by <a href="https://a2sv.org">A2SV</a> and was built to help A2SVians stay consistent
`;

const help = `
<b>Commands</b>

/user_info - Get your leetcode info
/daily_question - Get daily leetcode challenge
/set_username - Add your leetcode username to track your progress
/get_random_question - Get random question
/get_questions - Get questions with topics filter
/resources - Get DSA resources
/quiz - Get Quizzes on different leetcode questions
/roadmap - Handpicked roadmaps/resources
/settime - Set preferred time to get notified about daily leetcode challenge
`;

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([
  usernameScene,
  quizScene,
  setTimeScene,
  feedbackScene,
]);
bot.use(session());
bot.use(stage.middleware());

const throttler = telegrafThrottler({});
bot.use(throttler);

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
  {
    command: "/quiz",
    description: "Get quizzes on different leetcode problems",
  },
  {
    command: "/roadmap",
    description: "Handpicked roadmaps/resources",
  },
  {
    command: "/settime",
    description:
      "Set preferred time to get notified about daily leetcode challenge",
  },
]);

bot.start((ctx) => {
  ctx.replyWithHTML(
    welcome(ctx.from.first_name),
    Markup.keyboard([
      [
        Markup.button.callback("🛠️ Settings", "🛠️ Settings"),
        Markup.button.callback("ℹ️ About A2SV", "ℹ️ About A2SV"),
      ],
      [
        Markup.button.callback("🌐 Invite", "🌐 Invite"),
        Markup.button.callback("📩 Feedback", "📩 Feedback"),
      ],
    ])
      .persistent()
      .resize()
      .oneTime()
  );
});

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
          [
            {
              text: "Check solution",
              web_app: { url: randomQuestion.solutionUrl },
            },
          ],
          ...randomQuestion.neetcodeSolutions,
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
    const { message, totalPages } = await withRetries(async () => {
      return await getProblemsList(1);
    });

    const msg = await ctx.replyWithHTML(message, {
      disable_web_page_preview: true,
      ...createQuestionPaginationKeyboard(totalPages, 1),
    });

    ctx.session.quesListMessageId = msg.message_id;
    ctx.session.currentPage = 1;
  } catch (error) {
    console.error("Failed to process command /get_questions\n" + error);
  }
});

bot.action(/ques_(\w+)_(\d+)/, async (ctx) => {
  let { currentPage, quesListMessageId } = ctx.session;

  if (ctx.match[1] === "prev") {
    currentPage = Math.max(+currentPage - 1, 0);
  } else if (ctx.match[1] === "next") {
    currentPage = +currentPage + 1;
  }
  const { message, totalPages } = await withRetries(async () => {
    return await getProblemsList(currentPage);
  });

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    quesListMessageId,
    undefined,
    message,
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...createQuestionPaginationKeyboard(totalPages, currentPage),
    }
  );
  ctx.session.currentPage = currentPage;
});

bot.command("quiz", async (ctx) => {
  const { quizzes, totalDocuments } = await getQuizzes();

  let message = "<b>List of Quizzes:</b>\n\n";

  quizzes.map((quiz) => {
    let msg = `<b>📚 ${quiz.name}</b>\n<i>/quiz_${quiz._id} | ${quiz.pattern} | ${quiz.questions.length} questions</i>\n\n`;
    message += msg;
  });

  const msg = await ctx.replyWithHTML(
    message,
    createQuizPaginationKeyboard(totalDocuments, 1)
  );

  ctx.session.quizListMessageId = msg.message_id;
  ctx.session.currentPage = 1;
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

bot.command("roadmap", (ctx) => {
  try {
    const roadmap = `<b>Hello there</b> 👋🏾 \n\nEveryone has their own preferred method for interview preparation, and what works for one person might not work for another. The common factor for success is <b><u>Consistent Practice</u></b>. Here are some recommended resources:

    \n1. <b>Tech Interview Handbook</b> - <i>Crafted by Yangshun, an ex-Meta Staff Engineer and author of this handbook and Blind 75. Here is the <a href="https://www.techinterviewhandbook.org/coding-interview-study-plan/">Link</a>
       \n<blockquote>It offers features to customize LeetCode study plans according to your needs and work on the questions in <a href="https://www.techinterviewhandbook.org/grind75">Order 🔗</a></blockquote></i>
    
    \n2. <b>Neetcode</b> - <i>A better way to prepare for coding interviews. Neetcode is known for its awesome LeetCode solution videos.
       \n🌐 <a href="https://neetcode.io/">Neetcode site</a>
       \n🛣️ <a href="https://neetcode.io/roadmap">Neetcode Roadmap</a>
       \n💡 <a href="https://www.youtube.com/c/NeetCode/videos">Main youtube channel</a>
       <blockquote>The <a href="https://www.youtube.com/@NeetCodeIO">Second channel</a>  is what he is using for leetcode problems lately</blockquote></i>
    
    \n3. <b>takeUforward</b> - <i>The series doesn't focus on any specific programming language but emphasizes logic using pseudocode. It's an excellent resource.
       \n 🌐 <a href="https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/">Strivers A2Z DSA Course/Sheet</a></i>
    
    \n<b>Extras</b>:
    \n- <a href="https://leetcode.com/discuss/general-discussion/494279/comprehensive-data-structure-and-algorithm-study-guide">Comprehensive data structure and algorithm study guide</a>
    \n- <a href="https://leetcode.com/discuss/study-guide/2009997/how-to-get-started-with-dsa-and-practice-leetcode-efficiently">How to get started with DSA and practice Leetcode Efficiently</a>
    `;

    ctx.replyWithHTML(roadmap, {
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error("Failed to process command /set_username\n" + error);
  }
});

bot.command("settime", (ctx) => {
  ctx.scene.enter("setTimeScene");
});

bot.action(/^(Books|Videos|Links)$/, async (ctx) => {
  const resourceType = ctx.match[0];

  if (resourceType === "Books") {
    ctx.replyWithHTML(
      "What kind of books are you looking for",
      bookTypeInlineKeyboard
    );
  }
});

bot.action(/^(book|lectureSlide)$/, async (ctx) => {
  const resourceType = ctx.match[0];

  let currentPage = 1;

  const { totalPages, resources } = await getResources({
    page: currentPage,
    tag: `#${resourceType}`,
  });

  let message = "<b>List of Resources:</b>\n\n";

  resources.map((resource) => {
    let msg = `<b>📚 ${resource.file_name}</b>\n<i>/v_${resource._id} | ${
      resource.file_ext
    } | ${formatBytes(resource.file_size)}</i>\n\n`;

    message += msg;
  });

  const msg = await ctx.replyWithHTML(
    message,
    createResourcePaginationKeyboard(totalPages, 1, resourceType)
  );

  ctx.session.resourceListMessageId = msg.message_id;
  ctx.session.currentPage = 1;
});

bot.hears("🛠️ Settings", (ctx) => {
  ctx.reply(
    `Hello ${ctx.from.first_name}, Here in your settings you can
    - Set your leetcode username
    - Configure a time to get daily leetcode solutions at
    `,
    Markup.inlineKeyboard([
      Markup.button.callback("Set/Update Username", "setusername"),
      Markup.button.callback("Question Notification", "settime"),
    ]).resize()
  );
});

const caption = `
<b>Africa to Silicon Valley (A2SV):</b>

<b>Mission:</b>
Bridging the tech talent gap in Africa, A2SV upskills high-potential university students, connects them with global opportunities, and develops digital solutions for local challenges.

<b>Achievements:</b>
- Trained 650+ students in Ethiopia, Ghana, and beyond. 🌍
- Connected students with top tech companies like Google, Meta, and Palantir. 🔗
- Launched innovative social projects, addressing maternal health, language AI, volunteer management, rental markets, food information, and self-learning platforms. 🚀

<b>Expansion:</b>
- Expanded education to Ghana, fostering local talent and conducting remote sessions.
- Established an African Headquarters in Ethiopia. 🌍

<b>Problem and Approach:</b>
Addressing the global tech talent shortage, A2SV focuses on multidisciplinary education, industry connections, and local tech solutions.
Committed to providing free education, empowering students to make a meaningful impact. ✊`;

bot.hears("ℹ️ About A2SV", (ctx) => {
  ctx.replyWithPhoto(
    "https://res.cloudinary.com/eskalate/image/upload/bg_img",
    {
      caption,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Learn more about A2SV",
              url: "https://a2sv.org",
            },
          ],
        ],
      },
    }
  );
});

bot.hears("📩 Feedback", (ctx) => {
  ctx.scene.enter("feedbackScene");
});

const inviteMessage = (userId) => `
Leetcode helper is the companion you need to stay consistent.

Join now 👇🏾
https://t.me/leetcode_helper_bot?start=referral_code_${userId}
`;

bot.hears("🌐 Invite", (ctx) => {
  ctx.reply(
    `Use leetcode helper to stay consistent\nJoin using this link below 👇🏾
    \nhttps://t.me/leetcode_helper_bot?start=referral_code_${ctx.from.id}
    \nIn the near future we will add a feature to give rewards for each invite.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Share",
              url: `https://t.me/share/url?url=${inviteMessage(ctx.from.id)}`,
            },
          ],
        ],
      },
    }
  );
});

bot.action("setusername", (ctx) => {
  ctx.scene.enter("username_scene");
});

bot.action("settime", (ctx) => {
  ctx.scene.enter("setTimeScene");
});

/**
 * Get's forwarded messages(resource files) add them to a database with proper structure
 */
bot.on(message("document"), async (ctx) => {
  if (ctx.message) {
    const forwardedMessage = ctx.message;

    let fileId = "";
    let hashtags = forwardedMessage.caption.match(/#\w+/g) || [];
    let file_name = "";
    let unique_file_id = "";
    let file_ext = "";
    let file_size = 0;

    if (forwardedMessage.document) {
      fileId = forwardedMessage.document.file_id;
      file_name = forwardedMessage.document.file_name;
      unique_file_id = forwardedMessage.document.file_unique_id;
      file_ext = forwardedMessage.document.mime_type
        .split("/")[1]
        .toUpperCase();
      file_size = forwardedMessage.document.file_size;
    }

    try {
      const file = await Resource.findOne({ unique_file_id: unique_file_id });

      if (!file) {
        await Resource.create({
          file_id: fileId,
          tags: hashtags,
          file_name,
          unique_file_id,
          type: "file",
          file_ext,
          file_size,
        });
      }
    } catch (err) {
      console.error(err);
      await ctx.reply("Error occurred while storing data.");
    }
  }
});

/**
 * Takes the id of resource and sends the file
 */
bot.hears(/\/v_(.+)/, async (ctx) => {
  const resourceId = ctx.match[1];
  const resource = await Resource.findById(resourceId);

  ctx.replyWithDocument(resource.file_id);
});

/**
 * Takes quiz id and starts the selected quiz
 */
bot.hears(/\/quiz_(.+)/, async (ctx) => {
  const quizId = ctx.match[1];
  const selectedQuiz = await Quiz.findById(quizId);

  if (selectedQuiz) {
    ctx.session.quiz = selectedQuiz;
    ctx.session.currentQuestionIndex = 0;
    ctx.session.score = 0;
    ctx.scene.enter("quiz_scene");
  }
});

/**
 * Takes question slug and starts the selected question with solution
 */
bot.hears(/\/q_(.+)/, async (ctx) => {
  try {
    const [, slug] = ctx.match;

    const selectedQuestion = await withRetries(async () => {
      return await getProblemWithSlug(slug);
    });

    await ctx.replyWithHTML(selectedQuestion.message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Check question detail",
              web_app: { url: selectedQuestion.url },
            },
          ],
          [
            {
              text: "Check solution",
              web_app: { url: selectedQuestion.solutionUrl },
            },
          ],
          ...selectedQuestion.neetcodeSolutions,
        ],
      },
    });
  } catch (error) {
    console.error("Failed to process get question with slug\n" + error);
  }
});

/**
 * Quiz pagination
 */
bot.action(/quiz_page_(\w+)_(\d+)/, async (ctx) => {
  let { currentPage, quizListMessageId } = ctx.session;

  if (ctx.match[1] === "prev") {
    currentPage = Math.max(+currentPage - 1, 0);
  } else if (ctx.match[1] === "next") {
    currentPage = +currentPage + 1;
  }
  const { quizzes, totalPages } = await getQuizzes({ page: currentPage });

  const newMessage = `<b>List of Quizzes (Page ${currentPage}):</b>\n\n${quizzes
    .map(
      (quiz) =>
        `<b>📚 ${quiz.name}</b>\n<i>/quiz_${quiz._id} | ${quiz.pattern} | ${quiz.questions.length} questions</i>\n\n`
    )
    .join("")}`;

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    quizListMessageId,
    undefined,
    newMessage,
    {
      parse_mode: "HTML",
      ...createQuizPaginationKeyboard(totalPages, currentPage),
    }
  );
  ctx.session.currentPage = currentPage;
});

/**
 * Resource pagination
 */
bot.action(/res_(\w+)_(\w+)_(\d+)/, async (ctx) => {
  const resourceType = ctx.match[2];
  let { currentPage, resourceListMessageId } = ctx.session;

  if (ctx.match[1] === "prev") {
    currentPage = Math.max(+currentPage - 1, 0);
  } else if (ctx.match[1] === "next") {
    currentPage = +currentPage + 1;
  }

  const { totalPages, resources } = await getResources({
    page: currentPage,
    tag: `#${resourceType}`,
  });

  let newMessage = `<b>List of Resources (Page ${currentPage}):</b>\n\n`;

  resources.map((resource) => {
    let msg = `<b>📚 ${resource.file_name}</b>\n<i>/v_${resource._id} | ${
      resource.file_ext
    } | ${formatBytes(resource.file_size)}</i>\n\n`;

    newMessage += msg;
  });

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    resourceListMessageId,
    undefined,
    newMessage,
    {
      parse_mode: "HTML",
      ...createResourcePaginationKeyboard(
        totalPages,
        currentPage,
        resourceType
      ),
    }
  );
  ctx.session.currentPage = currentPage;
});

export default bot;
