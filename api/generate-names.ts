import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // First, log the request
        console.log('Request received:', req.body);
        
        // Check if OpenAI key exists
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Return a test response first
        return res.status(200).json([{
            name: "Test Name",
            gender: req.body.gender,
            origin: req.body.origin,
            details: {
                popularity: "Test Popularity",
                style: "Test Style",
                etymology: "Test Etymology",
                historicalSignificance: "Test History",
                variants: ["Test Variant 1", "Test Variant 2"],
                famousPeople: [{
                    name: "Test Person",
                    description: "Test Description"
                }]
            }
        }]);

    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Server error',
            details: error.message 
        });
    }
}
