import uuid
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from models.domain import KnowledgeBaseEmbedding
from db.redis_client import store_in_redis, delete_from_redis_by_prefix
from core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize OpenAI Embeddings (text-embedding-3-large is 3072 dimensions)
embeddings = OpenAIEmbeddings(
    model=settings.EMBEDDING_MODEL,
    openai_api_key=settings.OPENAI_API_KEY
)

# Initialize Text Splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

async def process_and_embed_text(kb_metadata_id: uuid.UUID, text: str, db: AsyncSession) -> int:
    """
    Chunks text, generates embeddings via OpenAI, and stores them in PostgreSQL (pgvector) and Redis.
    """
    logger.info(f"Splitting text for KB ID {kb_metadata_id}...")
    chunks = text_splitter.split_text(text)
    if not chunks:
        logger.warning(f"No text chunks found for KB ID {kb_metadata_id}")
        return 0
    
    logger.info(f"Generated {len(chunks)} chunks. Generating embeddings...")
    vectors = await embeddings.aembed_documents(chunks)
    
    logger.info("Storing vectors in Postgres and Redis...")
    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
        # 1. Insert into PostgreSQL (pgvector)
        kb_embedding = KnowledgeBaseEmbedding(
            knowledge_id=kb_metadata_id,
            chunk_text=chunk,
            embedding=vector
        )
        db.add(kb_embedding)
        
        # 2. Insert into Redis for caching / fast retrieval fallback
        redis_key = f"kb:{kb_metadata_id}:{i}"
        await store_in_redis(
            key=redis_key, 
            vector=vector, 
            metadata={
                "knowledge_id": str(kb_metadata_id), 
                "chunk_text": chunk
            }
        )
        
    await db.commit()
    logger.info(f"Successfully processed {len(chunks)} chunks for KB ID {kb_metadata_id}")
    return len(chunks)

async def delete_knowledge_chunks(kb_metadata_id: uuid.UUID, db: AsyncSession):
    """
    Deletes all chunks related to a KB ID from PostgreSQL and Redis.
    """
    logger.info(f"Deleting chunks for KB ID {kb_metadata_id} from Postgres...")
    await db.execute(delete(KnowledgeBaseEmbedding).where(KnowledgeBaseEmbedding.knowledge_id == kb_metadata_id))
    
    logger.info(f"Deleting chunks for KB ID {kb_metadata_id} from Redis...")
    await delete_from_redis_by_prefix(f"kb:{kb_metadata_id}:")
    
    await db.commit()
    logger.info(f"Successfully deleted chunks for KB ID {kb_metadata_id}")
