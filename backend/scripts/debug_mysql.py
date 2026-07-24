import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='sononwoc_ai',
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cursor:
    cursor.execute("SELECT knowledge_id, source_title, raw_content, type FROM sa_sonoai_kb_items WHERE type='txt' LIMIT 5")
    rows = cursor.fetchall()
    print("KB_ITEMS txt records:")
    for row in rows:
        print({
            "knowledge_id": row["knowledge_id"],
            "source_title": row["source_title"],
            "raw_content_len": len(row["raw_content"]) if row["raw_content"] else 0
        })
        
    print("\nEmbeddings for the first item:")
    if rows:
        kid = rows[0]["knowledge_id"]
        cursor.execute("SELECT id, chunk_index, chunk_text FROM sa_sonoai_embeddings WHERE knowledge_id=%s", (kid,))
        erows = cursor.fetchall()
        for erow in erows:
            print({
                "id": erow["id"],
                "chunk_index": erow["chunk_index"],
                "chunk_text_len": len(erow["chunk_text"]) if erow["chunk_text"] else 0
            })
