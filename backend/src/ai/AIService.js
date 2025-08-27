import AIRouter from './AIRouter.js';
import SalesAssistant from './SalesAssistant.js';
import FollowupAssistant from './FollowupAssistant.js';
import { validatePrompt } from './schemas.js';

class AIService {
  constructor() {
    this.router = new AIRouter();
    this.salesAssistant = new SalesAssistant();
    this.followupAssistant = new FollowupAssistant();
  }

  async *generateEmailStream(description) {
    try {
      console.log(`AI Service: Processing streaming request for: "${description}"`);

      // Validate input using Zod schema
      const validatedInput = validatePrompt(description);

      // Step 1: Route to appropriate assistant
      const assistantType = await this.router.route(validatedInput.prompt);
      console.log(`AI Service: Routed to ${assistantType} assistant`);

      // Step 2: Generate email using selected assistant with streaming
      if (assistantType === 'SALES') {
        for await (const chunk of this.salesAssistant.generateEmailStream(validatedInput.prompt)) {
          yield chunk;
        }
      } else if (assistantType === 'FOLLOWUP') {
        for await (const chunk of this.followupAssistant.generateEmailStream(validatedInput.prompt)) {
          yield chunk;
        }
      } else {
        throw new Error(`Unknown assistant type: ${assistantType}`);
      }

    } catch (error) {
      console.error('AI Service Streaming Error:', error);
      yield {
        type: 'error',
        error: error.message || 'AI email generation failed'
      };
    }
  }

  // Method to check if service is properly configured
  isConfigured() {
    return !!process.env.OPENAI_API_KEY;
  }
}

export default AIService;
