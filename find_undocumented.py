import os

def check_documentation(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    if filepath.endswith('.py'):
        # simple check: is there a docstring """ or '''
        if '"""' in content or "'''" in content:
            return True
        # or are there a decent amount of # comments?
        lines = content.splitlines()
        comment_lines = sum(1 for line in lines if line.strip().startswith('#'))
        if comment_lines > len(lines) * 0.05: # at least 5% comments
            return True
        return False
        
    elif filepath.endswith('.js') or filepath.endswith('.jsx'):
        if '/**' in content or '/*' in content:
            return True
        lines = content.splitlines()
        comment_lines = sum(1 for line in lines if line.strip().startswith('//'))
        if comment_lines > len(lines) * 0.05:
            return True
        return False
    return True

undocumented = []

for root_dir in ['backend/app', 'frontend/src']:
    for dirpath, _, filenames in os.walk(root_dir):
        # skip tests or cache
        if '__pycache__' in dirpath or 'tests' in dirpath:
            continue
        for filename in filenames:
            if filename.endswith('.py') or filename.endswith('.js') or filename.endswith('.jsx'):
                filepath = os.path.join(dirpath, filename)
                if not check_documentation(filepath):
                    undocumented.append(filepath)

print("Arquivos possivelmente sem comentários ou docstrings:")
for p in undocumented:
    print(p)
