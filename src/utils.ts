import * as vscode from "vscode";

export interface QuickPickItemsWithDefault {
    items: vscode.QuickPickItem[],
    default: vscode.QuickPickItem
}

export async function quickPickFromMap<T>(
    map: Map<string, T>,
    placeHolder: string,
    sort = true
): Promise<T | undefined> {
    let keys: Array<string> = Array.from(map.keys());
    if (sort) {
        keys = keys.sort();
    }

    return new Promise((resolve, reject) => {
        let options: vscode.QuickPickOptions = { placeHolder: placeHolder };
        vscode.window.showQuickPick(keys, options).then(
            (choice: string | undefined) => {
                // Ignore undefined
                if (choice === undefined) {
                    throw Error("No choice made.");
                }
                resolve(map.get(choice));
            });
    });
}

export async function showQuickPick(items: string[], placeHolder: string): Promise<string> {
    let options: vscode.QuickPickOptions = {placeHolder: placeHolder};
    let item = await vscode.window.showQuickPick(items, options);
    if (item === undefined) {
        throw new Error("No item selected");
    }
    return item;
}

export async function showInputBox(placeHolder: string): Promise<string> {
    let options: vscode.InputBoxOptions = { placeHolder: placeHolder };
    let input = await vscode.window.showInputBox(options);
    if (input === undefined) {
        throw new Error("No input given");
    }
    return input;
}
