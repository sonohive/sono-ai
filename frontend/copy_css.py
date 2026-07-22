import shutil
import os

os.makedirs(r'c:\Users\HP\Desktop\sono-ai\frontend\src\styles', exist_ok=True)
shutil.copy(r'C:\xampp\htdocs\plugin-dev\wp-content\plugins\sonoai\assets\css\landing.css', r'c:\Users\HP\Desktop\sono-ai\frontend\src\styles\landing.css')
shutil.copy(r'C:\xampp\htdocs\plugin-dev\wp-content\plugins\sonoai\assets\css\chat.css', r'c:\Users\HP\Desktop\sono-ai\frontend\src\styles\chat.css')
print("Copy completed")
