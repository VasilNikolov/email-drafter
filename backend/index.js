// ESM
import Fastify from 'fastify';
import routes from './src/routes/index.js';
import DB from './src/db/index.js';

/**
 * @type {import('fastify').FastifyInstance} Instance of Fastify
 */
const fastify = Fastify({
  logger: true
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database (create sample emails if none exist)
    await DB.initializeDatabase();

    // Register routes
    await fastify.register(routes);

    // Start the server
    await fastify.listen({ port: process.env.PORT || 3001 });
    console.log(`Server is running on port ${process.env.PORT || 3001}`);

  } catch (err) {
    fastify.log.error(err);
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
