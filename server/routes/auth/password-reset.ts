import { Router } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { emailService } from "../../services/email-service";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (foundUsers.length === 0) {
      // Don't reveal if the email exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent' 
      });
    }

    const user = foundUsers[0];

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 1); // Token expires in 1 hour

    // Update user with reset token and expiration
    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresDate.toISOString(),
      })
      .where(eq(users.id, user.id));

    // Send email with reset link
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    await emailService.sendPasswordResetEmail(user.email, {
      username: user.username || user.firstName || 'User',
      resetUrl,
    });

    // For development: log the token and reset URL in a VERY VISIBLE way
    console.log(`\n=============== PASSWORD RESET TOKEN ===============`);
    console.log(`Password reset requested for ${user.email}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Use the token in the URL: ${resetUrl}`);
    console.log(`Token expires: ${expiresDate}`);
    console.log(`====================================================\n`);

    return res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent' 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

export default router;