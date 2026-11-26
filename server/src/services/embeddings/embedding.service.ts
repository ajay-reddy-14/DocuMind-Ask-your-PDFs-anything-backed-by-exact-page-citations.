/**
 * Embedding Service
 *
 * Wraps the Google Gemini embedding API.
 * Returns a float array for each input text.
 */
import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';

class EmbeddingService {
  private genai: GoogleGenAI;

  constructor() {
    this.genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  /**
   * Generate an embedding for a single text string.
   */
  async embed(text: string): Promise<number[]> {
    const result = await this.genai.models.embedContent({
      model: env.GEMINI_EMBEDDING_MODEL,
      contents: text,
    });

    const embedding = result.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Embedding generation returned no values.');
    }

    return embedding;
  }

  /**
   * Generate embeddings for a batch of texts.
   * Processes sequentially to stay within API rate limits.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    for (const text of texts) {
      const embedding = await this.embed(text);
      results.push(embedding);
      // Small delay to be kind to the API rate limiter
      await this.sleep(50);
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const embeddingService = new EmbeddingService();

