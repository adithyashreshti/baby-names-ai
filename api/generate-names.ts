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
            nameExpectations,
            requestId,
            timestamp,
            randomSeed,
            forceVariety,
            excludePrevious
        } = req.body;
        
        console.log('Received request:', { 
            gender, 
            origin, 
            likedNames, 
            dislikedNames, 
            nameExpectations,
            requestId,
            timestamp,
            randomSeed,
            forceVariety,
            excludePrevious
        });

        // Generate a unique seed for this request to ensure variety
        const requestSeed = randomSeed || Math.floor(Math.random() * 10000);
        const varietyPrompt = forceVariety === 'true' ? 
            `\n\nIMPORTANT FOR VARIETY: Generate completely different and unique names. 
            This is request #${requestId} at ${timestamp}. 
            Be creative and surprise with unexpected but fitting choices.
            Mix different popularity levels (some popular, some rare, some trending).
            Vary the styles (traditional, modern, classic, trendy, elegant).
            Ensure maximum diversity and avoid any repetitive patterns.` : '';

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Generate 5 completely unique and diverse baby names based on these criteria:
                    Gender: ${gender}
                    Origin: ${origin}
                    Names they like: ${likedNames}
                    Names to avoid: ${dislikedNames}
                    Additional characteristics: ${nameExpectations}
                    ${varietyPrompt}
                    
                    Consider:
                    1. Generate names similar in style to the liked names
                    2. Avoid names similar to the disliked names
                    3. Match the specified characteristics
                    4. Ensure names fit the cultural origin
                    5. Prioritize variety and uniqueness over predictability
                    6. Mix different popularity levels and styles for diversity
                    
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
                    5. Generate fresh, diverse names that are completely different from any previous suggestions
                    
                    Return as a JSON array.`
            }],
            temperature: 0.95,
            max_tokens: 2500
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
