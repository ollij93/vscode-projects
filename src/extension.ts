// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as cp from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { callbackify } from 'util';

interface GitHubRepo {
	name: string;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ssh_url: string; // SSH URL
}

interface ColorCode {
	activeBackground: string,
	activeForeground: string,
	borderColor: string,
	inactiveBackground: string,
	inactiveForeground: string,
}

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
COLOR_CODES.set("Chicago Bears", {
	activeBackground: "#0B162A",
	activeForeground: "#C83803",
	borderColor: "#C83803",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#0B162A",
});
COLOR_CODES.set("Cincinnati Bengals", {
	activeBackground: "#FB4F14",
	activeForeground: "#000000",
	borderColor: "#000000",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#FB4F14",
});
COLOR_CODES.set("Cleveland Browns", {
	activeBackground: "#FF3C00",
	activeForeground: "#000000",
	borderColor: "#311D00",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#FF3C00",
});
COLOR_CODES.set("Dallas Cowboys", {
	activeBackground: "#041E42",
	activeForeground: "#FFFFFF",
	borderColor: "#869397",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#041E42",
});
COLOR_CODES.set("Denver Broncos", {
	activeBackground: "#FB4F14",
	activeForeground: "#FFFFFF",
	borderColor: "#002244",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#FB4F14",
});
COLOR_CODES.set("Detroit Lions", {
	activeBackground: "#0076B6",
	activeForeground: "#FFFFFF",
	borderColor: "#B0B7BC",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#0076B6",
});
COLOR_CODES.set("Green Bay Packers", {
	activeBackground: "#203731",
	activeForeground: "#FFFFFF",
	borderColor: "#FFB612",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#203731",
});
COLOR_CODES.set("Houston Texans", {
	activeBackground: "#03202F",
	activeForeground: "#FFFFFF",
	borderColor: "#A71930",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#03202F",
});
COLOR_CODES.set("Indianapolis Colts", {
	activeBackground: "#002C5F",
	activeForeground: "#FFFFFF",
	borderColor: "#A2AAAD",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#002C5F",
});
COLOR_CODES.set("Jacksonville Jaguars", {
	activeBackground: "#006778",
	activeForeground: "#FFFFFF",
	borderColor: "#D7A22A",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#006778",
});
COLOR_CODES.set("Kansas City Chiefs", {
	activeBackground: "#E31837",
	activeForeground: "#FFFFFF",
	borderColor: "#FFB81C",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#E31837",
});
COLOR_CODES.set("L.A. Chargers", {
	activeBackground: "#0080C6",
	activeForeground: "#FFC20E",
	borderColor: "#002A5E",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#0080C6",
});
COLOR_CODES.set("L.A. Rams", {
	activeBackground: "#003594",
	activeForeground: "#FFD100",
	borderColor: "#FFA300",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#003594",
});
COLOR_CODES.set("Miami Dolphins", {
	activeBackground: "#008E97",
	activeForeground: "#FFFFFF",
	borderColor: "#FC4C02",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#008E97",
});
COLOR_CODES.set("Minnesota Vikings", {
	activeBackground: "#4F2683",
	activeForeground: "#FFFFFF",
	borderColor: "#FFC62F",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#4F2683",
});
COLOR_CODES.set("New England Patriots", {
	activeBackground: "#002244",
	activeForeground: "#FFFFFF",
	borderColor: "#C60C30",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#002244",
});
COLOR_CODES.set("New Orleans Saints", {
	activeBackground: "#101820",
	activeForeground: "#FFFFFF",
	borderColor: "#D3BC8D",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#101820",
});
COLOR_CODES.set("New York Giants", {
	activeBackground: "#0B2265",
	activeForeground: "#FFFFFF",
	borderColor: "#A71930",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#0B2265",
});
COLOR_CODES.set("New York Jets", {
	activeBackground: "#125740",
	activeForeground: "#FFFFFF",
	borderColor: "#000000",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#125740",
});
COLOR_CODES.set("Las Vegas Raiders", {
	activeBackground: "#000000",
	activeForeground: "#FFFFFF",
	borderColor: "#A5ACAF",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#000000",
});
COLOR_CODES.set("Philadelphia Eagles", {
	activeBackground: "#004C54",
	activeForeground: "#FFFFFF",
	borderColor: "#A5ACAF",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#004C54",
});
COLOR_CODES.set("Pittsburgh Steelers", {
	activeBackground: "#000000",
	activeForeground: "#FFB612",
	borderColor: "#FFB612",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#000000",
});
COLOR_CODES.set("San Francisco 49ers", {
	activeBackground: "#AA0000",
	activeForeground: "#FFFFFF",
	borderColor: "#B3995D",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#AA0000",
});
COLOR_CODES.set("Seattle Seahawks", {
	activeBackground: "#002244",
	activeForeground: "#FFFFFF",
	borderColor: "#69BE28",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#002244",
});
COLOR_CODES.set("Tampa Bay Buccaneers", {
	activeBackground: "#D50A0A",
	activeForeground: "#FFFFFF",
	borderColor: "#B1BABF",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#D50A0A",
});
COLOR_CODES.set("Tennessee Titans", {
	activeBackground: "#0C2340",
	activeForeground: "#8A8D8F",
	borderColor: "#4B92DB",
	inactiveBackground: "#8A8D8F",
	inactiveForeground: "#0C2340",
});
COLOR_CODES.set("Washington Football Team", {
	activeBackground: "#773141",
	activeForeground: "#FFFFFF",
	borderColor: "#FFB612",
	inactiveBackground: "#FFFFFF",
	inactiveForeground: "#773141",
});

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

