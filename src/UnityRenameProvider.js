const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

let pendingRename = null;

class UnityRenameProvider {
    constructor(context) {
        this.context = context;
    }
   
    prepareRename(document, position, _token) {
        console.log('=== Preparing Rename ===');
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

        // Store the old name for later
        pendingRename = {
            oldName,
            scriptPath: document.uri.fsPath
        };

        return range;
    }

    provideRenameEdits(document, position, newName, _token) {
        if (pendingRename) {
            setTimeout(() => {
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

    updateUnityAssets(scriptPath, oldName, newName) {
        const pythonScript = path.join(this.context.extensionPath, '/src/rename_field.py');
        console.log('Rename script running for: '+ oldName + " -> " + newName);

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