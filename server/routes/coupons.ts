import { Request, Response } from "express";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Base validation schema without transforms
const baseCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  expirationDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  eventId: z.union([z.coerce.number().positive(), z.null()]).optional(),
  maxUses: z.coerce.number().positive("Max uses must be positive").nullable().optional(),
  isActive: z.boolean().default(true),
});

// Enhanced schema with transforms and validation for creation
const couponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
  expirationDate: z.string().nullable().optional().transform(val => val ? new Date(val).toISOString() : null),
  description: z.string().nullable().optional(),
  eventId: z.union([z.coerce.number().positive(), z.null()]).optional(),
  maxUses: z.coerce.number().positive("Max uses must be positive").nullable().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Validate percentage discounts are between 0 and 100
  if (data.discountType === "percentage" && (data.amount < 0 || data.amount > 100)) {
    return false;
  }
  // Validate fixed discounts are positive
  if (data.discountType === "fixed" && data.amount < 0) {
    return false;
  }
  return true;
}, {
  message: "Percentage discounts must be between 0-100%, fixed discounts must be positive",
  path: ["amount"]
});

export async function createCoupon(req: Request, res: Response) {
  try {
    console.log("Creating coupon with request body:", req.body);
    
    const validatedData = couponSchema.parse(req.body);
    
    console.log("Validated coupon data:", {
      code: validatedData.code,
      discountType: validatedData.discountType,
      amount: validatedData.amount,
      eventId: validatedData.eventId
    });

    // Allow null eventId for global coupons
    const eventIdToUse = validatedData.eventId || null;

    // Check if code exists for this event
    const existingCoupon = await db.execute(sql`
      SELECT id FROM coupons 
      WHERE LOWER(code) = LOWER(${validatedData.code})
      AND (expiration_date IS NULL OR expiration_date > NOW())
      AND is_active = true
    `);

    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({ 
        error: "Coupon code already exists",
        code: "DUPLICATE_CODE"
      });
    }

    const result = await db.execute(sql`
      INSERT INTO coupons (
        code,
        discount_type,
        amount,
        expiration_date,
        description,
        event_id,
        max_uses,
        is_active
      ) VALUES (
        ${validatedData.code},
        ${validatedData.discountType},
        ${validatedData.amount},
        ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        ${validatedData.description || null},
        ${validatedData.eventId || null},
        ${validatedData.maxUses || null},
        ${validatedData.isActive}
      ) RETURNING *;
    `);

    // Map database field names to frontend expected format
    const createdCoupon = result.rows[0];
    const mappedCoupon = {
      id: createdCoupon.id,
      code: createdCoupon.code,
      discountType: createdCoupon.discount_type,
      amount: createdCoupon.amount,
      expirationDate: createdCoupon.expiration_date,
      description: createdCoupon.description,
      eventId: createdCoupon.event_id,
      maxUses: createdCoupon.max_uses,
      usageCount: createdCoupon.usage_count,
      isActive: createdCoupon.is_active,
      createdAt: createdCoupon.created_at,
      updatedAt: createdCoupon.updated_at
    };

    console.log("Coupon created successfully:", mappedCoupon);
    res.status(201).json(mappedCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create coupon" });
  }
}

export async function getCoupons(req: Request, res: Response) {
  try {
    const eventId = req.query.eventId;
    let query;

    if (!eventId) {
      query = sql`SELECT * FROM coupons ORDER BY created_at DESC`;
    } else {
      const numericEventId = parseInt(eventId as string, 10);
      if (isNaN(numericEventId)) {
        return res.status(400).json({ error: "Invalid event ID format" });
      }
      query = sql`SELECT * FROM coupons WHERE event_id = ${numericEventId} ORDER BY created_at DESC`;
    }

    const result = await db.execute(query);
    
    // Map database field names to frontend expected format
    const mappedRows = result.rows.map((row: any) => ({
      id: row.id,
      code: row.code,
      discountType: row.discount_type, // Map snake_case to camelCase
      amount: row.amount,
      expirationDate: row.expiration_date,
      description: row.description,
      eventId: row.event_id,
      maxUses: row.max_uses,
      usageCount: row.usage_count,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log("Mapped coupon data for frontend:", mappedRows);
    res.json(mappedRows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
}

export async function updateCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = baseCouponSchema.partial().parse(req.body);

    // Additional validation for percentage discounts
    if (validatedData.discountType && validatedData.amount !== undefined) {
      if (validatedData.discountType === "percentage" && (validatedData.amount < 0 || validatedData.amount > 100)) {
        return res.status(400).json({ 
          error: "Percentage discounts must be between 0-100%" 
        });
      }
      if (validatedData.discountType === "fixed" && validatedData.amount < 0) {
        return res.status(400).json({ 
          error: "Fixed discount amount must be positive" 
        });
      }
    }

    const result = await db.execute(sql`
      UPDATE coupons SET 
        code = ${validatedData.code || null},
        discount_type = ${validatedData.discountType || null},
        amount = ${validatedData.amount || null},
        expiration_date = ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        description = ${validatedData.description || null},
        event_id = ${validatedData.eventId || null},
        max_uses = ${validatedData.maxUses || null},
        is_active = ${validatedData.isActive === undefined ? true : validatedData.isActive},
        updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *;
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    // Map database field names to frontend expected format
    const updatedCoupon = result.rows[0];
    const mappedCoupon = {
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      discountType: updatedCoupon.discount_type,
      amount: updatedCoupon.amount,
      expirationDate: updatedCoupon.expiration_date,
      description: updatedCoupon.description,
      eventId: updatedCoupon.event_id,
      maxUses: updatedCoupon.max_uses,
      usageCount: updatedCoupon.usage_count,
      isActive: updatedCoupon.is_active,
      createdAt: updatedCoupon.created_at,
      updatedAt: updatedCoupon.updated_at
    };

    console.log("Coupon updated successfully:", mappedCoupon);
    res.json(mappedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update coupon" });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await db.execute(sql`
      DELETE FROM coupons WHERE id = ${Number(id)} RETURNING *;
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
}