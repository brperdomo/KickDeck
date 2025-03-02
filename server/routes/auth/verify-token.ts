
import { Router } from "express";
import { passwordResetTokens } from "./password-reset";

const verifyTokenRouter = Router();

verifyTokenRouter.get("/verify-reset-token", (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token is required" });
  }

  const tokenData = passwordResetTokens[token];
  if (!tokenData) {
    return res.status(404).json({ message: "Token not found or has expired" });
  }

  if (new Date() > tokenData.expires) {
    delete passwordResetTokens[token];
    return res.status(401).json({ message: "Token has expired" });
  }

  return res.status(200).json({ message: "Token is valid" });
});

export default verifyTokenRouter;
