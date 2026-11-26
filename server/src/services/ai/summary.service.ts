/**
 * Summary Service
 *
 * Generates short, detailed, and bullet-point summaries of a document.
 * For large documents, chunks are summarised in batches and then
 * combined into a final summary.
 */
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const CHUNKS_PER_BATCH = 20;

export interface DocumentSummary {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
}

class SummaryService {
  private genai: GoogleGenAI;

  constructor() {
    this.genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async generateSummary(documentId: string): Promise<DocumentSummary> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { title: true },
    });

    const chunks = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: [{ pageNumber: 'asc' }, { chunkIndex: 'asc' }],
      select: { content: true, pageNumber: true },
    });

    if (chunks.length === 0) {
      throw new Error('No content available to summarise.');
    }

    // For short documents, summarise everything at once
    if (chunks.length <= CHUNKS_PER_BATCH) {
      return this.summariseChunks(chunks, document?.title ?? 'Document');
    }

    // For long documents, summarise each batch, then combine
    const batchSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i += CHUNKS_PER_BATCH) {
      const batch = chunks.slice(i, i + CHUNKS_PER_BATCH);
      const batchSummary = await this.summariseBatch(batch);
      batchSummaries.push(batchSummary);
    }

    return this.combineSummaries(batchSummaries, document?.title ?? 'Document');
  }

  private async summariseBatch(
    chunks: Array<{ content: string; pageNumber: number }>
  ): Promise<string> {
    const text = chunks.map((c) => c.content).join('\n\n');
    const response = await this.genai.models.generateContent({
      model: env.GEMINI_CHAT_MODEL,
      contents: `Summarise the following document section in 2–4 concise sentences:\n\n${text}`,
      config: { temperature: 0.3, maxOutputTokens: 500 },
    });

    return (
      response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Could not summarise this section.'
    );
  }

  private async summariseChunks(
    chunks: Array<{ content: string; pageNumber: number }>,
    title: string
  ): Promise<DocumentSummary> {
    const fullText = chunks.map((c) => c.content).join('\n\n');
    const prompt = `You are summarising the document titled "${title}".

Provide a JSON response with exactly these three fields:
{
  "shortSummary": "2–3 sentence overview",
  "detailedSummary": "comprehensive paragraph covering the main topics, methodology, findings, and conclusions",
  "keyPoints": ["bullet 1", "bullet 2", "bullet 3", ...]
}

Document content:
${fullText}

Respond with valid JSON only.`;

    const response = await this.genai.models.generateContent({
      model: env.GEMINI_CHAT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    try {
      return JSON.parse(raw) as DocumentSummary;
    } catch {
      return {
        shortSummary: raw.slice(0, 300),
        detailedSummary: raw,
        keyPoints: [],
      };
    }
  }

  private async combineSummaries(
    batchSummaries: string[],
    title: string
  ): Promise<DocumentSummary> {
    const combined = batchSummaries.join('\n\n');
    return this.summariseChunks(
      [{ content: combined, pageNumber: 1 }],
      title
    );
  }
}

export const summaryService = new SummaryService();

