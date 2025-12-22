export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and initialize backend services
    const { initializeBackend } = await import('./lib/init');
    await initializeBackend();
  }
}
