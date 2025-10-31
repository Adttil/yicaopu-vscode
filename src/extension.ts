import * as vscode from 'vscode';
import * as path from 'path';

let converter_path: string;

export function activate(context: vscode.ExtensionContext) {
    converter_path = path.join(context.extensionPath, 'tool', "yicaopu2midi.exe");

	const disposable = vscode.commands.registerCommand('yicaopu.toMidi', 
		async (uri?: vscode.Uri) => {
		try{ 
			await processFile(uri);
		}
		catch(error){}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

async function processFile(uri?: vscode.Uri): Promise<void>
{
	const editor = vscode.window.activeTextEditor;
	const filePath = editor?.document.fileName as string;
	await executeExternalProcessor([filePath], `process: ${filePath}`);
}

async function executeExternalProcessor(filePaths: string[], taskName: string): Promise<void> {

    const task = createTask(filePaths, taskName);
    
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

function createTask(filePaths: string[], taskName: string): vscode.Task {
    const args = [...filePaths];
    
    const taskExecution = new vscode.ProcessExecution(
        converter_path,
        args
    );

    const task = new vscode.Task(
    	{ type: 'process' },
        vscode.TaskScope.Workspace,
        taskName,
        'Yicaopu to Midi',
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
