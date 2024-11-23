// api/generate-names.ts
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
        console.log('Received request:', req.body); // Add logging
        const { gender, origin, nameExpectations } = req.body;

        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key not found');
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ 
                    role: "user", 
                    content: `Generate 5 unique baby names based on these criteria:
                        Gender: ${gender}
                        Origin: ${origin}
                        Characteristics desired: ${nameExpectations}
                        
                        For each name, provide:
                        1. Etymology and meaning
                        2. Historical significance
                        3. Cultural context
                        4. Name variants
                        5. Notable people with this name (with brief descriptions)
                        6. Current popularity status
                        
                        Format the response as a JSON array.`
                }],
                temperature: 0.7,
                max_tokens: 2000
            });

            console.log('OpenAI response:', completion.choices[0].message?.content);
            const response = completion.choices[0].message?.content;
            const parsedResponse = JSON.parse(response || '{"names": []}');

            return res.status(200).json(parsedResponse);
        } catch (openaiError) {
            console.error('OpenAI API error:', openaiError);
            return res.status(500).json({ 
                error: 'OpenAI API error',
                details: openaiError.message 
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Server error',
            details: error.message 
        });
    }
}
