import re

with open('recruitment/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find all `@require_role([...])` and the following function name
matches = re.finditer(r'@require_role\(\[([\d,\s]+)\]\)\s*def\s+(\w+)', content)
print("=== Role requirement decorators ===")
for m in matches:
    roles = m.group(1)
    func = m.group(2)
    print(f"Function {func} requires roles: [{roles.strip()}]")

# Also search for manual checks like "role_id ==" or similar
print("\n=== Manual role checks in code ===")
lines = content.splitlines()
for idx, line in enumerate(lines):
    if 'role_id ==' in line or 'roleid ==' in line or 'role_id in' in line:
        print(f"Line {idx+1}: {line.strip()}")
