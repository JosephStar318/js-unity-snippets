const vscode = require('vscode');
const UnityRenameProvider = require('./UnityRenameProvider');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Extension "js-unity-snippets" is now active!');

	// // Register the Unity rename provider
	// const renameProvider = vscode.languages.registerRenameProvider(
	// 	{ scheme: 'file', language: 'csharp' },
	// 	new UnityRenameProvider(context)
	// );
	// context.subscriptions.push(renameProvider);

	vscode.commands.registerCommand('unityAwareRename', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const document = editor.document;
		const position = editor.selection.active;
		const provider = new UnityRenameProvider(context);
		provider.prepareRename(document, position);
		await vscode.commands.executeCommand('editor.action.rename');
		const wordRange = document.getWordRangeAtPosition(position);
		const currentName = wordRange ? document.getText(wordRange) : '';
		const newName = await vscode.window.showInputBox({ prompt: 'Also change serialized field names to', value: currentName });
		if (!newName || newName === currentName) return;
		const edit = await provider.provideRenameEdits(document, position, newName);
		if (edit) {
			await vscode.workspace.applyEdit(edit);
			await document.save();
		}
	});
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}