import * as vscode from "vscode";
import * as utils from "./utils";

export interface ColorCode {
    activeBackground: string;
    activeForeground: string;
    borderColor: string;
    inactiveBackground: string;
}

interface CustomColorCode extends ColorCode {
    name: string;
}

export let DEFAULT_COLOR_CODES: Map<string, ColorCode> = new Map();
export let CUSTOM_COLOR_CODES: Map<string, ColorCode> = new Map();

export function loadColorCodes() {
    DEFAULT_COLOR_CODES.clear();
    CUSTOM_COLOR_CODES.clear();

    const defaultColorCodes: Map<string, ColorCode> = new Map();

    defaultColorCodes.set("Arizona Cardinals", { activeBackground: "#97233F", activeForeground: "#000000", borderColor: "#FFB612", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Atlanta Falcons", { activeBackground: "#A71930", activeForeground: "#000000", borderColor: "#A5ACAF", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Baltimore Ravens", { activeBackground: "#241773", activeForeground: "#000000", borderColor: "#9E7C0C", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Buffalo Bills", { activeBackground: "#00338D", activeForeground: "#FFFFFF", borderColor: "#C60C30", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Carolina Panthers", { activeBackground: "#0085CA", activeForeground: "#000000", borderColor: "#BFC0BF", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Chicago Bears", { activeBackground: "#0B162A", activeForeground: "#C83803", borderColor: "#C83803", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Cincinnati Bengals", { activeBackground: "#FB4F14", activeForeground: "#000000", borderColor: "#000000", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Cleveland Browns", { activeBackground: "#FF3C00", activeForeground: "#000000", borderColor: "#311D00", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Dallas Cowboys", { activeBackground: "#041E42", activeForeground: "#FFFFFF", borderColor: "#869397", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Denver Broncos", { activeBackground: "#FB4F14", activeForeground: "#FFFFFF", borderColor: "#002244", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Detroit Lions", { activeBackground: "#0076B6", activeForeground: "#FFFFFF", borderColor: "#B0B7BC", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Green Bay Packers", { activeBackground: "#203731", activeForeground: "#FFFFFF", borderColor: "#FFB612", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Houston Texans", { activeBackground: "#03202F", activeForeground: "#FFFFFF", borderColor: "#A71930", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Indianapolis Colts", { activeBackground: "#002C5F", activeForeground: "#FFFFFF", borderColor: "#A2AAAD", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Jacksonville Jaguars", { activeBackground: "#006778", activeForeground: "#FFFFFF", borderColor: "#D7A22A", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Kansas City Chiefs", { activeBackground: "#E31837", activeForeground: "#FFFFFF", borderColor: "#FFB81C", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("L.A. Chargers", { activeBackground: "#0080C6", activeForeground: "#FFC20E", borderColor: "#002A5E", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("L.A. Rams", { activeBackground: "#003594", activeForeground: "#FFD100", borderColor: "#FFA300", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Miami Dolphins", { activeBackground: "#008E97", activeForeground: "#FFFFFF", borderColor: "#FC4C02", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Minnesota Vikings", { activeBackground: "#4F2683", activeForeground: "#FFFFFF", borderColor: "#FFC62F", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("New England Patriots", { activeBackground: "#002244", activeForeground: "#FFFFFF", borderColor: "#C60C30", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("New Orleans Saints", { activeBackground: "#101820", activeForeground: "#FFFFFF", borderColor: "#D3BC8D", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("New York Giants", { activeBackground: "#0B2265", activeForeground: "#FFFFFF", borderColor: "#A71930", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("New York Jets", { activeBackground: "#125740", activeForeground: "#FFFFFF", borderColor: "#000000", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Las Vegas Raiders", { activeBackground: "#000000", activeForeground: "#FFFFFF", borderColor: "#A5ACAF", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Philadelphia Eagles", { activeBackground: "#004C54", activeForeground: "#FFFFFF", borderColor: "#A5ACAF", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Pittsburgh Steelers", { activeBackground: "#000000", activeForeground: "#FFB612", borderColor: "#FFB612", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("San Francisco 49ers", { activeBackground: "#AA0000", activeForeground: "#FFFFFF", borderColor: "#B3995D", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Seattle Seahawks", { activeBackground: "#002244", activeForeground: "#FFFFFF", borderColor: "#69BE28", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Tampa Bay Buccaneers", { activeBackground: "#D50A0A", activeForeground: "#FFFFFF", borderColor: "#B1BABF", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Tennessee Titans", { activeBackground: "#0C2340", activeForeground: "#8A8D8F", borderColor: "#4B92DB", inactiveBackground: "#8A8D8F" });
    defaultColorCodes.set("Washington Commanders", { activeBackground: "#773141", activeForeground: "#FFFFFF", borderColor: "#FFB612", inactiveBackground: "#FFFFFF" });

    const originalEntries = [...defaultColorCodes.entries()];
    for (const [key, value] of originalEntries) {
        const invertedKey = key + " (inverted)";
        const invertedValue = {
            borderColor: value.activeBackground,
            activeBackground: value.borderColor,
            activeForeground: value.activeForeground,
            inactiveBackground: value.inactiveBackground,
        };
        defaultColorCodes.set(invertedKey, invertedValue);
    }

    DEFAULT_COLOR_CODES = defaultColorCodes;

    const customColors = vscode.workspace.getConfiguration('vscode-projects').get<CustomColorCode[]>('customColorCodes');
    if (customColors) {
        for (const color of customColors) {
            CUSTOM_COLOR_CODES.set(color.name, { ...color });
        }
    }
}

function hashStr(str: string): number {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function defaultColorCode(projectName: string): string {
    const allColors = [...DEFAULT_COLOR_CODES.keys(), ...CUSTOM_COLOR_CODES.keys()];
    if (allColors.length === 0) {
        // Return a fallback color name if no colors are available
        return "Default";
    }
    let projectHash: number = hashStr(projectName);
    return allColors[projectHash % allColors.length];
}

export function getItems(projectName: string): utils.QuickPickItemsWithDefault {
    const defaultColor = defaultColorCode(projectName);
    const defaultItem: vscode.QuickPickItem = { label: defaultColor, description: "(default)" };

    const items: vscode.QuickPickItem[] = [];

    if (CUSTOM_COLOR_CODES.size > 0) {
        items.push({ label: 'Custom Colors', kind: vscode.QuickPickItemKind.Separator });
        for (const key of CUSTOM_COLOR_CODES.keys()) {
            if (key !== defaultColor) {
                items.push({ label: key });
            }
        }
    }

    items.push({ label: 'Default Colors', kind: vscode.QuickPickItemKind.Separator });
    for (const key of DEFAULT_COLOR_CODES.keys()) {
        if (key !== defaultColor) {
            items.push({ label: key });
        }
    }

    return {
        items: [defaultItem, ...items],
        default: defaultItem
    };
}

export function processSelected(selectedItem: vscode.QuickPickItem): ColorCode {
    const colorName = selectedItem.label;
    const color = DEFAULT_COLOR_CODES.get(colorName) || CUSTOM_COLOR_CODES.get(colorName);

    if (color === undefined) {
        throw new Error("Color not defined.");
    }
    return color;
}
