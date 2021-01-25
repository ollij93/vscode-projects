// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';

interface GitHubRepo {
	name: string;
	ssh_url: string; // SSH URL
}

interface ColorCode {
	activeBackground: string,
	activeForeground: string,
	borderColor: string,
	inactiveBackground: string,
	inactiveForeground: string,
}

// @@@ - Make this a configurable location
const ROOT: string = '/home/olijohns/'
// @@@ - Put this elsewhere
let COLOR_CODES: Map<string, ColorCode> = new Map();
COLOR_CODES.set("Arizona Cardinals", {
	activeBackground: "#97233F",
	activeForeground: "#000000",
	borderColor: "#FFB612",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#97233F",
});
COLOR_CODES.set("Atlanta Falcons", {
	activeBackground: "#A71930",
	activeForeground: "#000000",
	borderColor: "#A5ACAF",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#A71930",
});
COLOR_CODES.set("Baltimore Ravens", {
	activeBackground: "#241773",
	activeForeground: "#000000",
	borderColor: "#9E7C0C",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#241773",
});
COLOR_CODES.set("Buffalo Bills", {
	activeBackground: "#00338D",
	activeForeground: "#FFFFFF",
	borderColor: "#C60C30",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#00338D",
});
COLOR_CODES.set("Carolina Panthers", {
	activeBackground: "#0085CA",
	activeForeground: "#000000",
	borderColor: "#BFC0BF",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#0085CA",
});


function cloneProject(repo: GitHubRepo): string | null {
	let checkout: string | null = ROOT + repo.name;

	// @@@ - TODO: Handle ssh issues
	try {
		cp.execSync('git clone ' + repo.ssh_url + ' ' + checkout);
	} catch (error) {
		// @@@
	}

	return checkout;
}

function getLocalProject(repo: GitHubRepo) {
	// Check for obvious local checkouts
	let local_checkout: string | null = null;
	fs.readdirSync(ROOT, { withFileTypes: true })
		.filter((x: fs.Dirent) => x.isDirectory())
		.filter((x: fs.Dirent) => !x.name.startsWith("."))
		.forEach((dir: fs.Dirent) => {
			try {
				let config = fs.readFileSync(ROOT + dir.name + '/.git/config', 'utf8');
				if (config.indexOf(repo.ssh_url) >= 0) {
					// This is a copy of that repo
					local_checkout = ROOT + dir.name;
				}
			} catch (error) {
				// Ignore... The file simply doesn't exist. That's expected.
			}
		}
		);

	// Couldn't see a local checkout of the repo. So will clone a new one.
	if (local_checkout === null) {
		local_checkout = cloneProject(repo);
	}

	if (local_checkout === null) {
		vscode.window.showErrorMessage("Failed to establish local instance of the project");
		return;
	}

	// @@@ - Run any setup for the repo (e.g. requirements.txt)

	// Have the user pick the color theme for the project
	vscode.window.showQuickPick(Array.from(COLOR_CODES.keys())).then(
		(colorName: string | undefined) => {
			// Color selected (if name not undefined)
			if (colorName === undefined) { return; }

			// Select the right ColorCode from the selected name
			let color: ColorCode;
			let c: ColorCode | undefined = COLOR_CODES.get(colorName);
			if (c === undefined) {
				return;
			} else {
				color = c;
			}

			// Create and then open the .code-workspace file
			let code_ws_file = ROOT + 'ws/' + repo.name + '.code-workspace';
			let code_ws_content: { [key: string]: any } = {
				"folders": [
					{
						"path": local_checkout
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
			fs.writeFile(code_ws_file, JSON.stringify(code_ws_content),
				() => {
					vscode.commands.executeCommand(
						"vscode.openFolder",
						vscode.Uri.file(code_ws_file),
						false
					);
				}
			);
		}
	);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
		// The command has been defined in the package.json file
		// Now provide the implementation of the command with registerCommand
		// The commandId parameter must match the command field in package.json
		let disposable = vscode.commands.registerCommand('vscode-projects.selectproject', () => {
			// @@@ - TODO: Make this find private repos too
			// @@@ - TODO: Use a configured username
			// @@@ - TODO: Handle case where git isn't available - use local checkouts
			cp.exec('curl -H "Accept: appliction/vnd.github.v3+json" https://api.github.com/users/ollij93/repos',
				(err: any, stdout: string, stderr: string) => {
					if (err) {
						vscode.window.showErrorMessage("OJ93: Error contacting git");
						console.error("OJ93: Error contacting git");
						console.log("stdout: " + stdout);
						console.log("stderr: " + stderr);
					} else {
						// Parse the repository JSON and convert into a Map for later use.
						let reposArray: Array<GitHubRepo> = JSON.parse(stdout);
						let repos: Map<string, GitHubRepo> = new Map();
						reposArray.forEach((repo: GitHubRepo) => {
							repos.set(repo.name, repo);
						});

						// Display a QuickPick for the user to choose the project
						vscode.window.showQuickPick(Array.from(repos.keys())).then(
							(name: string | undefined) => {
								// Project selected (if name not undefined)
								if (name === undefined) { return; }

								// Select the right GitHubRepo from the Map
								let repo: GitHubRepo;
								let r: GitHubRepo | undefined = repos.get(name);
								if (r === undefined) {
									return;
								} else {
									repo = r;
								}

								// Find the code-workspace file for the repo.
								// If it doesn't exist try and create a new one by cloning the project
								// Otherwise just open the exising one
								let path: string = '/home/olijohns/ws/' + repo.name + '.code-workspace';
								fs.access(path, fs.constants.F_OK, (err: any) => {
									if (err) {
										getLocalProject(repo);
									} else {
										vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path), false);
									}
								});
							}
						);
					}
				}
			);
		});
		context.subscriptions.push(disposable);
	}

	// this method is called when your extension is deactivated
	export function deactivate() { }
