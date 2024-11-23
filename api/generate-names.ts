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
        console.log('Request received:', req.body);
        const { gender, origin, nameExpectations } = req.body;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",  // Changed from gpt-4 to be faster
            messages: [{ 
                role: "user", 
                content: `Generate 3 unique baby names based on:
                    Gender: ${gender}
                    Origin: ${origin}
                    Characteristics: ${nameExpectations}
                    
                    Format as JSON array with:
                    {
                        "name": string,
                        "gender": "${gender}",
                        "origin": "${origin}",
                        "details": {
                            "popularity": string,
                            "style": string,
                            "etymology": string,
                            "historicalSignificance": string,
                            "variants": string[],
                            "famousPeople": [{"name": string, "description": string}]
                        }
                    }`
            }],
            temperature: 0.7,
            max_tokens: 1000,  // Reduced tokens
            timeout: 30000  // 30 second timeout
        });

        const response = completion.choices[0].message?.content;
        console.log('OpenAI response:', response);
        
        const parsedResponse = JSON.parse(response || '[]');
        return res.status(200).json(parsedResponse);
    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate names',
            details: error.message 
        });
    }
}
