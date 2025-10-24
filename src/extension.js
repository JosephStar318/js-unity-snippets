const vscode = require('vscode');
const UnityRenameProvider = require('./UnityRenameProvider');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Extension "js-unity-snippets" is now active!');
	vscode.commands.registerCommand('unityAwareRename', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			await vscode.commands.executeCommand('editor.action.rename');
			return;
		}
		const document = editor.document;
		const position = editor.selection.active;
		const provider = new UnityRenameProvider(context);
		if (!provider.prepareRename(document, position)) {
			console.log("Exiting... File was not a scriptable object")
			await vscode.commands.executeCommand('editor.action.rename');
			return;
		}
		const wordRange = document.getWordRangeAtPosition(position);
		const currentName = wordRange ? document.getText(wordRange) : '';
		await vscode.commands.executeCommand('editor.action.rename');
		await new Promise(resolve => setTimeout(resolve, 100));

		const newRange = document.getWordRangeAtPosition(position);
		var changedText = document.getText(newRange);
		if (changedText !== currentName) {
			const newName = await vscode.window.showInputBox({ prompt: 'Also change serialized field names to', value: changedText });
			if (!newName || newName === currentName) {
				console.log("Exitting... Given name was not valid or the same")
				return;
			}
			const edit = provider.provideRenameEdits(document.uri.fsPath, currentName, newName);
			if (edit) {
				await vscode.workspace.applyEdit(edit);
				await document.save();
			}
		}
	});
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}