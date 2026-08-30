import os
import re

replacements = [
    (r'bg-gray-900(?![/\w-])', 'bg-primary-bg'),
    (r'bg-gray-800(?![/\w-])', 'bg-secondary-bg'),
    (r'text-gray-300(?![/\w-])', 'text-secondary-text'),
    (r'text-gray-400(?![/\w-])', 'text-secondary-text'),
    (r'border-gray-700(?![/\w-])', 'border-[var(--border-color)]'),
    (r'border-gray-600(?![/\w-])', 'border-[var(--border-color)]'),
    (r'bg-gray-700(?![/\w-])', 'bg-hover-bg-color0'),
    (r'text-gray-900(?![/\w-])', 'text-primary-text'),
    (r'bg-white(?![/\w-])', 'bg-primary-bg'),
]

# Specifically look in the components/activity directory
activity_dir = 'frontend/src/components/activity'

for root, _, files in os.walk(activity_dir):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

