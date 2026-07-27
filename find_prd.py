import json

path = r'C:\Users\HP PC\.gemini\antigravity\brain\541429c5-8849-4553-9d94-d60749fba0b2\.system_generated\logs\transcript_full.jsonl'
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            content = data.get('content', '')
            if 'PRD' in content or 'Super Admin' in content or 'super admin' in content:
                print(f"--- MSG at {data.get('created_at')} ---")
                print(content[:500] + ('...' if len(content) > 500 else ''))
