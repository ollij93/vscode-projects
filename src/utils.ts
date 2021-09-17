import { resolve } from "dns";
import * as vscode from "vscode";

export function quickPickFromMap<T>(
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

export function showQuickPick(items: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        vscode.window.showQuickPick(items).then((item: string | undefined) => {
            if (item === undefined) {
                reject();
            } else {
                resolve(item);
            }
        });
    });
}

export function showInputBox(): Promise<string> {
    return new Promise((resolve, reject) => {
        vscode.window.showInputBox().then((item: string | undefined) => {
            if (item === undefined) {
                reject();
            } else {
                resolve(item);
            }
        });
    });
}
