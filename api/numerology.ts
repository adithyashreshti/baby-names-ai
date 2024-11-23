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
    const initialSum = name.toLowerCase().split('')
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
                    
                    Format exactly as this JSON structure:
                    {
                        "meaning": "<detailed meaning>",
                        "characteristics": "<key traits>",
                        "lifePath": "<life path description>",
                        "references": [
                            {
                                "source": "Pythagorean Numerology",
                                "link": "https://example.com/pythagoras",
                                "description": "Ancient Greek system of numerology"
                            }
                        ]
                    }`
            }],
            temperature: 0.7
        });

        const aiContent = JSON.parse(completion.choices[0].message?.content || '{}');

        // Combine our calculated number with AI content
        const numerologyInfo = {
            number,  // Use our calculated number
            ...aiContent  // Spread AI-generated content
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
