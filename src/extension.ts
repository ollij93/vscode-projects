import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import * as color from "./color";
import { github } from "./github";
import * as utils from "./utils";

/**
 * Get the configured root location for project repositories.
 *
 * Defaults to the users home directory if not configured.
 *
 * @returns The configured root location as a string.
 */
function getRootLocations(config: vscode.WorkspaceConfiguration): string[] {
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
async function getRootLocation(
    config: vscode.WorkspaceConfiguration
): Promise<string> {
    let choices: string[] = getRootLocations(config);
    // If there's only one choice don't prompt for the users input
    if (choices.length === 1) {
        return choices[0];
    }

    // Create a promise from the quick pick
    return await utils.showQuickPick(choices, "Select root location");
}

/**
 * Get the configured location for code-workspace files.
 *
 * Defaults to a directory "~/ws/"
 *
 * @returns The configured location for core workspace files.
 */
function getWSLocation(config: vscode.WorkspaceConfiguration): string {
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
function getCodeWorkspacePath(
    config: vscode.WorkspaceConfiguration,
    repo: github.Repo
): string {
    return [getWSLocation(config), repo.name + ".code-workspace"].join(path.sep);
}

/**
 * Utility method to open the given path in the current VSCode window.
 *
 * @param filePath The file path to be opened in the current window.
 */
async function openInThisWindow(filePath: string) {
    await vscode.commands.executeCommand(
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
async function obtainLocalWorkspace(
    config: vscode.WorkspaceConfiguration,
    repo: github.Repo
): Promise<string> {
    let projectsRoots = getRootLocations(config);

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
        let root = await getRootLocation(config);
        return await github.clone(repo, root);
    } else {
        let c: string = checkout;
        console.log(`Found local checkout of ${repo.full_name} at ${c}`);
        return c;
    }
}

class WorkbenchColors {
    "activityBar.background": string;
    "activityBar.foreground": string;
    "activityBar.border": string;
    "titleBar.activeBackground": string;
    "titleBar.activeForeground": string;
    "titleBar.border": string;
    "titleBar.inactiveBackground": string;
    "titleBar.inactiveForeground": string;

    constructor(selectedColor: color.ColorCode) {
        this["activityBar.background"] = selectedColor.activeBackground;
        this["activityBar.foreground"] = selectedColor.activeForeground;
        this["activityBar.border"] = selectedColor.borderColor;
        this["titleBar.activeBackground"] = selectedColor.activeBackground;
        this["titleBar.activeForeground"] = selectedColor.activeForeground;
        this["titleBar.border"] = selectedColor.borderColor;
        this["titleBar.inactiveBackground"] = selectedColor.inactiveBackground;
        this["titleBar.inactiveForeground"] = selectedColor.inactiveForeground;
    }
}

/**
 * Create a code workspace file for the provided repo which is available at
 * the given workspace location.
 *
 * @param config The configuration for this extension.
 * @param workspace The path to a local checkout of the repo.
 * @param repo The github repo to create the code workspace file for.
 * @returns A promise that resolves with the path to the created code
 * workspace file.
 */
async function createCodeWorkspace(
    config: vscode.WorkspaceConfiguration,
    workspace: string,
    repo: github.Repo
): Promise<string> {
    // Set up the color selector and wait for a choice
    const colorItems = color.getItems(repo.name);
    console.log(colorItems);
    console.log(color.COLOR_CODES);
    const options: vscode.QuickPickOptions = {
        placeHolder: "Select Color Theme",
    };
    const selected = await vscode.window.showQuickPick(colorItems.items, options) || colorItems.default;
    const selectedColor = color.processSelected(selected);

    // Create and then open the .code-workspace file
    let codeWsPath = getCodeWorkspacePath(config, repo);
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
            "workbench.colorCustomizations": new WorkbenchColors(selectedColor),
        },
    };
    if (!fs.existsSync(path.dirname(codeWsPath))) {
        fs.mkdirSync(path.dirname(codeWsPath));
    }
    fs.writeFileSync(codeWsPath, JSON.stringify(codeWsContent));
    return codeWsPath;
}

/**
 * Find an existing, or create a new code workspace file for the given repo.
 *
 * @param repo The github repo to get a code workspace file path for.
 * @returns A promise that resolves with the path to the code workspace file.
 */
async function obtainCodeWorkspace(
    config: vscode.WorkspaceConfiguration,
    repo: github.Repo
): Promise<string> {
    // Find the code-workspace file for the repo.
    // If it doesn't exist try and create a new one by cloning the project
    // Otherwise just open the exising one
    let codeWsPath = getCodeWorkspacePath(config, repo);

    try {
        fs.accessSync(codeWsPath, fs.constants.F_OK);
        console.log(`Existing code workspace: ${codeWsPath}`);
        return codeWsPath;
    } catch (error) {
        console.log(`Will create new code workspace`);
        let ws = await obtainLocalWorkspace(config, repo);
        return await createCodeWorkspace(config, ws, repo);
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
async function getAllReposMap(
    config: vscode.WorkspaceConfiguration
): Promise<Map<string, github.Repo>> {
    return new Promise((resolve, reject) => {
        let promisemap = github.getAPIs(config).map((host) => {
            let token = github.getToken(config, host);
            return github.getRepos(token, host);
        });
        Promise.allSettled(promisemap).then(
            // Remap from array of arrays of repos to a map
            (apiRepos: PromiseSettledResult<github.Repo[]>[]) => {
                console.log(apiRepos);
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

                if (ret.size > 0) {
                    resolve(ret);
                } else {
                    vscode.window.showErrorMessage("Failed to find any projects");
                    reject();
                }
            }
        );
    });
}

async function userInputRepoName(repos: github.Repo[]): Promise<string> {
    return await utils.showInputBox("Repository Name").then((name) => {
        name = name.trim();
        if (!name || name in repos.map((x) => x.name)) {
            // No name given or existing repo
            throw new Error("Invalid name given for new repo.");
        } else {
            return name;
        }
    });
}

async function userSelectTemplate(
    host: string,
    repos: github.Repo[],
    name: string
): Promise<[string, string, github.Repo?]> {
    try {
        let choices: Map<string, github.Repo | undefined> = mapFromReposArray(repos.filter((x) => x.is_template));
        choices.set("empty", undefined);
        let repo = undefined;
        if (choices) {
            repo = await utils.quickPickFromMap(choices, "Select template").then();
        }
        return [host, name, repo];
    } catch {
        return [host, name, undefined];
    }
}

/**
 * Get the users input on where to create a new repo and what to call it.
 *
 * @returns A promise that resolves with the host API and the name of the new
 * repo to be created.
 */
async function userInputNewRepoOptions(
    config: vscode.WorkspaceConfiguration
): Promise<[string, string, github.Repo?]> {
    let host = await utils.showQuickPick(github.getAPIs(config), "Select github api");
    let token = github.getToken(config, host);
    let repos = await github.getRepos(token, host);
    let name = await userInputRepoName(repos);
    return await userSelectTemplate(host, repos, name);
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Command that runs for the Select Project action.
 *
 * Has the user select a repo and then opens that repos code workspace file.
 */
async function selectProject() {
    let config = vscode.workspace.getConfiguration("vscode-projects");
    await getAllReposMap(config)
        .then((x) => { return utils.quickPickFromMap(x, "Select project"); })
        .then((x) => { if (x === undefined) { throw Error("No project selected."); } return (x); })
        .then((x) => { return obtainCodeWorkspace(config, x); })
        .then(openInThisWindow)
        .catch(console.error);
}

/**
 * Command that runs for the New Project action.
 *
 * Has the user input options, creates the repo accordingly and then opens
 * the created repos code workspace file.
 */
async function newProject() {
    let config = vscode.workspace.getConfiguration("vscode-projects");
    try {
        let options = await userInputNewRepoOptions(config);
        let token = github.getToken(config, options[0]);
        let repo = await github.createRepo(token, ...options);
        let ws = await obtainCodeWorkspace(config, repo);
        await openInThisWindow(ws);
    } catch (e) {
        console.error(e);
    }
}

function openGitHubPage() {
    let folders = vscode.workspace.workspaceFolders;
    if (folders === undefined) {
        return;
    }

    let wsPath = folders[0].uri.fsPath;
    let options: cp.ExecSyncOptionsWithStringEncoding = {
        encoding: "ascii",
        cwd: wsPath,
    };
    let cloneURL = cp.execSync("git remote get-url origin", options).toString();
    let url = cloneURL
        .replace(":", "/")
        .replace("git@", "https://")
        .replace(".git", "")
        .trim();
    console.log(url);
    if (vscode.window.activeTextEditor != null) {
        let branch = cp.execSync("git rev-parse --abbrev-ref HEAD", options).toString().trim();
        let activePath = vscode.window.activeTextEditor.document.uri.fsPath;
        let activeLine = vscode.window.activeTextEditor.selection.start.line;
        let relPath = path.relative( wsPath, activePath );
        console.log(relPath)
        url = url + "/tree/" + branch + "/" + relPath + "#L" + activeLine ;
    }

    vscode.env.openExternal(vscode.Uri.parse(url));
}

async function updateProjectColors() {
    const config = vscode.workspace.getConfiguration();

    // Get the project name from the window title
    const title: string = config.get("window.title") || "";
    const projname = (/\[(.*)\]/.exec(title) || ["", ""])[1];

    // Set up the color selector and wait for a choice
    const colorItems = color.getItems(projname);
    const options: vscode.QuickPickOptions = {
        placeHolder: "Select Color Theme",
    };
    const selected = await vscode.window.showQuickPick(colorItems.items, options) || colorItems.default;
    const selectedColor = color.processSelected(selected);
    await config.update("workbench.colorCustomizations", new WorkbenchColors(selectedColor), vscode.ConfigurationTarget.Workspace);
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

    disposable = vscode.commands.registerCommand(
        "vscode-projects.updateProjectColors",
        updateProjectColors
    );
}

// this method is called when your extension is deactivated
export function deactivate() { }
