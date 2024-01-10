import { Markup } from "telegraf";
import Resource from "../models/resource/index.js";
import { formatBytes } from "./../helpers/utils.js";

export const resourceTypeInlineKeyboard = Markup.inlineKeyboard([
  Markup.button.callback("Books", "Books"),
  Markup.button.callback("Videos", "Videos"),
  Markup.button.callback("Links", "Links"),
]);

export const bookTypeInlineKeyboard = Markup.inlineKeyboard([
  Markup.button.callback("Text Books", "book"),
  Markup.button.callback("Lecture slides", "lectureSlide"),
]);

export function createResourcePaginationKeyboard(
  totalPages,
  currentPage,
  resourceType
) {
  const keyboard = [];

  if (currentPage > 1) {
    keyboard.push([
      Markup.button.callback(
        "Previous",
        `res_prev_${resourceType}_${currentPage}`
      ),
    ]);
  }

  if (currentPage < totalPages) {
    keyboard[0] = keyboard[0] || [];
    keyboard[0].push(
      Markup.button.callback("Next", `res_next_${resourceType}_${currentPage}`)
    );
  }

  return Markup.inlineKeyboard(keyboard, { columns: 2 });
}

export async function getResources(query) {
  const { page = 1, tag } = query;

  const filters = {
    limit: process.env.LIMIT || 10,
    page,
    tag,
  };

  try {
    const resources = await Resource.getResources(filters);
    return resources;
  } catch (error) {}
}

export async function sendResourceList(ctx, resourceType, currentPage) {
  const chatId = ctx.chat.id;

  const { totalPages, resources } = await getResources({
    limit: 10,
    page: currentPage,
    tag: `#${resourceType}`,
  });

  console.log(resources);

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

  return msg;
}
