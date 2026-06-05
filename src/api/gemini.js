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
You are a literary analyst.

Given a book title, description, and subject tags, estimate the following narrative parameters.

All numeric values must be floats between 0.0 and 1.0.
type must be  "literary" || "historical" || "crime" || "experimental" || "genre" (default)

JSON schema:

{
  "openness": 0.0,
  "complexity": 0.0,
  "darkness": 0.0,
  "extensiveness": 0.0,
  "type": "",
}
`.trim();

/**
 * Extract narrative parameters for a book.
 * @param {{ title: string, description: string, subjects: string[] }} book
 * @returns {Promise<BookParams>}
 */
export async function extractBookParams(book) {
  const userPrompt = `
Title: ${book.title}

Description:
${book.description || "(none)"}

Subjects:
${book.subjects?.join(", ") || "(none)"}

Places:
${book.subject_places?.join(", ") || "(none)"}

Time Periods:
${book.subject_times?.join(", ") || "(none)"}

Page Count:
${book.number_of_pages ?? "(unknown)"}

First Published:
${book.first_publish_date ?? "(unknown)"}
`

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
          temperature: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();

  const raw =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  let params;

  try {
    params = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse Gemini response:", raw);
    throw err;
  }

  const numericKeys = [
    "openness",
    "complexity",
    "darkness",
    "extensiveness"
  ];

  for (const key of numericKeys) {
    params[key] = Math.min(
      1,
      Math.max(0, Number(params[key]) || 0),
    );
  }



  return params;
}