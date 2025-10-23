// api/generate-names.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Input validation function
function validateInput(input: any): { isValid: boolean; error?: string } {
    // Check for inappropriate keywords
    const inappropriateKeywords = [
        'formula', 'equation', 'calculate', 'math', 'physics', 'chemistry', 'biology',
        'homework', 'assignment', 'test', 'exam', 'quiz', 'solve', 'problem',
        'code', 'programming', 'debug', 'function', 'algorithm', 'database',
        'hack', 'crack', 'bypass', 'exploit', 'virus', 'malware',
        'spam', 'scam', 'fraud', 'phishing', 'illegal', 'unlawful',
        'adult', 'explicit', 'nsfw', 'porn', 'sexual', 'inappropriate',
        'violence', 'weapon', 'gun', 'knife', 'bomb', 'threat',
        'drug', 'alcohol', 'smoke', 'cigarette', 'marijuana',
        'gambling', 'bet', 'casino', 'lottery', 'poker'
    ];
    
    const offTopicKeywords = [
        'speed of light', 'einstein', 'relativity', 'quantum', 'nuclear',
        'stock market', 'cryptocurrency', 'bitcoin', 'investment',
        'cooking recipe', 'restaurant', 'food', 'recipe',
        'travel', 'vacation', 'hotel', 'flight', 'booking',
        'weather', 'forecast', 'temperature', 'climate',
        'sports', 'football', 'basketball', 'soccer', 'game',
        'movie', 'film', 'actor', 'celebrity', 'entertainment',
        'news', 'politics', 'election', 'government', 'president'
    ];
    
    const validNameKeywords = [
        'name', 'baby', 'child', 'meaning', 'origin', 'culture',
        'traditional', 'modern', 'classic', 'unique', 'popular',
        'beautiful', 'strong', 'gentle', 'elegant', 'simple',
        'spiritual', 'religious', 'family', 'heritage', 'ancestry'
    ];
    
    const inputStr = input?.toString().toLowerCase() || '';
    
    // Check for inappropriate content
    for (const keyword of inappropriateKeywords) {
        if (inputStr.includes(keyword)) {
            return { isValid: false, error: `Please keep your preferences focused on baby names. Avoid discussing ${keyword}.` };
        }
    }
    
    // Check for off-topic content
    for (const keyword of offTopicKeywords) {
        if (inputStr.includes(keyword)) {
            return { isValid: false, error: `Please focus on baby name preferences. This field is for describing what you want in a name, not ${keyword}.` };
        }
    }
    
    // Check if input is relevant to baby names
    const hasValidKeywords = validNameKeywords.some(keyword => inputStr.includes(keyword));
    if (!hasValidKeywords && inputStr.length > 20) {
        return { isValid: false, error: 'Please describe what you\'re looking for in a baby name (e.g., meaning, style, personality traits)' };
    }
    
    // Check for excessive repetition (potential spam)
    const repeatedChars = inputStr.match(/(.)\1{3,}/g);
    if (repeatedChars && repeatedChars.length > 0) {
        return { isValid: false, error: 'Please avoid repeating characters. Describe your preferences naturally.' };
    }
    
    return { isValid: true };
}

// Simple AI intent validation
async function validateIntentWithAI(nameExpectations: string, likedNames: string, dislikedNames: string) {
    try {
        const validationPrompt = `Is this user input about baby name preferences or something else?

USER INPUT: "${nameExpectations}"
LIKED NAMES: "${likedNames}"  
DISLIKED NAMES: "${dislikedNames}"

Respond with JSON only:
{
  "isValid": true/false,
  "error": "Please focus on baby name preferences. Describe what you want in a name instead.",
  "suggestions": ["Try: 'Looking for a name that means strength and courage'", "Try: 'Want something modern and elegant'"]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: validationPrompt
            }],
            temperature: 0.1,
            max_tokens: 150
        });

        const response = completion.choices[0].message?.content;
        const validationResult = parseValidationResponse(response || '');
        
        return validationResult;
    } catch (error) {
        console.error('AI validation error:', error);
        // If AI fails, allow the request through
        return { isValid: true };
    }
}

function parseValidationResponse(response: string): any {
    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return {
            isValid: false,
            error: "Unable to parse validation response",
            suggestions: ["Please try rephrasing your input"]
        };
    } catch (error) {
        return {
            isValid: false,
            error: "Invalid validation response format",
            suggestions: ["Please try rephrasing your input"]
        };
    }
}

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

        // Use AI to validate intent directly
        const intentValidation = await validateIntentWithAI(nameExpectations, likedNames, dislikedNames);
        if (!intentValidation.isValid) {
            return res.status(400).json({ 
                error: intentValidation.error,
                suggestions: intentValidation.suggestions 
            });
        }

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
                    - origin (string, MUST be lowercase: "indian" or "western" - NOT "Indian" or "Western")
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
            temperature: 0.9,
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
