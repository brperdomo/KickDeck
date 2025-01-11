import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createAdmin() {
  try {
    const hashedPassword = await hashPassword("!Nova2025");

    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bperdomo@zoho.com"))
      .limit(1);

    if (!existingAdmin) {
      await db.insert(users).values({
        email: "bperdomo@zoho.com",
        username: "bperdomo@zoho.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isParent: false,
        createdAt: new Date().toISOString()
      });
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}