/**
 * Coach API routes for validating coach emails and creating coach accounts
 */
import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if a coach email exists in the system
 * Used for auto-filling coach information during team registration
 */
export async function checkCoachEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Look up the email in the users table
    const userResults = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (userResults.length === 0) {
      // No matching user found
      return res.json({
        exists: false,
        coach: null
      });
    }
    
    const user = userResults[0];
    
    // Return coach information for auto-filling form fields
    // Exclude sensitive information like password
    return res.json({
      exists: true,
      coach: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '' // Phone may be null in the database
      }
    });
  } catch (error) {
    console.error('Error checking coach email:', error);
    return res.status(500).json({ error: 'Failed to check coach email' });
  }
}