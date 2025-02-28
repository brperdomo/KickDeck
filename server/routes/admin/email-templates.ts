import { Request, Response } from "express";
import { db } from "@db";
import { emailTemplates, emailTemplateVersions, emailTemplateVariables } from "@db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Validation schema for email template
const emailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().nullable().optional(),
  subject: z.string().min(1, "Email subject is required"),
  type: z.enum(['registration', 'payment', 'schedule_update', 'game_schedule', 'custom']),
  content: z.string().min(1, "Template content is required"),
  isActive: z.boolean().default(true),
  variables: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    defaultValue: z.string().optional(),
  })).optional(),
});

export async function getEmailTemplates(req: Request, res: Response) {
  try {
    const result = await db.execute(sql`
      SELECT t.*, v.content
      FROM email_templates t
      LEFT JOIN email_template_versions v ON v.template_id = t.id
      WHERE v.is_active = true OR v.id IS NULL
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
}

export async function createEmailTemplate(req: Request, res: Response) {
  try {
    const validatedData = emailTemplateSchema.parse(req.body);

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the template
      const templateResult = await tx.execute(sql`
        INSERT INTO email_templates (
          name, description, subject, type, is_active
        ) VALUES (
          ${validatedData.name},
          ${validatedData.description || null},
          ${validatedData.subject},
          ${validatedData.type},
          ${validatedData.isActive}
        ) RETURNING *
      `);
      
      const template = templateResult.rows[0];

      // Create the initial version
      const versionResult = await tx.execute(sql`
        INSERT INTO email_template_versions (
          template_id, content, version, created_by, is_active
        ) VALUES (
          ${template.id},
          ${validatedData.content},
          ${1},
          ${req.user?.id || null},
          true
        ) RETURNING *
      `);

      // Create variables if provided
      if (validatedData.variables) {
        for (const variable of validatedData.variables) {
          await tx.execute(sql`
            INSERT INTO email_template_variables (
              template_id, name, description, default_value
            ) VALUES (
              ${template.id},
              ${variable.name},
              ${variable.description},
              ${variable.defaultValue || null}
            )
          `);
        }
      }

      return { ...template, content: versionResult.rows[0].content };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating email template:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create email template" });
  }
}

export async function updateEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = emailTemplateSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      // Update template
      const templateResult = await tx.execute(sql`
        UPDATE email_templates
        SET name = ${validatedData.name},
            description = ${validatedData.description || null},
            subject = ${validatedData.subject},
            type = ${validatedData.type},
            is_active = ${validatedData.isActive},
            updated_at = NOW()
        WHERE id = ${Number(id)}
        RETURNING *
      `);

      if (templateResult.rows.length === 0) {
        throw new Error("Template not found");
      }

      // Get current version
      const currentVersionResult = await tx.execute(sql`
        SELECT version FROM email_template_versions
        WHERE template_id = ${Number(id)}
        ORDER BY version DESC LIMIT 1
      `);

      const nextVersion = currentVersionResult.rows.length > 0 
        ? currentVersionResult.rows[0].version + 1 
        : 1;

      // Create new version
      const versionResult = await tx.execute(sql`
        INSERT INTO email_template_versions (
          template_id, content, version, created_by, is_active
        ) VALUES (
          ${Number(id)},
          ${validatedData.content},
          ${nextVersion},
          ${req.user?.id || null},
          true
        ) RETURNING *
      `);

      // Deactivate old versions
      await tx.execute(sql`
        UPDATE email_template_versions
        SET is_active = false
        WHERE template_id = ${Number(id)}
          AND id != ${versionResult.rows[0].id}
      `);

      return { ...templateResult.rows[0], content: versionResult.rows[0].content };
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating email template:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update email template" });
  }
}

export async function deleteEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await db.execute(sql`
      DELETE FROM email_templates 
      WHERE id = ${Number(id)}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ error: "Failed to delete email template" });
  }
}

export async function sendTestEmail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get template with active version
    const templateResult = await db.execute(sql`
      SELECT t.*, v.content
      FROM email_templates t
      JOIN email_template_versions v ON v.template_id = t.id
      WHERE t.id = ${Number(id)} AND v.is_active = true
    `);

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = templateResult.rows[0];

    // TODO: Implement actual email sending logic
    // For now, we'll just simulate success
    console.log(`Test email would be sent with template: ${template.name}`);

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ error: "Failed to send test email" });
  }
}
