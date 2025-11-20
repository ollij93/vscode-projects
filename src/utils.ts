import * as vscode from "vscode";

export interface QuickPickItemsWithDefault {
    items: vscode.QuickPickItem[],
    default: vscode.QuickPickItem
}

export async function quickPickFromMap<T>(
    map: Map<string, T>,
    placeHolder: string,
    sort = true,
    description_cb?: (element: T) => string
): Promise<T | undefined> {
    let keys: Array<string> = Array.from(map.keys());
    if (sort) {
        keys = keys.sort();
    }

    return new Promise((resolve, reject) => {
        let options: vscode.QuickPickOptions = { placeHolder: placeHolder };
        vscode.window.showQuickPick(
            keys.map(key => ({
                label: key,
                description: description_cb ? description_cb(map.get(key)!) : undefined
            })), options).then(
                (choice: vscode.QuickPickItem | undefined) => {
                    // Ignore undefined
                    if (choice === undefined) {
                        throw Error("No choice made.");
                    }
                    resolve(map.get(choice.label));
                });
    });
}

export async function quickPickFromMaps<T>(
    maps: Map<string, Map<string, T>>,
    placeHolder: string,
    sortEach = true,
    description_cb?: (element: T) => string
): Promise<T | undefined> {
    let items: vscode.QuickPickItem[] = [];
    [...maps.entries()].forEach(([label, map]) => {
        items.push({ label: label, kind: vscode.QuickPickItemKind.Separator });
        let keys = [...map.keys()];
        if (sortEach) {
            keys = keys.sort();
        }
        items.push(...[...map.entries()].map((entry) => {
            let key: string = entry[0];
            let value: T = entry[1];
            return {
                label: key,
                description: description_cb ? description_cb(value) : undefined
            };
        }));
    });

    return new Promise((resolve, reject) => {
        let options: vscode.QuickPickOptions = { placeHolder: placeHolder };
        vscode.window.showQuickPick(items, options).then(
            (choice: vscode.QuickPickItem | undefined) => {
                // Ignore undefined
                if (choice === undefined) {
                    throw Error("No choice made.");
                }
                maps.forEach((map, _) => {
                    if (map.has(choice.label)) {
                        resolve(map.get(choice.label));
                    }
                })
            });
    });
}

export async function showQuickPick(items: string[], placeHolder: string): Promise<string> {
    let options: vscode.QuickPickOptions = { placeHolder: placeHolder };
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
