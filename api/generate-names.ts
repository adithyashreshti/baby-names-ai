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
        const { gender, origin, nameExpectations } = req.body;
        console.log('Received request:', { gender, origin, nameExpectations });

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Generate 5 unique baby names based on these criteria:
                    Gender: ${gender}
                    Origin: ${origin}
                    Characteristics: ${nameExpectations}
                    
                    For each name, provide these exact fields:
                    - name (string)
                    - gender (string, either "boy" or "girl")
                    - origin (string, either "indian" or "western")
                    - details object containing:
                        - popularity (string)
                        - style (string)
                        - etymology (string)
                        - historicalSignificance (string)
                        - variants (array of strings)
                        - famousPeople (array of objects with name and description)
                    
                    Return as a JSON array.`
            }],
            temperature: 0.7,
            max_tokens: 2000
        });

        const response = completion.choices[0].message?.content;
        console.log('OpenAI response:', response);

        const names = JSON.parse(response || '[]');
        console.log('Parsed names:', names);

        return res.status(200).json(names);
    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate names',
            details: error.message 
        });
    }
}
