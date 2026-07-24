import asyncio
import os
import sys
import json
from dotenv import load_dotenv

sys.path.append('c:/Users/HP/Desktop/sono-ai/backend')
load_dotenv('c:/Users/HP/Desktop/sono-ai/backend/.env')

from db.session import get_db
from models.domain import Topic, KnowledgeBaseMetadata
from sqlalchemy.future import select
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

async def auto_map():
    db_gen = get_db()
    db = await anext(db_gen)
    try:
        # Get all topics
        topics = (await db.execute(select(Topic))).scalars().all()
        # Get unmapped KB items
        kb_items = (await db.execute(select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.topic_id == None))).scalars().all()
        
        if not kb_items:
            print("All KB items are already mapped!")
            return
            
        print(f"Found {len(topics)} topics and {len(kb_items)} unmapped KB items. Starting AI mapping...")

        topic_list = [{"id": str(t.id), "name": t.name} for t in topics]
        
        llm = ChatOpenAI(temperature=0, model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        
        batch_size = 50
        mapped_count = 0
        
        for i in range(0, len(kb_items), batch_size):
            batch = kb_items[i:i+batch_size]
            items_to_map = [{"kb_id": str(kb.id), "source_name": kb.source_name, "description": kb.description} for kb in batch]
            
            prompt = f"""
            You are an expert medical data classifier. 
            Given the following list of topics:
            {json.dumps(topic_list, indent=2)}
            
            Classify each of the following Knowledge Base items into exactly one topic ID from the list. If you are unsure, pick the closest one based on the source_name or description.
            If it's about radiologists/radiography general guidelines, map it to the ID for 'Sonography Profession' or 'Reporting' or 'Instrumentation'.
            
            Items to classify:
            {json.dumps(items_to_map, indent=2)}
            
            Return ONLY a JSON array of objects with keys 'kb_id' and 'topic_id'. Do NOT include markdown code blocks, just raw JSON.
            """
            
            try:
                print(f"Mapping batch {i//batch_size + 1}...")
                res = await llm.ainvoke([HumanMessage(content=prompt)])
                response_text = res.content.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:-3]
                elif response_text.startswith("```"):
                    response_text = response_text[3:-3]
                    
                mappings = json.loads(response_text)
                mapping_dict = {m['kb_id']: m['topic_id'] for m in mappings}
                
                for kb in batch:
                    if str(kb.id) in mapping_dict:
                        t_id = mapping_dict[str(kb.id)]
                        if t_id:
                            kb.topic_id = t_id
                            mapped_count += 1
                await db.commit()
            except Exception as e:
                print("Error mapping batch:", e)
                
        print(f"Successfully mapped {mapped_count} out of {len(kb_items)} items!")
        
    except Exception as e:
        print(f"Critical Error: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(auto_map())
