const express = require("express");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const MEMORY_FILE = path.join(__dirname, "echo_memory.json");

function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    }
  } catch (error) {
    console.error("Memory load error:", error);
  }
  return [];
}

function saveMemory(memory) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (error) {
    console.error("Memory save error:", error);
  }
}

let echoMemory = loadMemory();

function alreadyRemembered(text) {
  return echoMemory.some(
    item => item.text.toLowerCase() === text.toLowerCase()
  );
}

function autoLearnMemory(userInput) {
  const lower = userInput.toLowerCase();

  const memoryTriggers = [
    "my name is",
    "i am",
    "i'm",
    "my company is",
    "my business is",
    "i want",
    "my goal is",
    "my goals are",
    "i like",
    "i dislike",
    "i prefer",
    "from now on",
    "going forward",
    "echo should",
    "echo needs to"
  ];

  const shouldSave = memoryTriggers.some(trigger => lower.includes(trigger));

  if (shouldSave && userInput.length > 5 && userInput.length < 300) {
    if (!alreadyRemembered(userInput)) {
      echoMemory.push({
        text: userInput,
        type: "auto",
        createdAt: new Date().toISOString(),
      });

      saveMemory(echoMemory);
      return true;
    }
  }

  return false;
}

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
    model: "openrouter/free",
    memoryItems: echoMemory.length,
    autoMemory: true,
    time: new Date(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "Echo is alive",
    provider: "OpenRouter",
    model: "openrouter/free",
    memoryItems: echoMemory.length,
    autoMemory: true,
    time: new Date(),
  });
});

app.get("/memory", (req, res) => {
  res.json({
    memory: echoMemory,
  });
});

app.post("/clear-memory", (req, res) => {
  echoMemory = [];
  saveMemory(echoMemory);

  res.json({
    reply: "Echo memory cleared.",
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

    const lowerInput = userInput.toLowerCase();

    if (
      lowerInput.startsWith("remember ") ||
      lowerInput.startsWith("remember that ")
    ) {
      const memoryText = userInput
        .replace(/^remember that /i, "")
        .replace(/^remember /i, "")
        .trim();

      if (memoryText.length > 0 && !alreadyRemembered(memoryText)) {
        echoMemory.push({
          text: memoryText,
          type: "manual",
          createdAt: new Date().toISOString(),
        });

        saveMemory(echoMemory);
      }

      return res.json({
        reply: `I’ll remember that: ${memoryText}`,
      });
    }

    const learned = autoLearnMemory(userInput);

    const memoryContext =
      echoMemory.length > 0
        ? "Here are saved memories about the user:\n" +
          echoMemory.map((item, index) => `${index + 1}. ${item.text}`).join("\n")
        : "You do not have saved memory yet.";

    const response = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content:
            "You are Echo, a private personal AI assistant. Be helpful, calm, direct, practical, and loyal to the user's goals. Use saved memories naturally when helpful.\n\n" +
            memoryContext,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "Echo got an empty response.";

    res.json({
      reply: learned ? reply + "\n\nMemory updated." : reply,
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
