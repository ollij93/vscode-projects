// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { showColorQuickPick, ColorCode } from "./color";
import { github } from "./github";
import * as utils from "./utils";

function getRootLocation(): string {
    let config = vscode.workspace.getConfiguration("vscode-projects");
    let r: string | undefined = config.get("projectsRootLocation");
    let root: string;
    if (r === undefined || r === "") {
        root = os.homedir();
    } else {
        root = r;
    }
    return root;
}

function getWSLocation(): string {
    let config = vscode.workspace.getConfiguration("vscode-projects");
    let d: string | undefined = config.get("workspaceFilesLocation");
    let dir: string;
    if (d === undefined || d === "") {
        dir = os.homedir + path.sep + "ws";
    } else {
        dir = d;
    }
    return dir;
}

function getCodeWorkspacePath(repo: github.Repo): string {
    return [getWSLocation(), repo.name + ".code-workspace"].join(path.sep);
}

function openInThisWindow(filePath: string) {
    vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(filePath),
        false
    );
}

function findLocalCheckout(root: string, repo: github.Repo): string | null {
    console.log("Checking for local checkout of " + repo.full_name + " ...");

    let ret: string | null = null;

    fs.readdirSync(root, { withFileTypes: true })
        .filter((x: fs.Dirent) => x.isDirectory())
        .filter((x: fs.Dirent) => !x.name.startsWith("."))
        .forEach((dir: fs.Dirent) => {
            try {
                let config = fs.readFileSync(
                    [root, dir.name, ".git", "config"].join(),
                    "utf8"
                );
                if (config.indexOf(repo.ssh_url) >= 0) {
                    // This is a copy of that repo
                    ret = root + dir.name;
                }
            } catch (error) {
                // Ignore... The git config file simply doesn't exist in this
                // directory.
            }
        });

    return ret;
}

function obtainLocalWorkspace(repo: github.Repo): Promise<string> {
    let projectsRoot = getRootLocation();

    let localCheckout: string | null = findLocalCheckout(projectsRoot, repo);

    if (localCheckout === null) {
        console.log(
            "No local checkout of " + repo.full_name + " found, cloning..."
        );
        return github.clone(repo, projectsRoot);
    } else {
        let checkout: string = localCheckout;
        console.log(`Found local checkout of ${repo.full_name} at ${checkout}`);
        return new Promise((resolve, _) => {
            resolve(checkout);
        });
    }
}

function createCodeWorkspace(
    workspace: string,
    repo: github.Repo
): Promise<string> {
    return showColorQuickPick().then((color: ColorCode) => {
        // Create and then open the .code-workspace file
        let codeWsPath = getCodeWorkspacePath(repo);
        let codeWsContent: { [key: string]: any } = {
            folders: [
                {
                    path: workspace,
                },
            ],
            settings: {
                "window.title":
                    "[" +
                    repo.name +
                    "] ${dirty} ${activeEditorMedium}${separator}${rootName}",
                "workbench.colorCustomizations": {
                    "titleBar.activeBackground": color.activeBackground,
                    "titleBar.activeForeground": color.activeForeground,
                    "titleBar.border": color.borderColor,
                    "titleBar.inactiveBackground": color.inactiveBackground,
                    "titleBar.inactiveForeground": color.inactiveForeground,
                },
            },
        };
        if (!fs.existsSync(path.dirname(codeWsPath))) {
            fs.mkdirSync(path.dirname(codeWsPath));
        }
        fs.writeFileSync(codeWsPath, JSON.stringify(codeWsContent));
        return codeWsPath;
    });
}

function obtainCodeWorkspace(repo: github.Repo): Promise<string> {
    // Find the code-workspace file for the repo.
    // If it doesn't exist try and create a new one by cloning the project
    // Otherwise just open the exising one
    let codeWsPath = getCodeWorkspacePath(repo);

    try {
        fs.accessSync(codeWsPath, fs.constants.F_OK);
        return new Promise((resolve, _) => {
            resolve(codeWsPath);
        });
    } catch (error) {
        return obtainLocalWorkspace(repo).then((ws) => {
            return createCodeWorkspace(ws, repo);
        });
    }
}

function selectProject() {
    let promise: Promise<Array<github.Repo>> = new Promise((resolve, _) => {
        resolve([]);
    });

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
            return obtainCodeWorkspace(repo).then(openInThisWindow);
        });
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "vscode-projects.selectproject",
        selectProject
    );
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
