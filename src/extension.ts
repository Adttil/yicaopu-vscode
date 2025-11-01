import * as vscode from 'vscode';
import * as path from 'path';
import { buffer } from 'stream/consumers';

let yicaopu_path: string;

export function activate(context: vscode.ExtensionContext) {
    yicaopu_path = path.join(context.extensionPath, 'tool', "yicaopu.exe");

	const disposables = [
        vscode.commands.registerCommand('yicaopu.toMidi', convertToMidi),
        vscode.commands.registerCommand('yicaopu.play', play),
        vscode.commands.registerCommand('yicaopu.playSelection', playSelection)
    ];

	context.subscriptions.push(...disposables);
}

export function deactivate() {}

async function convertToMidi(uri?: vscode.Uri): Promise<void>
{
	const editor = vscode.window.activeTextEditor;
	const filePath = editor?.document.fileName as string;

    const args = [filePath, filePath.slice(0, filePath.length - 4) + '.mid'];
	const task = createTask(args, `to midi: ${filePath}`);
    
    const execution = await vscode.tasks.executeTask(task);
    
    const taskEndPromise = new Promise<void>((resolve) => {
        const disposable = vscode.tasks.onDidEndTask((e) => {
            if (e.execution === execution) {
                disposable.dispose();
                resolve();
            }
        });
    });

    await taskEndPromise;
}

async function play(uri?: vscode.Uri): Promise<void>
{
	const editor = vscode.window.activeTextEditor;
	const filePath = editor?.document.fileName as string;

    const temp_path = filePath.slice(0, filePath.length - 4) + '.temp.mid';
    const args = [filePath, temp_path, 'path'];
	const task = createTask(args, `play: ${filePath}`);
    
    const execution = await vscode.tasks.executeTask(task);
    
    const taskEndPromise = new Promise<void>((resolve) => {
        const disposable = vscode.tasks.onDidEndTask((e) => {
            if (e.execution === execution) {
                disposable.dispose();
                resolve();
            }
        });
    });

    await taskEndPromise;
}

async function playSelection(uri?: vscode.Uri): Promise<void>
{
	const editor = vscode.window.activeTextEditor as vscode.TextEditor;
    
    const doc = editor.document;
    const start = doc.offsetAt(editor.selection.start);
    
    const select = doc.getText(editor.selection);
    const before = doc.getText().substring(0, start);

	const filePath = editor?.document.fileName as string;

    const temp_path = filePath.slice(0, filePath.length - 4) + '.temp.mid';
    const args = [filePath,`${Buffer.byteLength(before, 'utf8')}`, `${Buffer.byteLength(select, 'utf8')}`, temp_path];
	const task = createTask(args, `play selection`);
    
    const execution = await vscode.tasks.executeTask(task);
    
    const taskEndPromise = new Promise<void>((resolve) => {
        const disposable = vscode.tasks.onDidEndTask((e) => {
            if (e.execution === execution) {
                disposable.dispose();
                resolve();
            }
        });
    });

    await taskEndPromise;
}

function createTask(args: string[], taskName: string): vscode.Task {    
    const taskExecution = new vscode.ProcessExecution(
        yicaopu_path,
        args
    );

    const task = new vscode.Task(
    	{ type: 'process' },
        vscode.TaskScope.Workspace,
        taskName,
        'YiCaoPu',
        taskExecution
    );

    task.presentationOptions = {
        echo: true,
        reveal: vscode.TaskRevealKind.Always,
        focus: false,
        panel: vscode.TaskPanelKind.Shared,
        showReuseMessage: true,
        clear: false
    };

    return task;
}
