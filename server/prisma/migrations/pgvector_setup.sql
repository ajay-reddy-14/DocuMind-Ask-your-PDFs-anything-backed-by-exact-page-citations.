-- Enable the pgvector extension (run once on the database)
CREATE EXTENSION IF NOT EXISTS vector;

-- The DocumentChunk embedding column uses the native vector type.
-- Prisma stores it as Unsupported("vector(768)") in the schema.
-- This migration creates it correctly so pgvector functions work.

-- If running this manually AFTER `prisma migrate dev` has already created the
-- document_chunks table without the embedding column, run:
--   ALTER TABLE document_chunks ADD COLUMN embedding vector(768);

-- Create an IVFFlat index for fast cosine-similarity search.
-- Adjust lists to sqrt(row_count) once the table has significant data.
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

