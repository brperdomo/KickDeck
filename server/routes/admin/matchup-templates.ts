import express from 'express';
import { db } from '@db';
import { matchupTemplates, insertMatchupTemplateSchema } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Get all matchup templates
router.get('/matchup-templates', async (req, res) => {
  try {
    console.log('[Matchup Templates] Fetching all templates');
    
    const templates = await db
      .select()
      .from(matchupTemplates)
      .orderBy(desc(matchupTemplates.createdAt));

    console.log(`[Matchup Templates] Found ${templates.length} templates`);
    res.json(templates);
  } catch (error) {
    console.error('[Matchup Templates] Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matchup templates',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get matchup template by ID
router.get('/matchup-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Fetching template ${id}`);
    
    const template = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, id))
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[Matchup Templates] Found template: ${template[0].name}`);
    res.json(template[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error fetching template:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Create new matchup template
router.post('/matchup-templates', async (req, res) => {
  try {
    console.log('[Matchup Templates] Creating new template:', req.body);
    
    // Validate request body
    const validatedData = insertMatchupTemplateSchema.parse(req.body);
    
    const newTemplate = await db
      .insert(matchupTemplates)
      .values(validatedData)
      .returning();

    console.log(`[Matchup Templates] Created template: ${newTemplate[0].name} (ID: ${newTemplate[0].id})`);
    res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error creating template:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update matchup template
router.put('/matchup-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Updating template ${id}:`, req.body);
    
    // Validate request body
    const validatedData = insertMatchupTemplateSchema.parse(req.body);
    
    const updatedTemplate = await db
      .update(matchupTemplates)
      .set({ ...validatedData, updatedAt: new Date().toISOString() })
      .where(eq(matchupTemplates.id, id))
      .returning();

    if (updatedTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[Matchup Templates] Updated template: ${updatedTemplate[0].name}`);
    res.json(updatedTemplate[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error updating template:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete matchup template
router.delete('/matchup-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Deleting template ${id}`);
    
    const deletedTemplate = await db
      .delete(matchupTemplates)
      .where(eq(matchupTemplates.id, id))
      .returning();

    if (deletedTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`[Matchup Templates] Deleted template: ${deletedTemplate[0].name}`);
    res.json({ message: 'Template deleted successfully', template: deletedTemplate[0] });
  } catch (error) {
    console.error('[Matchup Templates] Error deleting template:', error);
    res.status(500).json({ 
      error: 'Failed to delete matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Clone matchup template
router.post('/matchup-templates/:id/clone', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    console.log(`[Matchup Templates] Cloning template ${id}`);
    
    // Fetch original template
    const originalTemplate = await db
      .select()
      .from(matchupTemplates)
      .where(eq(matchupTemplates.id, id))
      .limit(1);

    if (originalTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = originalTemplate[0];
    
    // Create clone with new name
    const cloneData = {
      name: `${template.name} (Copy)`,
      description: template.description || '',
      teamCount: template.teamCount,
      bracketStructure: template.bracketStructure,
      matchupPattern: template.matchupPattern,
      totalGames: template.totalGames,
      hasPlayoffGame: template.hasPlayoffGame,
      playoffDescription: template.playoffDescription,
      isActive: true,
    };

    const clonedTemplate = await db
      .insert(matchupTemplates)
      .values(cloneData)
      .returning();

    console.log(`[Matchup Templates] Cloned template: ${clonedTemplate[0].name} (ID: ${clonedTemplate[0].id})`);
    res.status(201).json(clonedTemplate[0]);
  } catch (error) {
    console.error('[Matchup Templates] Error cloning template:', error);
    res.status(500).json({ 
      error: 'Failed to clone matchup template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;