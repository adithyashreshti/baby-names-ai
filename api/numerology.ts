import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name } = req.body;
        console.log('Analyzing numerology for name:', name);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Provide a detailed numerological analysis for the name "${name}".
                    Include:
                    1. Calculate the numerological number (1-9)
                    2. The spiritual and metaphysical meaning
                    3. Key personality characteristics
                    4. Life path implications
                    5. References to traditional numerology sources
                    
                    Format exactly as this JSON structure:
                    {
                        "number": <number 1-9>,
                        "meaning": "<detailed meaning>",
                        "characteristics": "<key traits>",
                        "lifePath": "<life path description>",
                        "references": [
                            {
                                "source": "<source name>",
                                "link": "<reference URL>",
                                "description": "<brief description>"
                            }
                        ]
                    }`
            }],
            temperature: 0.7
        });

        const response = completion.choices[0].message?.content;
        const numerologyInfo = JSON.parse(response || '{}');

        return res.status(200).json(numerologyInfo);
    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate numerology information',
            details: error.message 
        });
    }
}
