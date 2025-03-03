import * as vscode from 'vscode';

export function countHexBytes(text: string): number {
    // Remove C/C++ style comments while preserving string literals
    text = text.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1|\/\*[\s\S]*?\*\/|\/\/.*/gm, (match, quote) =>
        quote ? match : ' ' // Preserve strings, replace comments with a space
    );

    // Normalize separators (preserve spacing to avoid merging hex bytes)
    const normalizedText = text
        .replace(/[,\r\n]+/g, ' ')  // Replace commas and newlines with a space
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim();

    if (!normalizedText) return 0;

    // Handle a continuous hex string case (AAFF23 -> 3 bytes)
    if (/^[0-9a-fA-F]+$/.test(normalizedText) && normalizedText.length % 2 === 0) {
        return normalizedText.length / 2;
    }

    // Regex to match valid byte patterns: 0x1, 0xA, 0xAA, \x1, \xA, \xAA, or standalone 1, A, AA
    const bytePattern = /\b(?:0x|\\x)?([0-9a-fA-F]{1,2})\b/g;
    const matches = [...normalizedText.matchAll(bytePattern)];

    return matches.length; // Count valid byte occurrences
}



export function activate(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.tooltip = 'Selected Hex Bytes Count'; // Improved tooltip
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(updateByteCount)
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => updateByteCount())
    );

    updateByteCount(); // Initial update

    function updateByteCount() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBarItem.hide();
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            statusBarItem.hide();
            return;
        }

        const selectedText = editor.document.getText(selection);
        const byteCount = countHexBytes(selectedText);

        statusBarItem.text = `Bytes: ${byteCount} (0x${byteCount.toString(16).padStart(2, '0')})`; // Always set text
        statusBarItem.show(); // Always show if updateByte

        }
    }