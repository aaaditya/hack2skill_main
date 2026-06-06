import { parseWellnessInsight, extractTextFromGeminiResponse } from "@/lib/gemini";

describe("parseWellnessInsight", () => {
  it("parses a valid JSON response", () => {
    const raw = JSON.stringify({
      summary: "You have been feeling moderate stress.",
      suggestions: ["Try mindfulness breathing", "Get 8 hours of sleep"],
      triggers: ["Academic deadlines"],
      positives: ["Consistent journaling"],
    });

    const result = parseWellnessInsight(raw);
    expect(result.summary).toBe("You have been feeling moderate stress.");
    expect(result.suggestions).toHaveLength(2);
    expect(result.triggers).toHaveLength(1);
    expect(result.positives).toHaveLength(1);
  });

  it("parses JSON embedded in prose text", () => {
    const raw = `Here is your insight:
    {
      "summary": "Good progress this week.",
      "suggestions": ["Walk daily"],
      "triggers": [],
      "positives": ["Mood improving"]
    }
    Hope this helps!`;

    const result = parseWellnessInsight(raw);
    expect(result.summary).toBe("Good progress this week.");
    expect(result.suggestions).toContain("Walk daily");
  });

  it("throws when no JSON is present", () => {
    expect(() => parseWellnessInsight("No JSON here at all.")).toThrow(
      "No JSON found in AI response"
    );
  });

  it("throws when JSON does not match expected shape", () => {
    const raw = JSON.stringify({ unexpected: "field" });
    expect(() => parseWellnessInsight(raw)).toThrow(
      "AI response does not match expected shape"
    );
  });

  it("sanitizes HTML tags from response strings", () => {
    const raw = JSON.stringify({
      summary: "<script>alert('xss')</script>Clean summary",
      suggestions: ["<b>Bold tip</b>"],
      triggers: [],
      positives: [],
    });

    const result = parseWellnessInsight(raw);
    expect(result.summary).not.toContain("<script>");
    expect(result.suggestions[0]).not.toContain("<b>");
  });

  it("removes angle bracket characters", () => {
    const raw = JSON.stringify({
      summary: "Value > 5 and < 10 is normal",
      suggestions: [],
      triggers: [],
      positives: [],
    });

    const result = parseWellnessInsight(raw);
    expect(result.summary).not.toContain("<");
    expect(result.summary).not.toContain(">");
  });

  it("caps suggestions array at 5 items", () => {
    const raw = JSON.stringify({
      summary: "Summary",
      suggestions: Array.from({ length: 10 }, (_, i) => `Suggestion ${i}`),
      triggers: [],
      positives: [],
    });

    const result = parseWellnessInsight(raw);
    expect(result.suggestions.length).toBeLessThanOrEqual(5);
  });

  it("handles empty arrays gracefully", () => {
    const raw = JSON.stringify({
      summary: "You are doing well.",
      suggestions: [],
      triggers: [],
      positives: [],
    });

    const result = parseWellnessInsight(raw);
    expect(result.suggestions).toHaveLength(0);
    expect(result.triggers).toHaveLength(0);
    expect(result.positives).toHaveLength(0);
  });
});

describe("extractTextFromGeminiResponse", () => {
  it("extracts text from a valid response", () => {
    const response = {
      candidates: [
        {
          content: {
            parts: [{ text: "Hello, how can I help you?" }],
          },
        },
      ],
    };

    expect(extractTextFromGeminiResponse(response)).toBe(
      "Hello, how can I help you?"
    );
  });

  it("throws when no candidates are present", () => {
    const response = { candidates: [] };
    expect(() => extractTextFromGeminiResponse(response)).toThrow(
      "No candidate in Gemini response"
    );
  });

  it("throws when parts array is empty", () => {
    const response = {
      candidates: [{ content: { parts: [] } }],
    };
    expect(() => extractTextFromGeminiResponse(response)).toThrow(
      "No parts in Gemini response"
    );
  });
});
