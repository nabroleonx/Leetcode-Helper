export async function withRetries(fn, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt}:`, error.message);
      if (attempt === maxRetries) {
        throw new Error("Max retries exceeded");
      }
    }
  }
}
