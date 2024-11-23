import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Pythagorean numerology calculation
function calculateNumber(name: string): number {
    const numberMap: { [key: string]: number } = {
        'a': 1, 'j': 1, 's': 1,
        'b': 2, 'k': 2, 't': 2,
        'c': 3, 'l': 3, 'u': 3,
        'd': 4, 'm': 4, 'v': 4,
        'e': 5, 'n': 5, 'w': 5,
        'f': 6, 'o': 6, 'x': 6,
        'g': 7, 'p': 7, 'y': 7,
        'h': 8, 'q': 8, 'z': 8,
        'i': 9, 'r': 9
    };

    // Initial sum
    const initialSum = name.toLowerCase()
        .split('')
        .reduce((acc, char) => acc + (numberMap[char] || 0), 0);

    // Check for master numbers
    if ([11, 22, 33].includes(initialSum)) {
        return initialSum;
    }

    // Keep reducing until single digit
    let sum = initialSum;
    while (sum > 9) {
        sum = sum.toString()
            .split('')
            .reduce((acc, digit) => acc + parseInt(digit), 0);
    }

    return sum;
}

// Function to check if URL is valid and accessible
async function isValidUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        if (!response.ok) return false;
        
        // Get the page title or content to check for 404 indicators
        const text = await response.text();
        const lowerText = text.toLowerCase();
        
        // Check for common 404 indicators
        const errorIndicators = ['404', 'not found', 'page not found', 'error'];
        return !errorIndicators.some(indicator => lowerText.includes(indicator));
    } catch {
        return false;
    }
}

// Filter and validate references
async function validateReferences(references: any[]): Promise<any[]> {
    const validatedRefs = [];
    
    for (const ref of references) {
        // Skip if title contains error indicators
        if (/404|error|not found/i.test(ref.source)) continue;
        
        // Check if URL is valid
        if (await isValidUrl(ref.link)) {
            validatedRefs.push(ref);
            // Only keep up to 2 valid references
            if (validatedRefs.length === 2) break;
        }
    }
    
    return validatedRefs;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name } = req.body;
        console.log('Analyzing numerology for name:', name);

        // Calculate number using our standard method
        const number = calculateNumber(name);
        console.log('Calculated numerology number:', number);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Provide detailed numerological insights for the name "${name}" with numerology number ${number}.
                    Include:
                    1. The spiritual and metaphysical meaning
                    2. Key personality characteristics
                    3. Life path implications
                    4. At least 3-4 different reliable reference sources (with real, accessible URLs)
                    
                    Format exactly as this JSON structure:
                    {
                        "meaning": "<detailed meaning>",
                        "characteristics": "<key traits>",
                        "lifePath": "<life path description>",
                        "references": [
                            {
                                "source": "<specific source name - avoid generic titles>",
                                "link": "<reference URL>",
                                "description": "<brief description of this source>"
                            }
                        ]
                    }`
            }],
            temperature: 0.7
        });

        const aiContent = JSON.parse(completion.choices[0].message?.content || '{}');
        
        // Validate and filter references
        const validatedRefs = await validateReferences(aiContent.references);
        
        // Combine content with validated references and our calculated number
        const numerologyInfo = {
            number,  // Use our calculated number
            meaning: aiContent.meaning,
            characteristics: aiContent.characteristics,
            lifePath: aiContent.lifePath,
            references: validatedRefs
        };

        return res.status(200).json(numerologyInfo);
    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate numerology information',
            details: error.message 
        });
    }
}
