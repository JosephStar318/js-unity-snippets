const vscode = require('vscode');
const UnityRenameProvider = require('./UnityRenameProvider');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "js-unity-snippets" is now active!');

	const disposable = vscode.commands.registerCommand('js-unity-snippets.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from unity-snippets!');
	});

	context.subscriptions.push(disposable);

	// Register the Unity rename provider
	const renameProvider = vscode.languages.registerRenameProvider(
		{ scheme: 'file', language: 'csharp' },
		new UnityRenameProvider(context)
	);
	console.log('Unity Rename Provider registered');

	context.subscriptions.push(renameProvider);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}