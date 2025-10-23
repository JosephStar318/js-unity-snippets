import sys
import os
import re
import yaml

def get_script_guid(script_path):
    meta_path = script_path + ".meta"
    with open(meta_path, 'r') as f:
        meta_content = yaml.safe_load(f)
        return meta_content.get('guid')

def replace_field_in_assets(script_path, old_field, new_field):
    script_guid = get_script_guid(script_path)
    
    if not script_guid:
        print(f"Error: Could not find GUID for {script_path}", file=sys.stderr)
        sys.exit(1)
    
    # Find project root (where Assets folder is)
    current = os.path.dirname(script_path)
    while current and not os.path.exists(os.path.join(current, 'Assets')):
        parent = os.path.dirname(current)
        if parent == current:  # Reached root
            break
        current = parent
    
    assets_dir = os.path.join(current, 'Assets')
    modified_count = 0
    
    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            if file.endswith('.asset'):
                asset_path = os.path.join(root, file)
                
                with open(asset_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if f"guid: {script_guid}" in content:
                    new_content = re.sub(
                        rf'^(\s*){re.escape(old_field)}:',
                        rf'\1{new_field}:',
                        content,
                        flags=re.MULTILINE
                    )
                    
                    if new_content != content:
                        with open(asset_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"✓ {asset_path}")
                        modified_count += 1
    
    print(f"\n✓ Modified {modified_count} asset(s)")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python rename_field.py <script_path> <old_field> <new_field>")
        sys.exit(1)
    
    script_path = sys.argv[1]
    old_field = sys.argv[2]
    new_field = sys.argv[3]
    
    replace_field_in_assets(script_path, old_field, new_field)