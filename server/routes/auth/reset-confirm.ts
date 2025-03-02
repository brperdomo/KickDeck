
import { Router } from "express";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { passwordResetTokens } from "./password-reset";
import { hashPassword } from "../../crypto";

const resetConfirmRouter = Router();

resetConfirmRouter.post("/reset-password/confirm", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  const tokenData = passwordResetTokens[token];
  if (!tokenData) {
    return res.status(404).json({ message: "Token not found or has expired" });
  }

  if (new Date() > tokenData.expires) {
    delete passwordResetTokens[token];
    return res.status(401).json({ message: "Token has expired" });
  }

  try {
    const hashedPassword = await hashPassword(password);

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, tokenData.userId));

    // Delete the token after successful reset
    delete passwordResetTokens[token];

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

export default resetConfirmRouter;
