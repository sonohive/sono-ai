import io
import requests
from typing import List
from bs4 import BeautifulSoup
from pypdf import PdfReader
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

class DocumentParser:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 150):
        """
        Initialize the DocumentParser with chunking configuration.
        We use a slightly overlapping chunk window to retain context across boundaries.
        """
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
    
    def chunk_text(self, text: str, metadata: dict = None) -> List[Document]:
        """
        Takes raw text and splits it into LangChain Document chunks.
        """
        metadata = metadata or {}
        # Ensure we don't have empty strings
        if not text or not text.strip():
            return []
            
        docs = self.text_splitter.create_documents([text], metadatas=[metadata])
        return docs
    
    def parse_pdf_bytes(self, pdf_bytes: bytes, metadata: dict = None) -> List[Document]:
        """
        Parse a PDF from a byte stream and return chunked documents.
        This is useful for parsing uploaded files before they hit object storage.
        """
        metadata = metadata or {}
        pdf_file_obj = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file_obj)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
                
        return self.chunk_text(extracted_text, metadata)

    def parse_url(self, url: str, metadata: dict = None) -> List[Document]:
        """
        Fetch HTML from a URL, strip tags, extract text, and return chunked documents.
        """
        metadata = metadata or {}
        metadata["source"] = url
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script_or_style in soup(['script', 'style']):
                script_or_style.extract()
                
            text = soup.get_text(separator=' ')
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return self.chunk_text(text, metadata)
            
        except Exception as e:
            print(f"Error parsing URL {url}: {e}")
            return []
