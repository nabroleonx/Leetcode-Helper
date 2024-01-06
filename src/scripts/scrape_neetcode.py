import requests
import youtube_dl
import re
import pandas as pd
import json


def create_id_object_mapping():
    print("Scraping questions list ... ", end="")
    data = {
        "query": """query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
                problemsetQuestionList: questionList(
                    categorySlug: $categorySlug
                    limit: $limit
                    skip: $skip
                    filters: $filters
                ) {
                    total: totalNum
                    questions: data {
                        acceptanceRate: acRate
                        difficulty
                        QID: questionFrontendId
                        paidOnly: isPaidOnly
                        title
                        titleSlug
                        topicTags {
                            slug
                        }
                    }
                }
            }
        """,
        "variables": {
            "categorySlug": "",
            "skip": 0,
            "limit": 10000,
            "filters": {},
        },
    }

    r = requests.post("https://leetcode.com/graphql", json=data).json()
    questions = pd.json_normalize(r["data"]["problemsetQuestionList"]["questions"])[
        [
            "QID",
            "title",
            "titleSlug",
            "difficulty",
            "acceptanceRate",
            "paidOnly",
            "topicTags",
        ]
    ]
    questions["topicTags"] = questions["topicTags"].apply(
        lambda w: [tag["slug"] for tag in w]
    )
    print("Done")

    id_object_mapping = {}
    for index, row in questions.iterrows():
        id_object_mapping[row["QID"]] = row.to_dict()

    return id_object_mapping


def scrape_neetcode_videos(playlist_url):
    pattern = re.compile(r".*Leetcode\s+(\d+).*", re.IGNORECASE)

    options = {
        "extract_flat": True,
        "quiet": True,
    }

    with youtube_dl.YoutubeDL(options) as ydl:
        playlist_dict = ydl.extract_info(playlist_url, download=False)
        neetcode_videos = []

        for video in playlist_dict["entries"]:
            title = video["title"]
            match = pattern.match(title)
            if match:
                leetcode_number = match.group(1)
                video_link = video["url"]
                neetcode_videos.append(
                    {"leetcode_number": leetcode_number, "video_link": video_link}
                )

        return neetcode_videos


playlist_url = (
    "https://www.youtube.com/playlist?list=PLot-Xpze53leF0FeHz2X0aG3zd0mr1AW_"
)

questions = create_id_object_mapping()
final_data = []

neetcode_videos = scrape_neetcode_videos(playlist_url)
if neetcode_videos:
    for video in neetcode_videos:
        leetcode_number = video["leetcode_number"]
        if leetcode_number in questions:
            question_details = questions[leetcode_number]
            json_data = {
                "question_id": question_details["QID"],
                "question_title": question_details["title"],
                "question_slug": question_details["titleSlug"],
                "question_difficulty": question_details["difficulty"],
                "video_link": video["video_link"],
            }
            final_data.append(json_data)
        else:
            print(f"No details found for Leetcode Number: {leetcode_number}")
else:
    print("No LeetCode videos found in the playlist.")

if final_data:
    with open("neetcode_playlist.json", "w") as file:
        json.dump(final_data, file, indent=4)
    print("Data written to neetcode_playlist.json file.")
else:
    print("No data to write to file.")
