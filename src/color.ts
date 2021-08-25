import * as vscode from 'vscode';

export interface ColorCode {
	activeBackground: string,
	activeForeground: string,
	borderColor: string,
	inactiveBackground: string,
	inactiveForeground: string,
}

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

export function showColorQuickPick(cb: (color: ColorCode) => void) {
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

			cb(color);
		}
	);
}