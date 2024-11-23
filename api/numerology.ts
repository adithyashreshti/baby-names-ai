import { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name } = req.body;

        const prompt = `Provide a detailed numerological analysis for the name "${name}" including:

        1. Calculate the numerological number (1-9) based on traditional numerology
        2. Provide the spiritual and metaphysical meaning of this number
        3. List key personality characteristics associated with this number
        4. Explain the life path and destiny implications
        5. Include references to traditional numerology texts, experts, or systems

        Format the response exactly as this JSON structure:
        {
            "number": <calculated number 1-9>,
            "meaning": "<detailed spiritual/metaphysical meaning>",
            "characteristics": "<key personality traits and attributes>",
            "lifePath": "<life path and destiny implications>",
            "references": [
                {
                    "source": "<name of text or expert>",
                    "link": "<URL to learn more>",
                    "description": "<brief description of the source>"
                }
            ]
        }

        Ensure the analysis is based on established numerological principles and includes verifiable sources.`;

        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ 
                role: "user", 
                content: prompt 
            }],
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.data.choices[0].message?.content;
        
        if (!response) {
            throw new Error('No response from OpenAI');
        }

        const numerologyInfo = JSON.parse(response);

        // Validate the response structure
        if (!numerologyInfo.number || 
            !numerologyInfo.meaning || 
            !numerologyInfo.characteristics || 
            !numerologyInfo.lifePath || 
            !Array.isArray(numerologyInfo.references)) {
            throw new Error('Invalid response structure from OpenAI');
        }

        return res.status(200).json(numerologyInfo);

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to generate numerology information',
            details: error.message 
        });
    }
}
