// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { showColorQuickPick, ColorCode } from './color';
import { github } from './github';
import * as utils from './utils';


function getRootLocation(): string {
	let config = vscode.workspace.getConfiguration('vscode-projects');
	let r: string | undefined = config.get('projectsRootLocation');
	let root: string;
	if (r === undefined || r === "") {
		root = os.homedir();
	} else {
		root = r;
	}
	return root;
}

function getWSLocation(): string {
	let config = vscode.workspace.getConfiguration('vscode-projects');
	let d: string | undefined = config.get('workspaceFilesLocation');
	let dir: string;
	if (d === undefined || d === "") {
		dir = os.homedir + path.sep + 'ws';
	} else {
		dir = d;
	}
	return dir;
}

function openInThisWindow(filePath: string) {
	vscode.commands.executeCommand(
		"vscode.openFolder",
		vscode.Uri.file(filePath),
		false);
}

function getLocalProject(repo: github.Repo) {
	// Check for obvious local checkouts
	let localCheckout: string | null = null;
	console.log("Checking for local checkout...");
	fs.readdirSync(getRootLocation(), { withFileTypes: true })
		.filter((x: fs.Dirent) => x.isDirectory())
		.filter((x: fs.Dirent) => !x.name.startsWith("."))
		.forEach((dir: fs.Dirent) => {
			try {
				let config = fs.readFileSync([getRootLocation(), dir.name, '.git', 'config'].join(), 'utf8');
				if (config.indexOf(repo.ssh_url) >= 0) {
					// This is a copy of that repo
					localCheckout = getRootLocation() + dir.name;
				}
			} catch (error) {
				// Ignore... The file simply doesn't exist. That's expected.
			}
		});

	// Couldn't see a local checkout of the repo. So will clone a new one.
	if (localCheckout === null) {
		console.log("None found, cloning...");
		localCheckout = github.clone(repo, getRootLocation());
	}

	if (localCheckout === null) {
		vscode.window.showErrorMessage("Failed to establish local instance of the project");
		console.error("Failed to get a local copy of the repo.");
		return;
	}

	// @@@ - Run any setup for the repo (e.g. requirements.txt)

	// Have the user pick the color theme for the project
	showColorQuickPick((color: ColorCode) => {
		// Create and then open the .code-workspace file
		let codeWsFile: string = [getWSLocation(), repo.name + '.code-workspace'].join(path.sep);
		let codeWsContent: { [key: string]: any } = {
			"folders": [
				{
					"path": localCheckout
				},
			],
			"settings": {
				"window.title": "[" + repo.name + "] ${dirty} ${activeEditorMedium}${separator}${rootName}",
				"workbench.colorCustomizations": {
					"titleBar.activeBackground": color.activeBackground,
					"titleBar.activeForeground": color.activeForeground,
					"titleBar.border": color.borderColor,
					"titleBar.inactiveBackground": color.inactiveBackground,
					"titleBar.inactiveForeground": color.inactiveForeground,
				}
			}
		};
		if (!fs.existsSync(getWSLocation())) {
			fs.mkdirSync(getWSLocation());
		}
		fs.writeFile(codeWsFile, JSON.stringify(codeWsContent),
			() => { openInThisWindow(codeWsFile); }
		);
	});
}

function selectProject() {
	let promise: Promise<Array<github.Repo>> = new Promise((resolve, _) => { resolve([]); });

	// @@@ - TODO: Handle case of one of these failing
	github.getAPIs().forEach((host: string) => {
		promise = promise.then((current: Array<github.Repo>) => {
			return github.getRepos(host, current);
		});
	});

	promise.then((reposArray: Array<github.Repo>) => {
		let repos: Map<string, github.Repo> = new Map();
		reposArray.forEach((repo: github.Repo) => {
			repos.set(repo.full_name, repo);
		});

		// Display a QuickPick for the user to choose the project
		utils.quickPickFromMap(repos, (repo) => {
			// Find the code-workspace file for the repo.
			// If it doesn't exist try and create a new one by cloning the project
			// Otherwise just open the exising one
			let codeWsPath: string = [getWSLocation(), repo.name + '.code-workspace'].join(path.sep);
			fs.access(codeWsPath, fs.constants.F_OK, (err: any) => {
				if (err) {
					getLocalProject(repo);
				} else {
					openInThisWindow(codeWsPath);
				}
			});
		});
	});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-projects.selectproject', selectProject);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }