import DB from '../db/index.js';
import AIService from '../ai/AIService.js';

const aiService = new AIService();

export default async function routes(fastify, options) {
  // Enable CORS for frontend
  await fastify.register(import('@fastify/cors'), {
    origin: ['http://localhost:3000'],
    credentials: true
  });

  // Get all emails with pagination
  fastify.get('/api/emails', async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      const emails = await DB.getEmailsPaginated(offset, parseInt(limit));
      const totalCount = await DB.getEmailCount();

      return {
        emails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: offset + emails.length < totalCount
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch emails' });
    }
  });

  // Get single email by ID
  fastify.get('/api/emails/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const email = await DB.getEmailById(id);
      if (!email) {
        reply.status(404).send({ error: 'Email not found' });
        return;
      }
      return email;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch email' });
    }
  });

  // Delete email by ID
  fastify.delete('/api/emails/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // Validate ID parameter
      if (!id || isNaN(parseInt(id))) {
        reply.status(400).send({ error: 'Invalid email ID' });
        return;
      }

      // Check if email exists
      const email = await DB.getEmailById(parseInt(id));
      if (!email) {
        reply.status(404).send({ error: 'Email not found' });
        return;
      }

      // Delete the email
      const deleted = await DB.deleteEmail(parseInt(id));
      if (deleted) {
        reply.status(200).send({ message: 'Email deleted successfully', id: parseInt(id) });
      } else {
        reply.status(500).send({ error: 'Failed to delete email' });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete email' });
    }
  });

  // Create new email
  fastify.post('/api/emails', async (request, reply) => {
    try {
      const { to, cc, bcc, subject, body } = request.body;

      // Enhanced validation with detailed error messages
      const validationErrors = [];

      // Validate required fields
      if (!to || !to.trim()) {
        validationErrors.push('To field is required');
      }
      if (!subject || !subject.trim()) {
        validationErrors.push('Subject is required');
      }
      if (!body || !body.trim()) {
        validationErrors.push('Message body is required');
      }

      // Email validation regex (RFC 5322 compliant)
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      // Validate email format for TO field
      if (to && to.trim()) {
        const toEmails = to.split(',').map(email => email.trim()).filter(email => email);
        const invalidToEmails = toEmails.filter(email => !emailRegex.test(email));
        if (invalidToEmails.length > 0) {
          validationErrors.push(`Invalid email format in TO field: ${invalidToEmails.join(', ')}`);
        }
        if (toEmails.length === 0) {
          validationErrors.push('At least one valid email address is required in TO field');
        }
      }

      // Validate email format for CC field (optional)
      if (cc && cc.trim()) {
        const ccEmails = cc.split(',').map(email => email.trim()).filter(email => email);
        const invalidCcEmails = ccEmails.filter(email => !emailRegex.test(email));
        if (invalidCcEmails.length > 0) {
          validationErrors.push(`Invalid email format in CC field: ${invalidCcEmails.join(', ')}`);
        }
      }

      // Validate email format for BCC field (optional)
      if (bcc && bcc.trim()) {
        const bccEmails = bcc.split(',').map(email => email.trim()).filter(email => email);
        const invalidBccEmails = bccEmails.filter(email => !emailRegex.test(email));
        if (invalidBccEmails.length > 0) {
          validationErrors.push(`Invalid email format in BCC field: ${invalidBccEmails.join(', ')}`);
        }
      }

      // Validate subject length
      if (subject && subject.trim().length > 200) {
        validationErrors.push('Subject must be less than 200 characters');
      }

      // Validate body length
      if (body && body.trim().length > 5000) {
        validationErrors.push('Message body must be less than 5,000 characters');
      }

      // Return validation errors if any
      if (validationErrors.length > 0) {
        reply.status(400).send({
          error: 'Validation failed',
          details: validationErrors
        });
        return;
      }

      // Sanitize and prepare email data
      const emailData = {
        to: to.trim(),
        cc: cc?.trim() || '',
        bcc: bcc?.trim() || '',
        subject: subject.trim(),
        body: body.trim()
      };

      // Additional business logic validation
      const totalRecipients = [
        ...emailData.to.split(',').filter(e => e.trim()),
        ...emailData.cc.split(',').filter(e => e.trim()),
        ...emailData.bcc.split(',').filter(e => e.trim())
      ].length;

      if (totalRecipients > 50) {
        reply.status(400).send({
          error: 'Too many recipients',
          details: ['Maximum 50 recipients allowed per email']
        });
        return;
      }

      const result = await DB.createEmail(emailData);
      reply.status(201).send({
        message: 'Email created successfully',
        id: result[0],
        recipients: totalRecipients
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to create email' });
    }
  });

  // Generate AI email (streaming only)
  fastify.post('/api/emails/generate', async (request, reply) => {
    try {
      const { prompt } = request.body;

      // Validate request
      if (!prompt || !prompt.trim()) {
        reply.status(400).send({
          error: 'Prompt is required',
          details: ['Please provide a description of what the email should be about']
        });
        return;
      }

      // Check if AI service is configured
      if (!aiService.isConfigured()) {
        reply.status(500).send({
          error: 'AI service not configured',
          details: ['OpenAI API key is not set']
        });
        return;
      }

      // Set up Server-Sent Events headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true',
      });

      try {
        // Generate email using AI service with streaming
        for await (const chunk of aiService.generateEmailStream(prompt)) {
          const data = JSON.stringify(chunk);
          reply.raw.write(`data: ${data}\n\n`);
        }

        // Send final message to indicate stream completion
        reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        reply.raw.end();

      } catch (streamError) {
        const errorChunk = JSON.stringify({
          type: 'error',
          error: streamError.message || 'AI generation failed'
        });
        reply.raw.write(`data: ${errorChunk}\n\n`);
        reply.raw.end();
      }

    } catch (error) {
      fastify.log.error('AI streaming error:', error);

      // Handle errors before streaming starts
      if (!reply.raw.headersSent) {
        if (error.message.includes('Validation failed')) {
          reply.status(400).send({
            error: 'Input validation failed',
            details: [error.message]
          });
        } else {
          reply.status(500).send({
            error: 'AI generation failed',
            details: [error.message || 'An unexpected error occurred during email generation']
          });
        }
      }
    }
  });
}
