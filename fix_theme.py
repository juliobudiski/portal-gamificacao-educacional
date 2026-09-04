import os
import re

files = [
    "frontend/src/pages/NarrativeEditorPage.jsx",
    "frontend/src/pages/QuizEditorPage.jsx",
    "frontend/src/pages/LearningContentEditorPage.jsx"
]

replacements = {
    r'\bbg-gray-900\b(?!/)': 'bg-gray-50 dark:bg-gray-900',
    r'\btext-gray-200\b': 'text-gray-800 dark:text-gray-200',
    r'\bbg-black/40\b': 'bg-white/80 dark:bg-black/40',
    r'\bbg-black/30\b': 'bg-white/80 dark:bg-black/30',
    r'\bbg-black/50\b': 'bg-gray-100 dark:bg-black/50',
    r'\bbg-black/60\b': 'bg-white dark:bg-black/60',
    r'\bbg-gray-900/60\b': 'bg-white dark:bg-gray-900/60',
    r'\bbg-gray-900/50\b': 'bg-gray-100 dark:bg-gray-900/50',
    r'\bbg-gray-900/70\b': 'bg-gray-50 dark:bg-gray-900/70',
    r'\bborder-white/10\b': 'border-gray-300 dark:border-white/10',
    r'\bborder-white/5\b': 'border-gray-200 dark:border-white/5',
    r'\btext-white\b': 'text-gray-900 dark:text-white',
    r'\bplaceholder-gray-600\b': 'placeholder-gray-400 dark:placeholder-gray-600',
    r'\bplaceholder-gray-500\b': 'placeholder-gray-400 dark:placeholder-gray-500',
    r'\btext-gray-300\b': 'text-gray-700 dark:text-gray-300',
    r'\bbg-gray-800\b(?!/)': 'bg-gray-200 dark:bg-gray-800',
}

for filepath in files:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    for pattern, replacement in replacements.items():
        # Avoid double replacing if it's already there
        if "dark:" + pattern.replace(r'\b', '').replace('(?!/)', '') in content:
            continue
        content = re.sub(pattern, replacement, content)
        
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

