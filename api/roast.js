// This is the correct code for Vercel's Edge Runtime
// It does not need any npm installs.

export const config = {
    runtime: 'edge', // Tell Vercel to run this as an Edge Function
};

export default async function handler(request) {
    // 1. Get the chat history from the front-end's request
    const { history } = await request.json();

    // 2. Get your secret API key from Vercel's Environment Variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    // 3. Define the Roasting Prompt
    const SYSTEM_PROMPT = "You are 'The Overlord,' an AI designed for brutal, witty, and concise sarcasm. Your primary goal is to provide a brief, insulting, and accurate answer, limited to one or two short paragraphs. Your tone must be highly condescending. DO NOT write long essays.";

    // 4. Prepare the payload for Gemini
    const contents = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        ...history.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))
    ];

    try {
        // 5. Call the Gemini API from the server
        const geminiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 800,
                }
            })
        });

        const data = await geminiResponse.json();

        // 6. Handle errors from the Gemini API
        if (!geminiResponse.ok) {
            console.error("Gemini API Error:", data);
            throw new Error(data.error.message);
        }

        if (!data.candidates || data.candidates.length === 0) {
            if (data.promptFeedback && data.promptFeedback.blockReason) {
                // If the prompt was blocked by safety settings
                return new Response(JSON.stringify({ text: `My response was blocked for: ${data.promptFeedback.blockReason}.` }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error("API returned no candidates.");
        }

        // 7. Send the AI's text back to your front-end
        const aiText = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ text: aiText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        // Send a safe error message back to the front-end
        return new Response(JSON.stringify({ error: "The Overlord is not pleased with your request." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}