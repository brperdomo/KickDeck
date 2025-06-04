// Simple TypeScript loader using dynamic import
async function startServer() {
  try {
    // Try to use tsx from npx if locally installed tsx doesn't work
    const { spawn } = await import('child_process');
    const server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      shell: true
    });
    
    server.on('error', (err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
    
    server.on('exit', (code) => {
      process.exit(code);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();