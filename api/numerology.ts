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

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ 
                role: "user", 
                content: `Provide a detailed numerological analysis for the name "${name}"...` // rest of the prompt
            }],
            temperature: 0.7
        });

        const response = completion.choices[0].message?.content;
        const numerologyInfo = JSON.parse(response || '{}');

        return res.status(200).json(numerologyInfo);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to generate numerology information',
            details: error.message 
        });
    }
}
