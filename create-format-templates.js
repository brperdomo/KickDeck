import { db } from './db/index.js';
import { formatTemplates } from './db/schema.js';

async function createFormatTemplates() {
  console.log('Creating default format templates...');
  
  try {
    // Check if templates already exist
    const existingTemplates = await db.select().from(formatTemplates);
    if (existingTemplates.length > 0) {
      console.log('Format templates already exist');
      return;
    }

    // Create default templates based on user specifications
    const templates = [
      {
        name: '11v11 Older',
        description: 'Standard 11v11 format for older age groups with full-size fields',
        gameLength: 40, // 40 minute halves
        fieldSize: '11v11',
        bufferTime: 15, // 15 minutes between games
        restPeriod: 120, // 2 hours minimum rest
        maxGamesPerDay: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: '9v9 Standard',
        description: 'Standard 9v9 format for middle age groups',
        gameLength: 35, // 35 minute halves
        fieldSize: '9v9',
        bufferTime: 10, // 10 minutes between games
        restPeriod: 90, // 90 minutes minimum rest
        maxGamesPerDay: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: '7v7 Youth',
        description: 'Youth 7v7 format for younger age groups',
        gameLength: 30, // 30 minute halves
        fieldSize: '7v7',
        bufferTime: 10, // 10 minutes between games
        restPeriod: 60, // 60 minutes minimum rest
        maxGamesPerDay: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: '11v11 Elite',
        description: 'Elite level 11v11 with extended game time and rest',
        gameLength: 40, // 40 minute halves
        fieldSize: '11v11',
        bufferTime: 20, // 20 minutes between games
        restPeriod: 150, // 2.5 hours minimum rest
        maxGamesPerDay: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: '9v9 Classic',
        description: 'Classic recreational 9v9 format',
        gameLength: 30, // 30 minute halves
        fieldSize: '9v9',
        bufferTime: 10, // 10 minutes between games
        restPeriod: 75, // 75 minutes minimum rest
        maxGamesPerDay: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await db.insert(formatTemplates).values(templates);
    console.log('Default format templates created successfully');
    
  } catch (error) {
    console.error('Error creating format templates:', error);
  }
}

// Run if called directly
createFormatTemplates().then(() => process.exit(0));