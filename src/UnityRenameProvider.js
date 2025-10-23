const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

let pendingRename = null;

class UnityRenameProvider {
    constructor(context) {
        this.context = context;
        console.log('UnityRenameProvider constructor called');
    }
    
    prepareRename(document, position, _token) {
        console.log('=== prepareRename called ===');
        console.log('Document:', document.fileName);
        console.log('Position:', position.line, position.character);
        // Check if this is a Unity ScriptableObject
        const text = document.getText();
        if (!text.includes('ScriptableObject')) {
            return null; // Let default rename handle it
        }

        // Get the symbol at position
        const range = document.getWordRangeAtPosition(position);
        const oldName = document.getText(range);
        
        // Check if it's a serialized field
        if (!this.isSerializedField(document, position)) {
            return null;
        }

        // Store the old name for later
        pendingRename = {
            oldName,
            scriptPath: document.uri.fsPath
        };

        return range;
    }

    provideRenameEdits(document, position, newName, _token) {
        console.log('rename edits request');
        // Let VSCode handle the C# rename first
        // We'll run our script after
        if (pendingRename) {
            console.log('rename edits request 2');
            
            // Schedule the Unity asset update
            setTimeout(() => {
                console.log('rename edits request 3');
                this.updateUnityAssets(
                    pendingRename.scriptPath,
                    pendingRename.oldName,
                    newName
                );
                pendingRename = null;
            }, 1000); // Wait for VSCode to finish
        }

        return null; // Let default rename happen
    }

    isSerializedField(document, position) {
        // Check if the field has [SerializeField] or is public
        const line = position.line;
        let checkLine = line;
        
        // Look backwards for attributes
        while (checkLine > 0) {
            const lineText = document.lineAt(checkLine).text.trim();
            if (lineText.includes('[SerializeField]')) return true;
            if (lineText.includes('public') && lineText.includes(document.getText(document.getWordRangeAtPosition(position)))) {
                return true;
            }
            if (lineText.includes('private') || lineText.includes('class')) break;
            checkLine--;
        }
        
        return false;
    }

    updateUnityAssets(scriptPath, oldName, newName) {
        vscode.window.showInformationMessage("started working")
        const pythonScript = path.join(this.context.extensionPath, 'rename_field.py');

        const python = spawn('python', [pythonScript, scriptPath, oldName, newName]);

        python.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        python.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        python.on('close', (code) => {
            if (code === 0) {
                vscode.window.showInformationMessage(
                    `✓ Updated Unity assets for field rename: ${oldName} → ${newName}`
                );
            } else {
                vscode.window.showErrorMessage('Failed to update Unity assets');
            }
        });
    }
}

module.exports = UnityRenameProvider;