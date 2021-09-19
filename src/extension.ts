// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { showColorQuickPick, ColorCode } from "./color";
import { github } from "./github";
import * as utils from "./utils";

/**
 * Get the configured root location for project repositories.
 *
 * Defaults to the users home directory if not configured.
 *
 * @returns The configured root location as a string.
 */
function getRootLocations(): string[] {
    let config = vscode.workspace.getConfiguration("vscode-projects");
    let r: string[] | undefined = config.get("projectsRootLocation");
    let root: string[];
    if (r === undefined || r.length === 0) {
        root = [os.homedir()];
    } else {
        root = r;
    }
    console.log(`Root locations: ${root}`);
    return root;
}

/**
 * Have the user select the root location from the output of getRootLocations.
 *
 * @returns A promise that resolves with the selected item.
 */
function getRootLocation(): Promise<string> {
    let choices: string[] = getRootLocations();
    // If there's only one choice don't prompt for the users input
    if (choices.length === 1) {
        return new Promise((resolve, _) => {
            return resolve(choices[0]);
        });
    }

    // Create a promise from the quick pick
    return utils.showQuickPick(choices);
}

/**
 * Get the configured location for code-workspace files.
 *
 * Defaults to a directory "~/ws/"
 *
 * @returns The configured location for core workspace files.
 */
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

/**
 * Get the code workspace file path for the given repo.
 *
 * @param repo The repo to get the code workspace file path for.
 * @returns The code workspace file path as a string.
 */
function getCodeWorkspacePath(repo: github.Repo): string {
    return [getWSLocation(), repo.name + ".code-workspace"].join(path.sep);
}

/**
 * Utility method to open the given path in the current VSCode window.
 *
 * @param filePath The file path to be opened in the current window.
 */
function openInThisWindow(filePath: string) {
    vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(filePath),
        false
    );
}

/**
 * Find a local checkout for the provided repo if one exists.
 *
 * @param root The location to search for existing repositories.
 * @param repo The github repo to locate a checkout for.
 * @returns The path to the local checkout, or null if none is found.
 */
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

/**
 * Find an existing, or clone a new workspace for the given repo.
 *
 * @param repo The github repo to get a local workspace for.
 * @returns A promise that resolves with the path to the local workspace.
 */
function obtainLocalWorkspace(repo: github.Repo): Promise<string> {
    let projectsRoots = getRootLocations();

    let checkout: string | null = null;
    projectsRoots.every((root) => {
        checkout = findLocalCheckout(root, repo);

        if (checkout !== null) {
            return false;
        }
    });

    if (checkout === null) {
        console.log(
            "No local checkout of " + repo.full_name + " found, cloning..."
        );
        return getRootLocation().then((root) => {
            return github.clone(repo, root);
        });
    } else {
        let c: string = checkout;
        console.log(`Found local checkout of ${repo.full_name} at ${c}`);
        return new Promise((resolve, _) => {
            resolve(c);
        });
    }
}

/**
 * Create a code workspace file for the provided repo which is available at
 * the given workspace location.
 *
 * @param workspace The path to a local checkout of the repo.
 * @param repo The github repo to create the code workspace file for.
 * @returns A promise that resolves with the path to the created code
 * workspace file.
 */
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
                    `[${repo.name}]` +
                    " ${dirty} ${activeEditorMedium}${separator}${rootName}",
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

/**
 * Find an existing, or create a new code workspace file for the given repo.
 *
 * @param repo The github repo to get a code workspace file path for.
 * @returns A promise that resolves with the path to the code workspace file.
 */
function obtainCodeWorkspace(repo: github.Repo): Promise<string> {
    // Find the code-workspace file for the repo.
    // If it doesn't exist try and create a new one by cloning the project
    // Otherwise just open the exising one
    let codeWsPath = getCodeWorkspacePath(repo);

    try {
        fs.accessSync(codeWsPath, fs.constants.F_OK);
        return new Promise((resolve, _) => {
            console.log(`Existing code workspace: ${codeWsPath}`);
            resolve(codeWsPath);
        });
    } catch (error) {
        console.log(`Will create new code workspace`);
        return obtainLocalWorkspace(repo).then((ws) => {
            return createCodeWorkspace(ws, repo);
        });
    }
}

