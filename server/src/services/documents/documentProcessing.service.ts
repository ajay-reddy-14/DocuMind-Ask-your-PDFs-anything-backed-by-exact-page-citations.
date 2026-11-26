/**
 * Document Processing Service
 *
 * Orchestrates the full pipeline after a PDF is uploaded:
 *   1. Extract text + page numbers with pdf-parse
 *   2. Split into overlapping chunks
 *   3. Generate embeddings via Gemini
 *   4. Persist chunks + embeddings in PostgreSQL (pgvector)
 *   5. Mark document as PROCESSED
 */
import fs from 'fs';
import { prisma } from '../../config/database';
import { textChunkingService } from './textChunking.service';
import { embeddingService } from '../embeddings/embedding.service';

class DocumentProcessingService {
  async processDocument(documentId: string): Promise<void> {
    try {
      // Mark as PROCESSING
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' },
      });

      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (!document) throw new Error(`Document ${documentId} not found`);

      // 1. Extract text
      const pages = await this.extractText(document.storagePath);
      const pageCount = pages.length;

      // 2. Chunk
      const chunks = textChunkingService.chunkPages(pages);

      // 3. Generate embeddings in batches and store
      await this.storeChunks(documentId, chunks);

      // 4. Mark PROCESSED
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSED', pageCount },
      });

      console.log(
        `✅  Document ${documentId} processed: ${pageCount} pages, ${chunks.length} chunks`
      );
    } catch (err) {
      console.error(`❌  Document processing failed for ${documentId}:`, err);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
    }
  }

  private async extractText(filePath: string): Promise<Array<{ page: number; text: string }>> {
    // pdf-parse reads the entire PDF and returns text; we need page-level text.
    // pdf-parse renders each page separately via its `pagerender` option.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (
      data: Buffer,
      options?: Record<string, unknown>
    ) => Promise<{ numpages: number; text: string }>;

    const pages: Array<{ page: number; text: string }> = [];

    const pdfBuffer = fs.readFileSync(filePath);

    // Use the render_page callback to capture text per page
    let currentPage = 0;

    const result = await pdfParse(pdfBuffer, {
      pagerender: (pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) => {
        currentPage++;
        const pageNum = currentPage;
        return pageData.getTextContent().then((textContent) => {
          const text = textContent.items.map((item) => item.str).join(' ');
          pages.push({ page: pageNum, text });
          return text;
        });
      },
    });

    // Fallback: if page render didn't fire (some PDFs), use the full text as page 1
    if (pages.length === 0 && result.text.trim()) {
      pages.push({ page: 1, text: result.text });
    }

    if (pages.every((p) => !p.text.trim())) {
      throw new Error(
        'Could not extract text from this PDF. It may be scanned, image-only, or password-protected.'
      );
    }

    return pages;
  }

  private async storeChunks(
    documentId: string,
    chunks: Array<{ chunkIndex: number; content: string; pageNumber: number }>
  ): Promise<void> {
    const BATCH_SIZE = 10;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const contents = batch.map((c) => c.content);
      const embeddings = await embeddingService.embedBatch(contents);

      // Insert each chunk with its embedding using raw SQL (pgvector)
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];
        const vectorLiteral = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO document_chunks (id, document_id, chunk_index, content, page_number, embedding, created_at)
          VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${chunk.chunkIndex},
            ${chunk.content},
            ${chunk.pageNumber},
            ${vectorLiteral}::vector,
            NOW()
          )
        `;
      }
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();

