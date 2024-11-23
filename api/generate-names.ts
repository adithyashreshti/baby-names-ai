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
        const { gender, origin, nameExpectations } = req.body;

        const prompt = `Generate 5 unique baby names based on these criteria:
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

            Format the response as a JSON array with the following structure:
            {
                "names": [{
                    "name": string,
                    "gender": "${gender}",
                    "origin": "${origin}",
                    "details": {
                        "popularity": string,
                        "style": string,
                        "etymology": string,
                        "historicalSignificance": string,
                        "variants": string[],
                        "famousPeople": [{
                            "name": string,
                            "description": string
                        }]
                    }
                }]
            }`;

        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ 
                role: "user", 
                content: prompt 
            }],
            temperature: 0.7,
            max_tokens: 2000
        });

        const response = completion.data.choices[0].message?.content;
        const parsedResponse = JSON.parse(response || '{"names": []}');
        
        // Ensure the response matches our expected format
        const names = parsedResponse.names.map((name: any) => ({
            ...name,
            id: crypto.randomUUID(),
            isFavorite: false
        }));

        return res.status(200).json(names);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to generate names',
            details: error.message 
        });
    }
}
