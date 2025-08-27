import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { validatePrompt, validateEmailResult, LLMEmailResponse } from './schemas.js';

class SalesAssistant {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL_NAME_ASSISTANTS,
      temperature: 0.7, // Higher creativity for sales content
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: true, // Enable streaming
    }).withStructuredOutput(LLMEmailResponse);

    this.salesPrompt = PromptTemplate.fromTemplate(`
You are a professional sales email writer. Generate a concise, compelling sales email based on the user's description.

STRICT REQUIREMENTS:
- Keep the ENTIRE email under 40 words total (readable in under 10 seconds)
- Maximum 7-10 words per sentence
- Be direct and compelling
- Include a clear call-to-action
- Professional but friendly tone
- No fluff or unnecessary words

Generate both subject and body:
- subject: compelling subject line (max 6 words)
- body: email body (under 35 words total)

User description: {description}
    `);
  }

  async *generateEmailStream(description) {
    try {
      // Validate input using Zod schema
      const validatedInput = validatePrompt(description);

      const prompt = await this.salesPrompt.format({
        description: validatedInput.prompt
      });

      // Use streaming with structured output
      const stream = await this.model.stream(prompt);

      yield { type: 'start', assistantType: 'SALES' };

      let accumulatedResponse = { subject: '', body: '' };

      for await (const chunk of stream) {
        if (chunk.subject) {
          accumulatedResponse.subject = chunk.subject;
          yield {
            type: 'partial',
            field: 'subject',
            content: chunk.subject,
            data: accumulatedResponse
          };
        }

        if (chunk.body) {
          accumulatedResponse.body = chunk.body;
          yield {
            type: 'partial',
            field: 'body',
            content: chunk.body,
            data: accumulatedResponse
          };
        }
      }

      // Final validation of the complete result
      const result = validateEmailResult({
        subject: accumulatedResponse.subject || "Business Opportunity",
        body: accumulatedResponse.body || "Hi! I'd like to discuss how we can help your business grow. Are you available for a quick chat?"
      });

      yield {
        type: 'complete',
        data: result,
        assistantType: 'SALES',
        originalPrompt: validatedInput.prompt
      };

    } catch (error) {
      console.error('Error in Sales Assistant streaming:', error);
      yield {
        type: 'error',
        error: error.message || 'Failed to generate sales email'
      };
    }
  }
}

export default SalesAssistant;
