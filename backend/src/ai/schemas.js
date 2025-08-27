import { z } from 'zod';

// Assistant Types
export const AssistantType = z.enum(['SALES', 'FOLLOWUP']);

// Email Generation Schemas
export const EmailGenerationRequest = z.object({
  prompt: z.string()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(500, 'Please keep your description under 500 characters')
    .trim()
});

export const EmailGenerationResult = z.object({
  subject: z.string()
    .min(1, 'Subject cannot be empty')
    .max(200, 'Subject must be less than 200 characters'),
  body: z.string()
    .min(1, 'Body cannot be empty')
    .max(10000, 'Body must be less than 10,000 characters')
});

export const AIServiceResult = z.object({
  subject: z.string(),
  body: z.string(),
  assistantType: AssistantType,
  originalPrompt: z.string()
});

// API Response Schemas
export const AIGenerationResponse = z.object({
  message: z.string(),
  data: z.object({
    subject: z.string(),
    body: z.string(),
    assistantType: AssistantType,
    originalPrompt: z.string()
  })
});

export const ErrorResponse = z.object({
  error: z.string(),
  details: z.array(z.string()).optional()
});

// Router Response Schema
export const RouterResponse = z.object({
  assistantType: AssistantType
});

// LLM Response Schemas (for parsing AI responses)
export const LLMEmailResponse = z.object({
  subject: z.string(),
  body: z.string()
});

// Validation helpers
export const validatePrompt = (prompt) => {
  return EmailGenerationRequest.parse({ prompt });
};

export const validateEmailResult = (result) => {
  return EmailGenerationResult.parse(result);
};

export const validateAIServiceResult = (result) => {
  return AIServiceResult.parse(result);
};

export const validateAssistantType = (type) => {
  return AssistantType.parse(type);
};
