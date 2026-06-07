export type GenerationProvider = 'gemini' | 'mock';

export function getConfiguredGenerationProvider(): GenerationProvider {
  return process.env.GEMINI_API_KEY?.trim() ? 'gemini' : 'mock';
}
