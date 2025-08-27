export default async function routes(fastify, options) {
  fastify.get('/ping', async (request, reply) => {
    return 'pong\n';
  });
}
