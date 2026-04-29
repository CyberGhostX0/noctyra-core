const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "Echo AI server is alive",
    brain: "online",
    time: new Date()
  });
});

app.post("/echo", async (req, res) => {
  try {
    const userInput = req.body.message || "";

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are Echo, a private personal AI assistant. Be helpful, direct, loyal, and practical."
        },
        {
          role: "user",
          content: userInput
        }
      ]
    });

    const replyText =
      response.output?.[0]?.content?.[0]?.text || "No response from AI";

    res.json({
      reply: replyText
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Echo brain error",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Echo AI running on port ${PORT}`);
});
