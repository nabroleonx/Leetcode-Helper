import { LeetCode } from "leetcode-query";

const leetcodeUrl = "https://www.leetcode.com";

const getQuestionInfo = (question) => {
  const slug = "/problems/" + question.titleSlug;
  const questionId = question.questionFrontendId;
  const questionTitle = question.title;
  const questionUrl = leetcodeUrl + slug;
  const questionTags = question.topicTags.map((topic) => topic.name);
  const questionDifficulty = question.difficulty;

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
    tags: questionTags.join(","),
    difficulty: diffColor + " " + questionDifficulty,
    url: questionUrl,
  };
};

// TODO - add logic to get question solution
export async function getDailyQuestion() {
  try {
    const leetcode = new LeetCode();

    const dailyQuestion = await leetcode.daily();

    const data = getQuestionInfo(dailyQuestion.question);

    const message = `
    <b>${data.title}</b>
    <b>Topic:</b> <code> ${data.tags}</code>
    <b>Difficulty:</b> ${data.difficulty}`;

    return {
      message,
      url: data.url,
    };
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Error fetching daily question from LeetCode");
  }
}

// TODO - add pagination, filtering etc
export async function getProblemsList() {
  try {
    const leetcode = new LeetCode();

    const problems = await leetcode.problems({
      limit: 10,
      offset: 0,
    });

    const questions = problems.questions.map((question) => {
      return getQuestionInfo(question);
    });

    const message = questions
      .map((problem) => {
        const msg = `
${problem.difficulty}
<b><a href="${problem.url}">${problem.title}</a></b>
<i>Tags: </i><code>${problem.tags}</code>
        `;
        return msg;
      })
      .join("\n");

    return message;
  } catch (error) {
    console.error("Error: ", error.message);
    throw new Error("Error fetching daily question from LeetCode");
  }
}

// TODO - add logic to get question solution
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

    const data = getQuestionInfo(randomQuestion);

    const message = `
    <b>${data.title}</b>
    <b>Topic:</b> <code> ${data.tags}</code>
    <b>Difficulty:</b> ${data.difficulty}`;

    return {
      message,
      url: data.url,
    };
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Error fetching daily question from LeetCode");
  }
}
