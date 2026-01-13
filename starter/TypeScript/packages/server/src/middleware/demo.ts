import { Router } from 'express';
import type { Request, Response } from 'express';
import { add } from 'shared';

export const demoRouter = Router();

interface AddRequest {
    a: number;
    b: number;
}

demoRouter.post('/add', (req: Request<{}, {}, AddRequest>, res: Response) => {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
        return res.status(400).json({ error: 'Both a and b must be numbers' });
    }
    
    const result = add(a, b);
    res.json({ result });
});
