
import { Router } from 'express';
import { getFeeAssignments, updateFeeAssignments } from './fee-assignments';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Fee assignments
router.get('/events/:eventId/fee-assignments', authenticateJWT, getFeeAssignments);
router.post('/events/:eventId/fee-assignments', authenticateJWT, updateFeeAssignments);

export default router;
