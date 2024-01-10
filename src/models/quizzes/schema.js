import mongoose from "mongoose";

const choiceSchema = new mongoose.Schema({
  choice: String,
});

const questionSchema = new mongoose.Schema({
  questionPrompt: String,
  choices: [choiceSchema],
  answerIndex: Number,
  explanation: String,
});

const quizSchema = new mongoose.Schema({
  id: String,
  name: String,
  video: String,
  free: Boolean,
  pattern: String,
  difficulty: String,
  leetcodePrompt: String,
  questions: [questionSchema],
  similarQuestions: [String],
  totalRatings: {
    dislikes: Number,
    likes: Number,
  },
  totalSubmissions: Number,
});

export default quizSchema;
