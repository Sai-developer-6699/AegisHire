import re

files_to_check = ['database.txt', 'Tables for job_creation.txt']

for fn in files_to_check:
    import os
    if os.path.exists(fn):
        print(f"=== File: {fn} ===")
        with open(fn, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Simple extraction of CREATE TABLE blocks
        matches = re.finditer(r'CREATE TABLE\s+(\w+)\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE)
        for m in matches:
            print(f"Table: {m.group(1)}")
            # print(m.group(0))
            # print("-" * 40)
        
        # Also just print raw table lists if any
        tables = re.findall(r'TABLE NAME\s*-\s*(\w+)', content, re.IGNORECASE)
        if tables:
            print(f"Table Names listed: {tables}")
