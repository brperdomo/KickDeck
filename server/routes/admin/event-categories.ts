
import { Router } from 'express';

const router = Router();

// Basic routes for event categories
router.get('/', async (req, res) => {
  res.json({ categories: [] });
});

export default router;
