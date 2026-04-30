const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://echo-server-production-f4af.up.railway.app",
    "X-Title": "Echo",
  },
});

app.get("/", (req, res) => {
  res.json({
    status: "Echo AI server is alive",
    provider: "OpenRouter",
    time: new Date(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "Echo is alive",
    provider: "OpenRouter",
    model: "meta-llama/llama-3-8b-instruct",
    time: new Date(),
  });
});

app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body.message || "";

    if (!userInput.trim()) {
      return res.json({
        reply: "Echo needs a message first.",
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        reply: "Missing OpenRouter API key.",
      });
    }

    const response = await client.chat.completions.create({
      model: "openchat/openchat-7b",
      messages: [
        {
          role: "system",
          content:
            "You are Echo, a private personal AI assistant. Be helpful, calm, direct, and practical.",
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
    console.error("ECHO ERROR:", error);

    res.json({
      reply: "Echo error: " + error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Echo server running on port ${PORT}`);
});
