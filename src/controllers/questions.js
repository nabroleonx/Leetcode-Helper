import { Markup } from "telegraf";
import { LeetCode } from "leetcode-query";
import mongoose from "mongoose";

const leetcodeUrl = "https://www.leetcode.com";
const solutionBaseUrl = "https://walkccc.me/LeetCode/problems/";

export async function getNeetcodeVideos(questionId) {
  const neetcode_solutions =
    mongoose.connection.collection("neetcode_solutions");
  const video_solution = await neetcode_solutions
    .find({
      question_id: questionId,
    })
    .project({
      _id: 0,
      video_link: 1,
    })
    .toArray();

  const neetcodeSolutions = video_solution
    ? video_solution.map((video, idx) => [
        {
          text: `Neeetcode Solution ${idx + 1}`,
          web_app: {
            url: "https://www.youtube.com/watch?v=" + video.video_link,
          },
        },
      ])
    : [];

  return neetcodeSolutions;
}

const getQuestionInfo = async (question) => {
  const slug = "/problems/" + question.titleSlug;
  const questionId = question.questionFrontendId;
  const questionTitle = question.title;
  const questionUrl = leetcodeUrl + slug;
  const questionTags = question.topicTags.map((topic) => topic.name);
  const questionDifficulty = question.difficulty;
  const solutionUrl =
    solutionBaseUrl +
    (questionId.length < 4 ? (4 - questionId.length) * "0" : "") +
    questionId;
  const neetcodeSolutions = await getNeetcodeVideos(questionId);

  let diffColor = "";
  if (questionDifficulty === "Easy") {
    diffColor = "🟩";
  } else if (questionDifficulty === "Medium") {
    diffColor = "🟨";
  } else if (questionDifficulty === "Hard") {
    diffColor = "🟥";
  }

  return {
    title: questionId + ". " + questionTitle,
    tags: questionTags.join(", "),
    difficulty: diffColor + " " + questionDifficulty,
    url: questionUrl,
    titleSlug: question.titleSlug,
    solutionUrl,
    neetcodeSolutions: [...(neetcodeSolutions && neetcodeSolutions)],
  };
};

export async function getDailyQuestion() {
  try {
    const leetcode = new LeetCode();

    const dailyQuestion = await leetcode.daily();

    const data = await getQuestionInfo(dailyQuestion.question);

    const message = `<b>${data.title}</b>
    \n<b>Topic:</b> <i><span class="tg-spoiler">${data.tags}</span></i>
    \n<b>Difficulty:</b> ${data.difficulty}`;

    return {
      message,
      url: data.url,
      solutionUrl: data.solutionUrl,
      neetcodeSolutions: data.neetcodeSolutions,
    };
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Error fetching daily question from LeetCode");
  }
}

export async function getProblemsList(page) {
  try {
    const leetcode = new LeetCode();

    const problems = await leetcode.problems({
      limit: 10,
      offset: (+page - 1) * 10,
    });

    const questions = await Promise.all(
      problems.questions.map(async (question) => {
        const data = await getQuestionInfo(question);
        return data;
      })
    );

    const message = questions
      .map((problem) => {
        const msg = `${problem.difficulty}\n<b><a href="${problem.url}">${
          problem.title
        }</a></b>\n<i>Tags: </i><i><span class="tg-spoiler">${
          problem.tags
        }</span></i>
<i>/q_${problem.titleSlug.replace(new RegExp("-", "g"), "_")}</i>`;
        return msg;
      })
      .join("\n\n");

    return { message, totalPages: Math.ceil(problems.total / 10) };
  } catch (error) {
    console.error("Error: ", error.message);
    throw new Error("Error fetching daily question from LeetCode");
  }
}

export async function getProblemWithSlug(slug) {
  try {
    const leetcode = new LeetCode();

    const problem = await leetcode.problem(
      slug.replace(new RegExp("_", "g"), "-")
    );

    const data = await getQuestionInfo(problem);

    const message = `
    <b>${data.title}</b>
    \n<b>Topic:</b> <i><span class="tg-spoiler">${data.tags}</span></i>
    \n<b>Difficulty:</b> ${data.difficulty}`;

    return {
      message,
      url: data.url,
      solutionUrl: data.solutionUrl,
      neetcodeSolutions: data.neetcodeSolutions,
    };
  } catch (error) {}
}

export async function getRandomQuestion() {
  try {
    const leetcode = new LeetCode();

    const title = await leetcode.graphql({
      query: `query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
            randomQuestion(categorySlug: $categorySlug, filters: $filters) {
              titleSlug
            }
          }
          `,
      variables: {
        categorySlug: "algorithms",
        filters: {},
      },
    });

    const title_slug = title.data.randomQuestion.titleSlug;
    const randomQuestion = await leetcode.problem(title_slug);

    const data = await getQuestionInfo(randomQuestion);

    const message = `
    <b>${data.title}</b>
    \n<b>Topic:</b> <i> <span class="tg-spoiler"> ${data.tags}</span></i>
    \n<b>Difficulty:</b> ${data.difficulty}`;

    return {
      message,
      url: data.url,
      solutionUrl: data.solutionUrl,
      neetcodeSolutions: data.neetcodeSolutions,
    };
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Error fetching daily question from LeetCode");
  }
}

export function createQuestionPaginationKeyboard(totalPages, currentPage) {
  const keyboard = [];

  if (currentPage > 1) {
    keyboard.push([
      Markup.button.callback("Previous", `ques_prev_${currentPage}`),
    ]);
  }

  if (currentPage < totalPages) {
    keyboard[0] = keyboard[0] || [];
    keyboard[0].push(
      Markup.button.callback("Next", `ques_next_${currentPage}`)
    );
  }

  return Markup.inlineKeyboard(keyboard, { columns: 2 });
}
