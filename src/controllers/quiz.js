import { Markup } from "telegraf";
import Quiz from "../models/quizzes/index.js";

export default function createQuizPaginationKeyboard(totalPages, currentPage) {
  const keyboard = [];

  if (currentPage > 1) {
    keyboard.push([
      Markup.button.callback("Previous", `quiz_page_prev_${currentPage}`),
    ]);
  }

  if (currentPage < totalPages) {
    keyboard[0] = keyboard[0] || [];
    keyboard[0].push(
      Markup.button.callback("Next", `quiz_page_next_${currentPage}`)
    );
  }

  return Markup.inlineKeyboard(keyboard, { columns: 2 });
}

export async function getQuizzes(query = {}) {
  const { page = 1 } = query;
  const filters = {
    limit: process.env.LIMIT || 10,
    page,
  };

  try {
    const quizzes = await Quiz.getQuizzes(filters);
    return quizzes;
  } catch (error) {}
}
