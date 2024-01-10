import Quiz from "./index.js";

export async function getQuizzes(filter) {
  const { limit, page } = filter;

  try {
    const quizzes = await Quiz.aggregate([
      {
        $facet: {
          paginationInfo: [
            {
              $count: "totalDocuments",
            },
            {
              $addFields: {
                totalDocuments: "$totalDocuments",
                totalPages: {
                  $ceil: {
                    $divide: ["$totalDocuments", +limit],
                  },
                },
              },
            },
            {
              $project: {
                totalDocuments: 1,
                totalPages: 1,
              },
            },
          ],
          quizzes: [
            {
              $skip: (+page - 1) * +limit,
            },
            {
              $limit: +limit,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$paginationInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          totalDocuments: { $ifNull: ["$paginationInfo.totalDocuments", 0] },
          totalPages: { $ifNull: ["$paginationInfo.totalPages", 0] },
          quizzes: { $ifNull: ["$quizzes", []] },
        },
      },
    ]);

    return quizzes[0];
  } catch (error) {
    console.error("Failed to fetch quizzes, " + error);
  }
}
