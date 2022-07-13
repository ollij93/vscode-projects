import * as vscode from "vscode";

export interface QuickPickItemsWithDefault {
    items: vscode.QuickPickItem[],
    default: vscode.QuickPickItem
}

export async function quickPickFromMap<T>(
    map: Map<string, T>,
    sort = true
): Promise<T> {
    let keys: Array<string> = Array.from(map.keys());
    if (sort) {
        keys = keys.sort();
    }

    return new Promise((resolve, reject) => {
        vscode.window.showQuickPick(keys).then((choice: string | undefined) => {
            // Ignore undefined
            if (choice === undefined) {
                reject();
                return;
            }

            let c: T | undefined = map.get(choice);
            if (c === undefined) {
                reject();
            } else {
                resolve(c);
            }
        });
    });
}

export async function showQuickPick(items: string[]): Promise<string> {
    let item = await vscode.window.showQuickPick(items);
    if (item === undefined) {
        throw new Error("No item selected");
    }
    return item;
}

export async function showInputBox(): Promise<string> {
    let input = await vscode.window.showInputBox();
    if (input === undefined) {
        throw new Error("No input given");
    }
    return input;
}
