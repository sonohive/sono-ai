import os
from typing import AsyncIterable
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Redis
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.history_aware_retriever import create_history_aware_retriever
from langchain_core.runnables.history import RunnableWithMessageHistory

from core.config import settings
from services.agent_memory import get_chat_history

from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from sqlalchemy.future import select
from db.session import AsyncSessionLocal
from models.domain import KnowledgeBaseEmbedding

class PGVectorFallbackRetriever(BaseRetriever):
    embeddings: object

    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> list[Document]:
        raise NotImplementedError("This retriever only supports async operations.")

    async def _aget_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> list[Document]:
        # Generate embedding for the search query
        query_vector = await self.embeddings.aembed_query(query)
        async with AsyncSessionLocal() as db:
            # pgvector cosine distance operator is used for order_by
            result = await db.execute(
                select(KnowledgeBaseEmbedding)
                .order_by(KnowledgeBaseEmbedding.embedding.cosine_distance(query_vector))
                .limit(5)
            )
            docs = result.scalars().all()
            return [Document(page_content=doc.chunk_text, metadata={}) for doc in docs]

class RAGService:
    def __init__(self, index_name: str = "sonoai_index"):
        # Setup Embeddings
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Setup Vector Stores
        self.guideline_vector_store = Redis(
            redis_url=settings.REDIS_URL,
            index_name=index_name,
            embedding=self.embeddings,
            key_prefix="sonoai:vss:guideline:"
        )

        self.research_vector_store = Redis(
            redis_url=settings.REDIS_URL,
            index_name=index_name,
            embedding=self.embeddings,
            key_prefix="sonoai:vss:research:"
        )
        
        # Setup LLM
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=settings.OPENAI_API_KEY,
            streaming=True
        )

        self.chains = {}
        self._setup_chains()

    def _create_chain_for_store(self, vector_store):
        # 1. History Aware Retriever
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", "Given a chat history and the latest user question "
                       "which might reference context in the chat history, formulate a standalone question "
                       "which can be understood without the chat history. Do NOT answer the question, "
                       "just reformulate it if needed and otherwise return it as is."),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        redis_retriever = vector_store.as_retriever(
            search_kwargs={"k": 5}
        )
        
        pg_fallback = PGVectorFallbackRetriever(embeddings=self.embeddings)
        retriever = redis_retriever.with_fallbacks([pg_fallback])
        
        history_aware_retriever = create_history_aware_retriever(
            self.llm, retriever, contextualize_q_prompt
        )
        
        # 2. Answer Question Chain
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an educational AI assistant for the ultrasound and sonography niche. "
                       "{mode_instructions}\n\n"
                       "Use the following pieces of retrieved context to answer the question. "
                       "If you don't know the answer, just say that you don't know. "
                       "Use clear, educational, and professional language.\n\n"
                       "Context:\n{context}"),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        
        # 3. Retrieval Chain
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
        
        # 4. Add Memory
        return RunnableWithMessageHistory(
            rag_chain,
            get_chat_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )

    def _setup_chains(self):
        self.chains["guideline"] = self._create_chain_for_store(self.guideline_vector_store)
        self.chains["research"] = self._create_chain_for_store(self.research_vector_store)

    async def stream_chat(self, message: str, session_id: str, mode: str = "guideline") -> AsyncIterable[str]:
        """
        Streams the response from the LLM back to the client.
        """
        config = {"configurable": {"session_id": session_id}}
        
        mode_instructions = (
            "You are in GUIDELINE MODE. You must strictly adhere to established medical protocols and guidelines provided in the context. Format your response with clear, structured citations including the Country of the guideline."
            if mode == "guideline" else
            "You are in RESEARCH MODE. You should incorporate peer-reviewed evidence from the context. Acknowledge clinical uncertainty where appropriate, and provide a broader perspective on the topic."
        )

        # astream yields chunks of the final output dictionary
        selected_chain = self.chains.get(mode, self.chains["guideline"])
        async for chunk in selected_chain.astream(
            {"input": message, "mode_instructions": mode_instructions},
            config=config,
        ):
            if "answer" in chunk:
                yield chunk["answer"]