function getGitHubToken(host: string): string {
	// @@@ - TODO: Error handling
	try {
		return JSON.parse(
			fs.readFileSync(
				os.homedir() + path.sep + '.ollij93.githubkeys'
			).toString()
		)[host];
	} catch (error) {
		console.error(error);
		return "";
	}
}


function cloneProject(repo: GitHubRepo): string | null {
	let checkout: string | null = [getRootLocation(), repo.name].join(path.sep);

	// @@@ - TODO: Handle ssh issues
	try {
		cp.execSync('git clone ' + repo.ssh_url + ' ' + checkout);
	} catch (error) {
		// @@@
	}

	return checkout;
}

function openInThisWindow(filePath: string) {
	vscode.commands.executeCommand(
		"vscode.openFolder",
		vscode.Uri.file(filePath),
		false);
}

function getLocalProject(repo: GitHubRepo) {
	// Check for obvious local checkouts
	let localCheckout: string | null = null;
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
		}
		);

	// Couldn't see a local checkout of the repo. So will clone a new one.
	if (localCheckout === null) {
		localCheckout = cloneProject(repo);
	}

	if (localCheckout === null) {
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
		}
	);
}

function quickPickFromMap<T>(map: Map<string, T>, callback: (picked: T) => void, sort = true) {
	let keys: Array<string> = Array.from(map.keys());
	if (sort) {
		keys = keys.sort();
	}
	vscode.window.showQuickPick(keys).then(
		(choice: string | undefined) => {
			// Ignore undefined
			if (choice === undefined) { return; }

			let c: T | undefined = map.get(choice);
			let pick: T;
			if (c === undefined) {
				return;
			} else {
				pick = c;
			}

			callback(pick);
		}
	);
}

function getGitHubRepos(host: string): Promise<string> {
	return new Promise((resolve, reject) => {
		// @@@ - TODO: Handle case where git isn't available - use local checkouts
		let user: string = os.userInfo().username;
		let pass: string = getGitHubToken(host);
		let auth: string = Buffer.from(user + ':' + pass).toString('base64');
		let hostParts: Array<string> = host.split('/');
		host = hostParts[0];
		hostParts.shift();
		let hostUrlPath: string = hostParts.join('/');
		if (hostUrlPath !== "") {
			hostUrlPath = '/' + hostUrlPath;
		}
		let options = {
			method: 'GET',
			hostname: host,
			path: hostUrlPath + '/user/repos?visibility=all',
			port: 443,
			headers: {
				authorization: 'token ' + pass,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"User-Agent": 'other'
			}
		};
		let req = https.request(
			options,
			(res: http.IncomingMessage) => {
				let content: string = "";
				res.on('data', function (chunk) {
					content += chunk.toString();
				});
				res.on('end', () => { resolve(content); });
			}
		);
		req.on('error', (e) => {
			console.error(e);
			reject(e);
		});
		req.end();
	});
}

function selectProject() {
	getGitHubRepos('api.github.com').then((content: string) => {
		// Parse the repository JSON and convert into a Map for later use.
		let reposArray: Array<GitHubRepo> = JSON.parse(content);
		let repos: Map<string, GitHubRepo> = new Map();
		reposArray.forEach((repo: GitHubRepo) => {
			repos.set(repo.name, repo);
		});

		// Display a QuickPick for the user to choose the project
		quickPickFromMap(repos, (repo) => {
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
