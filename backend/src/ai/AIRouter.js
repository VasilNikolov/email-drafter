import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { validateAssistantType, validatePrompt } from './schemas.js';

class AIRouter {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL_NAME_ROUTER,
      temperature: 0.1, // Low temperature for consistent routing decisions
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.routerPrompt = PromptTemplate.fromTemplate(`
You are an AI router that analyzes email descriptions and determines which specialized assistant should handle the email generation.

Available assistants:
1. SALES - For sales emails, product pitches, business proposals, lead generation, demos, or any commercial outreach
2. FOLLOWUP - For follow-up emails, check-ins, reminders, status updates, or any communication that references previous interactions

Analyze the user's description and respond with ONLY one word: either "SALES" or "FOLLOWUP"

Examples:
- "Sales pitch for our new CRM software" → SALES
- "Follow up on the proposal we sent last week" → FOLLOWUP
- "Meeting request for product demo" → SALES
- "Just checking in on the project status" → FOLLOWUP
- "Introduce our services to potential clients" → SALES
- "Reminder about our previous conversation" → FOLLOWUP

User description: "{description}"

Assistant type:
    `);
  }

  async route(description) {
    try {
      // Validate input using Zod schema
      const validatedInput = validatePrompt(description);

      const prompt = await this.routerPrompt.format({
        description: validatedInput.prompt
      });

      const response = await this.model.invoke([{
        role: 'user',
        content: prompt
      }]);

      const assistantType = response.content.trim().toUpperCase();

      try {
        // Validate the response using Zod schema
        const validatedType = validateAssistantType(assistantType);
        console.log(`Router decision: ${description} → ${validatedType}`);
        return validatedType;
      } catch (validationError) {
        console.warn(`Invalid router response: ${assistantType}, validation error: ${validationError.message}, defaulting to SALES`);
        return 'SALES';
      }
    } catch (error) {
      if (error.name === 'ZodError') {
        console.error('Router input validation error:', error.errors);
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
      }
      console.error('Error in AI router:', error);
      // Default to SALES on error
      return 'SALES';
    }
  }
}

export default AIRouter;
