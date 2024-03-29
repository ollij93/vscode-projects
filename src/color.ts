import * as vscode from "vscode";
import * as utils from "./utils";

export interface ColorCode {
    activeBackground: string;
    activeForeground: string;
    borderColor: string;
    inactiveBackground: string;
}

export let COLOR_CODES: Map<string, ColorCode> = new Map();
COLOR_CODES.set("Arizona Cardinals", {
    activeBackground: "#97233F",
    activeForeground: "#000000",
    borderColor: "#FFB612",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Atlanta Falcons", {
    activeBackground: "#A71930",
    activeForeground: "#000000",
    borderColor: "#A5ACAF",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Baltimore Ravens", {
    activeBackground: "#241773",
    activeForeground: "#000000",
    borderColor: "#9E7C0C",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Buffalo Bills", {
    activeBackground: "#00338D",
    activeForeground: "#FFFFFF",
    borderColor: "#C60C30",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Carolina Panthers", {
    activeBackground: "#0085CA",
    activeForeground: "#000000",
    borderColor: "#BFC0BF",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Chicago Bears", {
    activeBackground: "#0B162A",
    activeForeground: "#C83803",
    borderColor: "#C83803",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Cincinnati Bengals", {
    activeBackground: "#FB4F14",
    activeForeground: "#000000",
    borderColor: "#000000",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Cleveland Browns", {
    activeBackground: "#FF3C00",
    activeForeground: "#000000",
    borderColor: "#311D00",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Dallas Cowboys", {
    activeBackground: "#041E42",
    activeForeground: "#FFFFFF",
    borderColor: "#869397",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Denver Broncos", {
    activeBackground: "#FB4F14",
    activeForeground: "#FFFFFF",
    borderColor: "#002244",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Detroit Lions", {
    activeBackground: "#0076B6",
    activeForeground: "#FFFFFF",
    borderColor: "#B0B7BC",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Green Bay Packers", {
    activeBackground: "#203731",
    activeForeground: "#FFFFFF",
    borderColor: "#FFB612",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Houston Texans", {
    activeBackground: "#03202F",
    activeForeground: "#FFFFFF",
    borderColor: "#A71930",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Indianapolis Colts", {
    activeBackground: "#002C5F",
    activeForeground: "#FFFFFF",
    borderColor: "#A2AAAD",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Jacksonville Jaguars", {
    activeBackground: "#006778",
    activeForeground: "#FFFFFF",
    borderColor: "#D7A22A",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Kansas City Chiefs", {
    activeBackground: "#E31837",
    activeForeground: "#FFFFFF",
    borderColor: "#FFB81C",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("L.A. Chargers", {
    activeBackground: "#0080C6",
    activeForeground: "#FFC20E",
    borderColor: "#002A5E",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("L.A. Rams", {
    activeBackground: "#003594",
    activeForeground: "#FFD100",
    borderColor: "#FFA300",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Miami Dolphins", {
    activeBackground: "#008E97",
    activeForeground: "#FFFFFF",
    borderColor: "#FC4C02",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Minnesota Vikings", {
    activeBackground: "#4F2683",
    activeForeground: "#FFFFFF",
    borderColor: "#FFC62F",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("New England Patriots", {
    activeBackground: "#002244",
    activeForeground: "#FFFFFF",
    borderColor: "#C60C30",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("New Orleans Saints", {
    activeBackground: "#101820",
    activeForeground: "#FFFFFF",
    borderColor: "#D3BC8D",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("New York Giants", {
    activeBackground: "#0B2265",
    activeForeground: "#FFFFFF",
    borderColor: "#A71930",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("New York Jets", {
    activeBackground: "#125740",
    activeForeground: "#FFFFFF",
    borderColor: "#000000",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Las Vegas Raiders", {
    activeBackground: "#000000",
    activeForeground: "#FFFFFF",
    borderColor: "#A5ACAF",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Philadelphia Eagles", {
    activeBackground: "#004C54",
    activeForeground: "#FFFFFF",
    borderColor: "#A5ACAF",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Pittsburgh Steelers", {
    activeBackground: "#000000",
    activeForeground: "#FFB612",
    borderColor: "#FFB612",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("San Francisco 49ers", {
    activeBackground: "#AA0000",
    activeForeground: "#FFFFFF",
    borderColor: "#B3995D",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Seattle Seahawks", {
    activeBackground: "#002244",
    activeForeground: "#FFFFFF",
    borderColor: "#69BE28",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Tampa Bay Buccaneers", {
    activeBackground: "#D50A0A",
    activeForeground: "#FFFFFF",
    borderColor: "#B1BABF",
    inactiveBackground: "#FFFFFF",
});
COLOR_CODES.set("Tennessee Titans", {
    activeBackground: "#0C2340",
    activeForeground: "#8A8D8F",
    borderColor: "#4B92DB",
    inactiveBackground: "#8A8D8F",
});
COLOR_CODES.set("Washington Commanders", {
    activeBackground: "#773141",
    activeForeground: "#FFFFFF",
    borderColor: "#FFB612",
    inactiveBackground: "#FFFFFF",
});

// Duplicate the color codes, providing an inverted version of each where the
// border and background colors are swapped.
const ORIGINAL_COLOR_CODES = [...COLOR_CODES.entries()];
for (const [key, value] of ORIGINAL_COLOR_CODES) {
    const invertedKey = key + " (inverted)";
    const invertedValue = {
        // Swap the border and background colors
        borderColor: value.activeBackground,
        activeBackground: value.borderColor,
        // Keep the foreground and inactive background colors the same
        activeForeground: value.activeForeground,
        inactiveBackground: value.inactiveBackground,
    };
    COLOR_CODES.set(invertedKey, invertedValue);
}

function hashStr(str: string): number {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function defaultColorCode(projectName: string): string {
    let projectHash: number = hashStr(projectName);
    console.log(projectHash);
    return Array.from(COLOR_CODES.keys())[projectHash % COLOR_CODES.size];
}

export function getItems(projectName: string): utils.QuickPickItemsWithDefault {
    const defaultColor = defaultColorCode(projectName);
    const defaultItem: vscode.QuickPickItem = {
        label: defaultColor,
        description: "(default)"
    };
    const items = [defaultItem].concat(
        Array.from(COLOR_CODES.keys()).filter(
            (x) => { return x !== defaultColor; }
        ).flatMap((x, _, __) => { return { label: x }; })
    );
    return {
        items: items,
        default: defaultItem
    };
}

export function processSelected(selectedItem: vscode.QuickPickItem): ColorCode {
    const c = COLOR_CODES.get(selectedItem.label);
    if (c === undefined) {
        throw new Error("Color not defined.");
    } else {
        return c;
    }
}
