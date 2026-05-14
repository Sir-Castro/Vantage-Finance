import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "placeholder",
});

interface CoinData {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
}

interface MarketData {
  coins: CoinData[];
  globalData: {
    totalMarketCap: number;
    btcDominance: number;
    marketCapChange24h: number;
  } | null;
}

router.post("/market-summary", async (req, res) => {
  try {
    const { marketData } = req.body as { marketData: MarketData };

    if (!marketData?.coins?.length) {
      res.status(400).json({ error: "No market data provided" });
      return;
    }

    const coinsSummary = marketData.coins
      .slice(0, 10)
      .map(
        (c) =>
          `${c.name} (${c.symbol}): $${c.price.toFixed(2)}, 24h: ${c.change24h >= 0 ? "+" : ""}${c.change24h.toFixed(2)}%`
      )
      .join("\n");

    const globalSummary = marketData.globalData
      ? `Total Market Cap: $${(marketData.globalData.totalMarketCap / 1e9).toFixed(0)}B, BTC Dominance: ${marketData.globalData.btcDominance.toFixed(1)}%, 24h Market Change: ${marketData.globalData.marketCapChange24h.toFixed(2)}%`
      : "";

    const prompt = `You are a professional market analyst for Vantage Finance. Analyze the following real-time market data and provide a concise, insightful market summary.

Market Data:
${coinsSummary}

${globalSummary ? `Global Overview:\n${globalSummary}` : ""}

Respond ONLY with a JSON object (no markdown) in this exact format:
{
  "text": "2-3 sentence market summary",
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0-100,
  "keyPoints": ["point 1", "point 2", "point 3"]
}

Be specific, data-driven, and actionable. Focus on the most significant trends.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    let parsed: { text: string; sentiment: string; confidence: number; keyPoints: string[] };

    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        text: content,
        sentiment: "neutral",
        confidence: 70,
        keyPoints: [],
      };
    }

    res.json({
      text: parsed.text ?? "",
      sentiment: parsed.sentiment ?? "neutral",
      confidence: parsed.confidence ?? 70,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      generatedAt: Date.now(),
    });
  } catch (err) {
    req.log.error({ err }, "AI market summary failed");
    res.status(500).json({ error: "Failed to generate AI summary" });
  }
});

export default router;
