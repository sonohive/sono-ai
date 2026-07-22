import os
from typing import AsyncIterable
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Redis
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain.chains.history_aware_retriever import create_history_aware_retriever
from langchain_core.runnables.history import RunnableWithMessageHistory

from core.config import settings
from services.agent_memory import get_chat_history

class RAGService:
    def __init__(self, index_name: str = "sonoai_index"):
        # Setup Embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Setup Vector Store
        self.vector_store = Redis(
            redis_url=settings.REDIS_URL,
            index_name=index_name,
            embedding=self.embeddings,
            key_prefix="sonoai:vss:guideline:"
        )
        
        # Setup LLM
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=settings.OPENAI_API_KEY,
            streaming=True
        )

        self._setup_chains()

    def _setup_chains(self):
        # 1. History Aware Retriever
        # Prompt to rephrase the question using chat history
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", "Given a chat history and the latest user question "
                       "which might reference context in the chat history, formulate a standalone question "
                       "which can be understood without the chat history. Do NOT answer the question, "
                       "just reformulate it if needed and otherwise return it as is."),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        
        # Create retriever from vector store
        retriever = self.vector_store.as_retriever(
            search_kwargs={"k": 5}
        )
        
        history_aware_retriever = create_history_aware_retriever(
            self.llm, retriever, contextualize_q_prompt
        )
        
        # 2. Answer Question Chain
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an educational AI assistant for the ultrasound and sonography niche. "
                       "Use the following pieces of retrieved context to answer the question. "
                       "If you don't know the answer, just say that you don't know. "
                       "Use clear, educational, and professional language.\n\n"
                       "Context:\n{context}"),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        
        # 3. Retrieval Chain
        self.rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
        
        # 4. Add Memory
        self.conversational_rag_chain = RunnableWithMessageHistory(
            self.rag_chain,
            get_chat_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )

    async def stream_chat(self, message: str, session_id: str) -> AsyncIterable[str]:
        """
        Streams the response from the LLM back to the client.
        """
        config = {"configurable": {"session_id": session_id}}
        
        # astream yields chunks of the final output dictionary
        async for chunk in self.conversational_rag_chain.astream(
            {"input": message},
            config=config,
        ):
            if "answer" in chunk:
                yield chunk["answer"]