function mapFromReposArray(repos: github.Repo[]): Map<string, github.Repo> {
    let ret: Map<string, github.Repo> = new Map();

    repos.forEach((repo) => {
        ret.set(repo.full_name, repo);
    });

    return ret;
}

/**
 * Get a map of string name to repo object for all configured github repos.
 *
 * @returns A promise that resolves with this map.
 */
function getAllReposMap(): Promise<Map<string, github.Repo>> {
    return Promise.allSettled(github.getAPIs().map(github.getRepos)).then(
        // Remap from array of arrays of repos to a map
        (apiRepos: PromiseSettledResult<github.Repo[]>[]) => {
            let maps: Map<string, github.Repo>[] = [];

            apiRepos.forEach((result) => {
                if (result.status === "fulfilled") {
                    maps.push(mapFromReposArray(result.value));
                }
            });

            let ret: Map<string, github.Repo> = new Map();

            maps.forEach((map) => {
                [...map.entries()].forEach((val) => {
                    ret.set(...val);
                });
            });

            return ret;
        }
    );
}

function userInputRepoName(repos: github.Repo[]): Promise<string> {
    return utils.showInputBox().then((name) => {
        name = name.trim();
        if (!name || name in repos.map((x) => x.name)) {
            // No name given or existing repo
            return new Promise((_, rej) => {
                rej();
            });
        } else {
            return new Promise((res, _) => {
                res(name);
            });
        }
    });
}

function userSelectTemplate(
    host: string,
    repos: github.Repo[],
    name: string
): Promise<[string, string, github.Repo?]> {
    return utils
        .quickPickFromMap(mapFromReposArray(repos))
        .then((repo) => {
            return new Promise<[string, string, github.Repo?]>((res, _) => {
                res([host, name, repo]);
            });
        })
        .catch((_) => {
            return new Promise<[string, string, github.Repo?]>((res, _) => {
                res([host, name, undefined]);
            });
        });
}

/**
 * Get the users input on where to create a new repo and what to call it.
 *
 * @returns A promise that resolves with the host API and the name of the new
 * repo to be created.
 */
function userInputNewRepoOptions(): Promise<[string, string, github.Repo?]> {
    return utils.showQuickPick(github.getAPIs()).then((host) => {
        return github.getRepos(host).then((repos) => {
            return userInputRepoName(repos).then((name) => {
                return userSelectTemplate(host, repos, name);
            });
        });
    });
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Command that runs for the Select Project action.
 *
 * Has the user select a repo and then opens that repos code workspace file.
 */
function selectProject() {
    getAllReposMap()
        .then(utils.quickPickFromMap)
        .then(obtainCodeWorkspace)
        .then(openInThisWindow);
}

/**
 * Command that runs for the New Project action.
 *
 * Has the user input options, creates the repo accordingly and then opens
 * the created repos code workspace file.
 */
function newProject() {
    userInputNewRepoOptions()
        .then((opts) => {
            return github.createRepo(...opts);
        })
        .then(obtainCodeWorkspace)
        .then(openInThisWindow);
}

function openGitHubPage() {
    let folders = vscode.workspace.workspaceFolders;
    if (folders === undefined) {
        return;
    }

    let options: cp.ExecSyncOptionsWithStringEncoding = {
        encoding: "ascii",
        cwd: folders[0].uri.fsPath,
    };
    let cloneURL = cp.execSync("git remote get-url origin", options).toString();
    let url = cloneURL
        .replace(":", "/")
        .replace("git@", "https://")
        .replace(".git", "")
        .trim();
    console.log(url);
    vscode.env.openExternal(vscode.Uri.parse(url));
}

// ============================================================================

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

    disposable = vscode.commands.registerCommand(
        "vscode-projects.newproject",
        newProject
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        "vscode-projects.opengithubpage",
        openGitHubPage
    );
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
