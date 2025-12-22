
import { Request, Response } from 'express';

export const getSystemSettings = async (req: Request, res: Response) => {
    // Return hardcoded settings for now, or fetch from DB if needed later
    res.json({
        maintenance: false,
        betaFeatures: true,
        registrations: true,
        aiEngine: true
    });
};
