import os

def find_sql_file():
    target = "sononwoc_ai (1).sql"
    desktop = os.path.expanduser("~/Desktop")
    downloads = os.path.expanduser("~/Downloads")
    
    for folder in [desktop, downloads, "C:\\xampp\\htdocs\\plugin-dev", "C:\\Users\\HP\\Desktop\\sono-ai"]:
        if os.path.exists(folder):
            for root, dirs, files in os.walk(folder):
                if target in files:
                    print(f"Found at: {os.path.join(root, target)}")
                    return
    print("Not found.")

if __name__ == "__main__":
    find_sql_file()
