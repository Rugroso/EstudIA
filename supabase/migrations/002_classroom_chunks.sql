-- Create chunks table for classroom documents
create table if not exists public.classroom_document_chunks (
  id bigserial primary key,
  classroom_document_id uuid not null references public.classroom_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token int,
  embedding vector(768),
  created_at timestamptz default now()
);

-- Vector index (cosine); requires pgvector extension already enabled
create index if not exists idx_cdc_embedding_cosine
on public.classroom_document_chunks
using hnsw (embedding vector_cosine_ops);

-- Enable RLS and add policies
alter table public.classroom_document_chunks enable row level security;

-- Allow SELECT for class members
drop policy if exists sel_class_members_chunks on public.classroom_document_chunks;
create policy sel_class_members_chunks on public.classroom_document_chunks
for select to authenticated
using (
  classroom_document_id in (
    select cd.id
    from public.classroom_documents cd
    join public.classroom_members cm on cm.classroom_id = cd.classroom_id
    where cm.user_id = auth.uid()
  )
);

-- Broaden SELECT on classroom_documents to class members
drop policy if exists sel_class_members_docs on public.classroom_documents;
create policy sel_class_members_docs on public.classroom_documents
for select to authenticated
using (
  classroom_id in (
    select classroom_id from public.classroom_members where user_id = auth.uid()
  )
);

-- Enforce membership on INSERT into classroom_documents (owner is user)
drop policy if exists ins_owner_only on public.classroom_documents;
drop policy if exists ins_owner_must_be_member on public.classroom_documents;
create policy ins_owner_must_be_member on public.classroom_documents
for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and classroom_id in (
    select classroom_id from public.classroom_members where user_id = auth.uid()
  )
);

-- RPC for similarity over classroom chunks
create or replace function public.match_classroom_chunks(
  query_embedding vector(768),
  class_id uuid,
  match_threshold float,
  match_count int
)
returns table (
  chunk_id bigint,
  classroom_document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    cdc.id as chunk_id,
    cdc.classroom_document_id,
    cdc.chunk_index,
    cdc.content,
    1 - (cdc.embedding <=> query_embedding) as similarity
  from public.classroom_document_chunks cdc
  join public.classroom_documents cd on cd.id = cdc.classroom_document_id
  where cd.classroom_id = class_id
    and cdc.embedding is not null
    and 1 - (cdc.embedding <=> query_embedding) > match_threshold
  order by (cdc.embedding <=> query_embedding) asc
  limit least(match_count, 200)
$$;
