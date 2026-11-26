/**
 * Text Chunking Service
 *
 * Splits per-page text into overlapping chunks so the RAG retriever can
 * find relevant passages efficiently.
 *
 * Strategy:
 *   - Split on sentence boundaries (periods, question marks, exclamation marks)
 *   - Accumulate sentences until the chunk reaches TARGET_TOKENS
 *   - Carry the last OVERLAP_TOKENS worth of text into the next chunk
 *
 * Token approximation: ~4 characters per token (English prose average).
 */

const CHARS_PER_TOKEN = 4;
const TARGET_TOKENS = 700;
const OVERLAP_TOKENS = 100;

const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;   // ~2800
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;  // ~400

interface PageText {
  page: number;
  text: string;
}

interface Chunk {
  chunkIndex: number;
  content: string;
  pageNumber: number;
}

class TextChunkingService {
  chunkPages(pages: PageText[]): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkIndex = 0;
    for (const { page, text } of pages) {
      const cleaned = this.cleanText(text);
      if (!cleaned) continue;

      const sentences = this.splitSentences(cleaned);
      // Do not carry overlap across page boundaries so page citations remain accurate
      let overlap = '';
      let buffer = '';

      for (const sentence of sentences) {
        buffer += (buffer ? ' ' : '') + sentence;

        if (buffer.length >= TARGET_CHARS) {
          chunks.push({
            chunkIndex: chunkIndex++,
            content: buffer.trim(),
            pageNumber: page,
          });

          // Keep the last OVERLAP_CHARS as context for the next chunk
          overlap = buffer.slice(-OVERLAP_CHARS);
          buffer = overlap;
        }
      }

      // Flush remaining buffer as a chunk if it has meaningful content
      if (buffer.trim().length > 50) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: buffer.trim(),
          pageNumber: page,
        });
        overlap = buffer.slice(-OVERLAP_CHARS);
      }
    }

    return chunks;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')            // collapse whitespace
      .replace(/[\x00-\x08\x0B-\x1F]/g, '') // remove control chars
      .trim();
  }

  private splitSentences(text: string): string[] {
    // Split at sentence-ending punctuation followed by whitespace and a capital letter
    return text
      .split(/(?<=[.!?])\s+(?=[A-Z])/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export const textChunkingService = new TextChunkingService();

