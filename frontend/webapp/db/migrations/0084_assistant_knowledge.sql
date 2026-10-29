-- Assistant knowledge base (RAG): site content split into chunks, each with an embedding,
-- so the assistant can answer from LSevin's own content (service descriptions, FAQs,
-- treatment steps, provider policies).
create extension if not exists vector;
create schema if not exists ai;

create table if not exists ai.knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  -- Where the text came from: 'service_definition', 'faq', 'process', 'policy', ...
  source_type text not null,
  source_id uuid not null,
  locale text not null,
  title text not null default '',
  content text not null,
  -- Page on the site the chunk is about, so answers can point the user there.
  url text,
  -- Hash of title + content: unchanged chunks are not embedded again (saves cost).
  content_hash text not null,
  -- text-embedding-3-small has 1536 dimensions.
  embedding vector(1536) not null,
  updated_at timestamptz not null default now(),
  unique (source_type, source_id, locale, content_hash)
);

-- Fast nearest-neighbour search by cosine distance.
create index if not exists ix_knowledge_chunks_embedding
  on ai.knowledge_chunks using hnsw (embedding vector_cosine_ops);

create index if not exists ix_knowledge_chunks_source
  on ai.knowledge_chunks (source_type, source_id);
  