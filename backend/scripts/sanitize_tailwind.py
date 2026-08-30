import os
import re

FRONTEND_DIR = '../../frontend/src'

REPLACEMENTS = [
    # Redundâncias
    (r'\btext-primary-text\s+dark:text-primary-text\b', 'text-primary-text'),
    (r'\btext-secondary-text\s+dark:text-secondary-text\b', 'text-secondary-text'),
    (r'\bbg-primary-bg\s+dark:bg-primary-bg\b', 'bg-primary-bg'),
    (r'\bbg-secondary-bg\s+dark:bg-secondary-bg\b', 'bg-secondary-bg'),
    (r'\bborder-border-color\s+dark:border-gray-\d+\b', 'border-border-color'),

    # Fundos
    (r'\bbg-white\s+dark:bg-gray-[789]00\b', 'bg-secondary-bg'),
    (r'\bbg-gray-50\s+dark:bg-gray-900\b', 'bg-primary-bg'),
    (r'\bbg-gray-100\s+dark:bg-gray-[89]00\b', 'bg-secondary-bg'),

    # Textos
    (r'\btext-gray-900\s+dark:text-white\b', 'text-primary-text'),
    (r'\btext-gray-800\s+dark:text-white\b', 'text-primary-text'),
    (r'\btext-gray-[567]00\s+dark:text-gray-[34]00\b', 'text-secondary-text'),
    (r'\btext-gray-[678]00\s+dark:text-gray-[345]00\b', 'text-secondary-text'),
    (r'\btext-gray-600\s+dark:text-gray-400\b', 'text-secondary-text'),

    # Bordas
    (r'\bborder-gray-[234]00\s+dark:border-gray-[678]00\b', 'border-border-color'),
    (r'\bborder-gray-[12]00\s+dark:border-gray-700\b', 'border-border-color'),
]

# Casos em que a ordem pode estar invertida (dark: class primeiro)
REPLACEMENTS_REVERSE = [
    (r'\bdark:bg-gray-[789]00\s+bg-white\b', 'bg-secondary-bg'),
    (r'\bdark:bg-gray-900\s+bg-gray-50\b', 'bg-primary-bg'),
    (r'\bdark:bg-gray-[89]00\s+bg-gray-100\b', 'bg-secondary-bg'),
    (r'\bdark:text-white\s+text-gray-[89]00\b', 'text-primary-text'),
    (r'\bdark:text-gray-[345]00\s+text-gray-[5678]00\b', 'text-secondary-text'),
    (r'\bdark:border-gray-[678]00\s+border-gray-[1234]00\b', 'border-border-color'),
]

ALL_REPLACEMENTS = REPLACEMENTS + REPLACEMENTS_REVERSE

def sanitize_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for pattern, replacement in ALL_REPLACEMENTS:
        new_content = re.sub(pattern, replacement, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    changed_files = 0
    for root, dirs, files in os.walk(FRONTEND_DIR):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.tsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                if sanitize_file(filepath):
                    print(f"Sanitized: {filepath}")
                    changed_files += 1

    print(f"Done. Sanitized {changed_files} files.")

if __name__ == '__main__':
    main()
