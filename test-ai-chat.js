// Quick test of the enhanced AI assistant with tournament context
const { chatWithTournamentContext } = require('./server/services/openai');

async function testAIChat() {
  console.log('Testing AI assistant with tournament data access...\n');
  
  try {
    const result = await chatWithTournamentContext('1844329078', 'How many tournament formats/matchups have we set up so far?');
    
    if (result.error) {
      console.error('Error:', result.error);
      return;
    }
    
    console.log('AI Response:', result.response);
    console.log('\nContext Data:');
    console.log('- Format Templates:', result.context.formatTemplates);
    console.log('- Configured Brackets:', result.context.configuredBrackets);
    console.log('- Total Brackets:', result.context.totalBrackets);
    console.log('- Approved Teams:', result.context.approvedTeams.toLocaleString());
    console.log('- Scheduled Games:', result.context.scheduledGames.toLocaleString());
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAIChat();