import Resource from "./index.js";

export async function getResources(filter) {
  const { limit, page, tag } = filter;

  try {
    const resources = await Resource.aggregate([
      {
        $match: {
          type: "file",
          tags: tag,
        },
      },
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
          resources: [
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
          resources: { $ifNull: ["$resources", []] },
        },
      },
    ]);

    return resources[0];
  } catch (error) {
    console.error("Failed to fetch resources, " + error);
  }
}
