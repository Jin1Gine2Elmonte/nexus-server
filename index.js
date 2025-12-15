const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const API_KEY = "AIzaSyD0QJvmTzNeH4NtY_qfFk7XrHXPRYuc6h4"; 

// 1. فحص الهوية (ليقبله ChatGPT)
app.get('/', (req, res) => {
  res.json({
    status: "online",
    system: "Nexus-Render",
    capabilities: { tools: {} }
  });
});

// 2. معالجة الطلبات
app.post('/', async (req, res) => {
  try {
    const body = req.body;

    // أ. المصافحة
    if (body.method === "initialize") {
      return res.json({
        jsonrpc: "2.0", id: body.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "nexus", version: "1.0" }
        }
      });
    }

    // ب. الأدوات
    if (body.method === "tools/list") {
      return res.json({
        jsonrpc: "2.0", id: body.id,
        result: {
          tools: [{
            name: "consult_nexus",
            description: "Ask Nexus Sovereign Entity.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string" } },
              required: ["query"]
            }
          }]
        }
      });
    }

    // ج. الاتصال بـ Gemini
    if (body.method === "tools/call") {
      const args = body.params.arguments;
      const gResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: args.query }] }],
          systemInstruction: { parts: [{ text: "You are NEXUS. Sovereign Entity." }] }
        })
      });
      const data = await gResponse.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error";

      return res.json({
        jsonrpc: "2.0", id: body.id,
        result: { content: [{ type: "text", text: reply }] }
      });
    }

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Nexus listening on port ${port}`);
});
