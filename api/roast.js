// This is your new, secure backend file.
// It uses Node.js 'fetch', which might be slightly different from browser 'fetch'.

export default async function handler(request, response) {
    // 1. Get the chat history from the front-end's request
    const { history } = await request.json();

    // 2. Get your secret API key from Vercel's Environment Variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    // 3. Define the Roasting Prompt (this is now secure)
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

        if (!geminiResponse.ok) {
            console.error("Gemini API Error:", data);
            throw new Error(data.error.message);
        }

        // 6. Send the AI's text back to your front-end
        const aiText = data.candidates[0].content.parts[0].text;
        response.status(200).json({ text: aiText });

    } catch (error) {
        console.error("Internal Server Error:", error);
        // Send a safe error message back to the front-end
        response.status(500).json({ error: "The Overlord is not pleased with your request." });
    }
}