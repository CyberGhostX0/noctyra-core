const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/health", (req, res) => {
  res.json({ status: "Echo is alive (OpenRouter)" });
});

app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body.message || "";

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        reply: "Missing OpenRouter API key",
      });
    }

    const response = await client.chat.completions.create({
      model: "openchat/openchat-7b".
      messages: [
        {
          role: "system",
          content: "You are Echo, a helpful personal AI assistant.",
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    res.json({
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("ERROR:", error);

    res.json({
      reply: "Echo error: " + error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("Echo server running");
});
