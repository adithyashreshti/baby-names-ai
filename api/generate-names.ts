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
        const { 
            gender, 
            origin, 
            likedNames,
            dislikedNames,
            nameExpectations 
        } = req.body;
        
        console.log('Received request:', { 
            gender, 
            origin, 
            likedNames, 
            dislikedNames, 
            nameExpectations 
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Generate 5 unique baby names based on these criteria:
                    Gender: ${gender}
                    Origin: ${origin}
                    Names they like: ${likedNames}
                    Names to avoid: ${dislikedNames}
                    Additional characteristics: ${nameExpectations}
                    
                    Consider:
                    1. Generate names similar in style to the liked names
                    2. Avoid names similar to the disliked names
                    3. Match the specified characteristics
                    4. Ensure names fit the cultural origin
                    
                    For each name, provide these exact fields:
                    - name (string)
                    - gender (string, either "boy" or "girl")
                    - origin (string, either "indian" or "western")
                    - details object containing:
                        - popularity (string, describe current popularity)
                        - style (string, describe name style)
                        - etymology (string, provide detailed meaning and linguistic origin)
                        - historicalSignificance (string, provide detailed cultural or historical context)
                        - variants (array of strings, include at least 2-3 variations or spellings)
                        - famousPeople (array of objects with name and description)
                            Example format:
                            "famousPeople": [
                                {
                                    "name": "Full Name",
                                    "description": "Detailed description of their achievements and significance"
                                },
                                {
                                    "name": "Another Person",
                                    "description": "Their notable contributions and importance"
                                }
                            ]
                    
                    Important:
                    1. Provide detailed historical significance, not just "N/A"
                    2. Include at least 2 famous people for each name when available
                    3. List multiple name variants when they exist
                    4. Ensure all information is culturally accurate
                    
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
