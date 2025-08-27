import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { validatePrompt, validateEmailResult, LLMEmailResponse } from './schemas.js';

class FollowupAssistant {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL_NAME_ASSISTANTS,
      temperature: 0.6, // Moderate creativity for professional follow-ups
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: true, // Enable streaming
    }).withStructuredOutput(LLMEmailResponse);

    this.followupPrompt = PromptTemplate.fromTemplate(`
You are a professional follow-up email writer. Generate a polite, professional follow-up email based on the user's description.

REQUIREMENTS:
- Polite and professional tone
- Reference previous interaction when appropriate
- Clear purpose for following up
- Respectful of recipient's time
- Include next steps or call-to-action
- Keep it concise but not as strict as sales emails

Generate both subject and body:
- subject: professional follow-up subject line
- body: polite follow-up email body with clear purpose

User description: {description}
    `);
  }

  async *generateEmailStream(description) {
    try {
      // Validate input using Zod schema
      const validatedInput = validatePrompt(description);

      const prompt = await this.followupPrompt.format({
        description: validatedInput.prompt
      });

      // Use streaming with structured output
      const stream = await this.model.stream(prompt);

      yield { type: 'start', assistantType: 'FOLLOWUP' };

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
        subject: accumulatedResponse.subject || "Following up",
        body: accumulatedResponse.body || "Hi,\n\nI hope this email finds you well. I wanted to follow up on our previous conversation. Please let me know if you need any additional information.\n\nBest regards"
      });

      yield {
        type: 'complete',
        data: result,
        assistantType: 'FOLLOWUP',
        originalPrompt: validatedInput.prompt
      };

    } catch (error) {
      console.error('Error in Follow-up Assistant streaming:', error);
      yield {
        type: 'error',
        error: error.message || 'Failed to generate follow-up email'
      };
    }
  }
}

export default FollowupAssistant;
