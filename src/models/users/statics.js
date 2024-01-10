import { LeetCode } from "leetcode-query";
import User from "./index.js";

export async function getUserInfo(userId) {
  try {
    const user = await User.findOne({
      user_id: userId,
    });

    if (!user) {
      return `You haven't set your leetcode username yet. \n\nUse /set_username to configure your leetcode username`;
    }

    const leetcode = new LeetCode();

    const leetcodeInfo = await leetcode.user(user.leetcode_username);

    if (!leetcodeInfo.matchedUser) {
      return "The username you set is incorrect. No user with that username found \n use /set_username to update it";
    }

    const userInfo = `
<b>Username:</b> <i>${leetcodeInfo.matchedUser.username}</i>

🟩 <b>Easy</b> = <i>${leetcodeInfo.matchedUser.submitStats.acSubmissionNum[1].count}/${leetcodeInfo.allQuestionsCount[1].count}</i>

🟨 <b>Medium</b> = <i>${leetcodeInfo.matchedUser.submitStats.acSubmissionNum[2].count}/${leetcodeInfo.allQuestionsCount[2].count}</i>

🟥 <b>Hard</b> = <i>${leetcodeInfo.matchedUser.submitStats.acSubmissionNum[3].count}/${leetcodeInfo.allQuestionsCount[3].count}</i>

✅ <b>Total</b> = <i>${leetcodeInfo.matchedUser.submitStats.acSubmissionNum[0].count}/${leetcodeInfo.allQuestionsCount[0].count}</i>
    `;

    return userInfo;
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Error fetching data from LeetCode");
  }
}
