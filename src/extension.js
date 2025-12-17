const createInheritedClass = require("./createInheritedClass");
const unityAwareRename = require("./unityAwareRename");

const vscode = require('vscode');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Extension "js-unity-snippets" is now active!');
	const disposable1 = vscode.commands.registerCommand('unityAwareRename', (uri) => unityAwareRename(uri, context));
	const disposable2 = vscode.commands.registerCommand("csTools.createInheritedClass", createInheritedClass);

	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}