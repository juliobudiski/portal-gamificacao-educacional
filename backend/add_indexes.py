with open('app/models.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'db.ForeignKey(' in line and 'db.Column' in line and 'index=True' not in line:
        if 'nullable=' in line:
            line = line.replace('nullable=', 'index=True, nullable=')
        else:
            # Replaces the last closing parenthesis with ', index=True)'
            parts = line.rsplit(')', 1)
            line = parts[0] + ', index=True)' + parts[1]
    new_lines.append(line)

with open('app/models.py', 'w') as f:
    f.writelines(new_lines)
print("Indexes added successfully.")
