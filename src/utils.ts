import * as vscode from 'vscode';

export function quickPickFromMap<T>(map: Map<string, T>, callback: (picked: T) => void, sort = true) {
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