import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/ai/analyze", async (req, res) => {
  const { question, wallet } = req.body ?? {};

  if (typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "A wallet question is required." });
    return;
  }

  if (!wallet || typeof wallet !== "object") {
    res.status(400).json({ error: "Structured wallet data is required." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error:
        "The wallet assistant is not configured on the server. Add OPENAI_API_KEY to the server environment.",
    });
    return;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You are a Solana wallet copilot. Answer only from the structured wallet data supplied by the user. Never invent balances, transactions, protocols, dates, prices, or causes. If the data cannot determine an answer, say so clearly. Keep responses concise and explain amounts in plain language.",
        },
        {
          role: "user",
          content: JSON.stringify({ question: question.trim(), wallet }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    req.log.error({ status: response.status, details }, "AI provider request failed");
    res.status(502).json({ error: "The wallet assistant could not answer right now." });
    return;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    res.status(502).json({ error: "The wallet assistant returned no answer." });
    return;
  }

  res.json({ answer });
});

export default router;