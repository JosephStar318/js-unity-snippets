const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

module.exports = async function createInheritedClass(uri) {
    if (!uri || uri.scheme !== "file") return;

    const sourcePath = uri.fsPath;
    const sourceDir = path.dirname(sourcePath);
    const sourceText = fs.readFileSync(sourcePath, "utf8");

    const baseClassName = extractClassName(sourceText);
    if (!baseClassName) {
        vscode.window.showErrorMessage("No class found in file.");
        return;
    }

    const namespace = extractNamespace(sourceText);

    // 🔹 Prompt user for derived class name
    const derivedClassName = await vscode.window.showInputBox({
        title: "Create Inherited Class",
        prompt: "Derived class name",
        value: `${baseClassName}Derived`,
        validateInput: (value) => {
            if (!value) return "Class name cannot be empty";
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
                return "Invalid C# class name";
            }
            return null;
        }
    });

    if (!derivedClassName) return; // user cancelled

    const targetPath = path.join(sourceDir, `${derivedClassName}.cs`);

    if (fs.existsSync(targetPath)) {
        vscode.window.showErrorMessage("A file with this name already exists.");
        return;
    }

    const content = generateClassFile(
        derivedClassName,
        baseClassName,
        namespace
    );

    fs.writeFileSync(targetPath, content, "utf8");

    const doc = await vscode.workspace.openTextDocument(targetPath);
    vscode.window.showTextDocument(doc);
};

/* =======================
   Helpers
   ======================= */

function extractClassName(text) {
    const match = text.match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1] : null;
}

function extractNamespace(text) {
    let match = text.match(/\bnamespace\s+([A-Za-z0-9_.]+)\s*\{/);
    if (match) return match[1];

    match = text.match(/\bnamespace\s+([A-Za-z0-9_.]+)\s*;/);
    if (match) return match[1];

    return null;
}

function generateClassFile(derived, base, namespace) {
    if (namespace) {
        return `namespace ${namespace}
{
    public class ${derived} : ${base}
    {
    }
}
`;
    }

    return `public class ${derived} : ${base}
{
}
`;
}
