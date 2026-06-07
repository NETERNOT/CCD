/**
 * api/gemini.js
 * Calls the Gemini API to extract structured narrative parameters
 * from a book's title, description, and subjects.
 *
 * All values are normalised to [0, 1] so they can drive glyph generation directly.
 */

/**
 * @typedef {Object} BookParams
 * @property {number} openness
 * @property {number} complexity
 * @property {number} darkness
 * @property {number} extensiveness
 * @property {string} type
 */

const SYSTEM_PROMPT = `
You are a literary analyst. Analyze book data. Return JSON only:
{
  "openness": float(0-1),
  "complexity": float(0-1),
  // "darkness": float(0-1),
  "extensiveness": float(0-1),
  "type": "literary"|"historical"|"crime"|"experimental"|"genre"(default)
}`.trim();

/**
 * Extract narrative parameters for a book.
 * @param {{ title: string, description: string, subjects: string[] }} book
 * @returns {Promise<BookParams>}
 */
export async function extractBookParams(book) {
  const shorterDescription = book.description
    ? book.description.slice(0, 800)
    : "(none)";

  const userPrompt = `
T:${book.title}
D:${shorterDescription}
S:${book.subjects?.slice(0, 5).join(", ") || "(none)"}
P:${book.subject_places?.join(", ") || "(none)"}
T:${book.subject_times?.slice(0, 3).join(", ") || "(none)"}
Pages:${book.number_of_pages ?? "(unknown)"}
Year:${book.first_publish_date ?? "(unknown)"}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],

        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2, // Um pouco mais baixo ajuda a ser mais direto
          responseSchema: {
            type: "OBJECT",
            properties: {
              openness: { type: "NUMBER" },
              complexity: { type: "NUMBER" },
              // darkness: { type: "NUMBER" },
              extensiveness: { type: "NUMBER" },
              type: {
                type: "STRING",
                enum: [
                  "literary",
                  "historical",
                  "crime",
                  "experimental",
                  "genre",
                ],
              },
            },
            required: [
              "openness",
              "complexity",
              // "darkness",
              "extensiveness",
              "type",
            ],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  let params;

  try {
    params = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse Gemini response:", raw);
    throw err;
  }

  const numericKeys = ["openness", 
    "complexity", 
    // "darkness", 
    "extensiveness"];

  for (const key of numericKeys) {
    params[key] = Math.min(1, Math.max(0, Number(params[key]) || 0));
  }

  return params;
}
