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
                
                # Read binary first to avoid UnicodeDecodeError on non-text assets
                with open(asset_path, 'rb') as bf:
                    raw = bf.read()
                
                # Quick binary check for the script GUID; skip file if GUID not present
                guid_bytes = f"guid: {script_guid}".encode('utf-8', errors='ignore')
                if guid_bytes not in raw:
                    continue
                
                # Try decoding to text; fallback to latin-1 if utf-8 fails
                enc = 'utf-8'
                try:
                    content = raw.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        content = raw.decode('latin-1')
                        enc = 'latin-1'
                    except Exception:
                        print(f"Skipping binary asset (undecodable): {asset_path}", file=sys.stderr)
                        continue
                
                new_content = re.sub(
                    rf'^(\s*){re.escape(old_field)}:',
                    rf'\1{new_field}:',
                    content,
                    flags=re.MULTILINE
                )
                    
                if new_content != content:
                    # Write back using the same encoding we decoded with
                    with open(asset_path, 'wb') as wf:
                        wf.write(new_content.encode(enc))
                    safe_print(f"\u2713 {asset_path}")
                    modified_count += 1
    
    safe_print(f"\n\u2713 Modified {modified_count} asset(s)")

def safe_print(s, file=sys.stdout):
    """
    Print s to file using the file.encoding, replacing characters that can't be encoded.
    Avoids UnicodeEncodeError on Windows consoles that use a single-byte codepage.
    """
    enc = getattr(file, 'encoding', None) or 'utf-8'
    try:
        # try printing directly
        print(s, file=file)
    except UnicodeEncodeError:
        # replace unencodable chars and print
        safe = s.encode(enc, errors='replace').decode(enc, errors='replace')
        print(safe, file=file)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python rename_field.py <script_path> <old_field> <new_field>")
        sys.exit(1)
    
    script_path = sys.argv[1]
    old_field = sys.argv[2]
    new_field = sys.argv[3]
    
    replace_field_in_assets(script_path, old_field, new_field)