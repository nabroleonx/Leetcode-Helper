# Leetcode Helper

Leetcode Helper is a Telegram bot tailored to assist students on their LeetCode journey, offering essential tools for efficient practice, progress tracking, and access to resources. The bot provides functionalities to fetch daily challenges, retrieve problem topics, track user progress, and access Data Structures and Algorithms (DSA) resources.

## Features

Consistency in coding practice is essential for mastering algorithms and data structures. Leetcode Helper Bot aims to inspire and assist you by providing:

- **Daily Challenges:** Encourages regular coding practice for skill enhancement.
- **Progress Tracking:** Visualize your coding journey for continuous improvement.
- **Random Questions:** Keeps learning engaging by offering diverse problem sets.
- **Resource Access:** Enhances understanding with curated learning resources.

## Getting Started

### Prerequisites

- MongoDB
- Node.js

### Installation

1. #### Clone the Repository:

   ```console
   git clone https://github.com/nabroleonx/Leetcode-Helper.git
   cd Leetcode-Helper
   ```

2. #### Environment Configuration:

   - Copy the `.env.example` file to `.env`:

     ```console
     cp .env.example .env
     ```

   - Update the `.env` file with your credentials and configuration details required for the bot to function properly.

3. #### Install Dependencies:

   ```console
   npm install
   ```

## Running the Application

### Local Development:

Start the application in development mode:

```console
npm run dev
```

### Using Docker:

If you prefer using Docker for deployment, follow these steps:

1. Ensure Docker and Docker Compose are installed on your machine.

2. Start the application using Docker:

   ```console
   docker-compose up -d
   ```

The LeetCode Helper Bot should now be up and running, ready to assist you in your coding journey!

## Usage

Once the bot is running, open your Telegram app and open the bot you created. Start interacting with the bot by using the available commands to access daily challenges, track your progress, explore resources, and practice coding with ease.

### TODO
- [ ] Personalized question suggestions
- [ ] Contest notifications
- [ ] Submission tracking
- [ ] Complete invite functionality with rewards
- [ ] Refactoring
