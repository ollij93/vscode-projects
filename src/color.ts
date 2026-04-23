import * as vscode from "vscode";
import * as utils from "./utils";

export interface ColorCode {
    activeBackground: string;
    activeForeground: string;
    borderColor: string;
    inactiveBackground: string;
}

interface NamedColorCode extends ColorCode {
    name: string;
}

export interface ColorGroup {
    name: string;
    colors: ColorEntry[];
}

type ColorEntry = NamedColorCode | ColorGroup;

interface ColorQuickPickItem extends vscode.QuickPickItem {
    color?: ColorCode;
    colors?: ColorEntry[];
    isBack?: boolean;
}

const BACK_ITEM_LABEL = "Back";
const GROUP_CONTENTS_LABEL = "Colors";

interface RawCustomColorCode extends Partial<ColorCode> {
    name?: string;
    colors?: unknown;
}

export let DEFAULT_COLOR_CODES: Map<string, ColorCode> = new Map();
export let CUSTOM_COLOR_CODES: Map<string, ColorCode> = new Map();

let DEFAULT_COLOR_ENTRIES: ColorEntry[] = [];
let CUSTOM_COLOR_ENTRIES: ColorEntry[] = [];

function isColorGroup(entry: ColorEntry): entry is ColorGroup {
    return "colors" in entry;
}

function isNamedColorCode(entry: RawCustomColorCode): entry is NamedColorCode {
    return (
        typeof entry.name === "string" &&
        typeof entry.activeBackground === "string" &&
        typeof entry.activeForeground === "string" &&
        typeof entry.borderColor === "string" &&
        typeof entry.inactiveBackground === "string"
    );
}

function parseColorEntry(entry: unknown): ColorEntry | null {
    if (entry === null || typeof entry !== "object") {
        return null;
    }

    const rawEntry = entry as RawCustomColorCode;
    if (typeof rawEntry.name !== "string" || rawEntry.name.trim() === "") {
        return null;
    }

    if (Array.isArray(rawEntry.colors)) {
        return {
            name: rawEntry.name,
            colors: parseColorEntries(rawEntry.colors),
        };
    }

    if (isNamedColorCode(rawEntry)) {
        return {
            name: rawEntry.name,
            activeBackground: rawEntry.activeBackground,
            activeForeground: rawEntry.activeForeground,
            borderColor: rawEntry.borderColor,
            inactiveBackground: rawEntry.inactiveBackground,
        };
    }

    return null;
}

function parseColorEntries(entries: unknown[]): ColorEntry[] {
    return entries
        .map(parseColorEntry)
        .filter((entry): entry is ColorEntry => entry !== null);
}

function flattenColorEntries(entries: ColorEntry[]): NamedColorCode[] {
    const flattened: NamedColorCode[] = [];

    for (const entry of entries) {
        if (isColorGroup(entry)) {
            flattened.push(...flattenColorEntries(entry.colors));
        } else {
            flattened.push(entry);
        }
    }

    return flattened;
}

function setColorMapFromEntries(map: Map<string, ColorCode>, entries: ColorEntry[]) {
    for (const entry of flattenColorEntries(entries)) {
        map.set(entry.name, {
            activeBackground: entry.activeBackground,
            activeForeground: entry.activeForeground,
            borderColor: entry.borderColor,
            inactiveBackground: entry.inactiveBackground,
        });
    }
}

function makeNamedColorCode(
    colorName: string,
    colorMap: Map<string, ColorCode>
): NamedColorCode {
    const color = colorMap.get(colorName);
    if (color === undefined) {
        throw new Error(`Color not defined: ${colorName}`);
    }

    return {
        name: colorName,
        activeBackground: color.activeBackground,
        activeForeground: color.activeForeground,
        borderColor: color.borderColor,
        inactiveBackground: color.inactiveBackground,
    };
}

function buildGroup(
    groupName: string,
    colorNames: string[],
    colorMap: Map<string, ColorCode>
): ColorGroup {
    return {
        name: groupName,
        colors: colorNames.map((colorName) => makeNamedColorCode(colorName, colorMap)),
    };
}

function buildNamedColorEntries(
    colorNames: string[],
    colorMap: Map<string, ColorCode>,
    suffix = ""
): NamedColorCode[] {
    return colorNames.map((colorName) => makeNamedColorCode(colorName + suffix, colorMap));
}

function buildDefaultColorEntries(
    defaultColorCodes: Map<string, ColorCode>,
    invertedColorCodes: Map<string, ColorCode>
): ColorEntry[] {
    const nflTeams = [
        "Arizona Cardinals",
        "Atlanta Falcons",
        "Baltimore Ravens",
        "Buffalo Bills",
        "Carolina Panthers",
        "Chicago Bears",
        "Cincinnati Bengals",
        "Cleveland Browns",
        "Dallas Cowboys",
        "Denver Broncos",
        "Detroit Lions",
        "Green Bay Packers",
        "Houston Texans",
        "Indianapolis Colts",
        "Jacksonville Jaguars",
        "Kansas City Chiefs",
        "L.A. Chargers",
        "L.A. Rams",
        "Las Vegas Raiders",
        "Miami Dolphins",
        "Minnesota Vikings",
        "New England Patriots",
        "New Orleans Saints",
        "New York Giants",
        "New York Jets",
        "Philadelphia Eagles",
        "Pittsburgh Steelers",
        "San Francisco 49ers",
        "Seattle Seahawks",
        "Tampa Bay Buccaneers",
        "Tennessee Titans",
        "Washington Commanders",
    ];

    return [
        {
            name: "NFL",
            colors: [
                ...buildNamedColorEntries(nflTeams, defaultColorCodes),
                ...buildNamedColorEntries(nflTeams, invertedColorCodes, " (inverted)"),
            ],
        },
        buildGroup(
            "Basic",
            [
                "Red",
                "Orange",
                "Yellow",
                "Green",
                "Blue",
                "Purple",
                "Pink",
                "Dark",
                "Light",
            ],
            defaultColorCodes
        ),
        buildGroup(
            "Dracula",
            [
                "Dracula Red",
                "Dracula Red (light)",
                "Dracula Orange",
                "Dracula Orange (light)",
                "Dracula Yellow",
                "Dracula Yellow (light)",
                "Dracula Green",
                "Dracula Green (light)",
                "Dracula Cyan",
                "Dracula Cyan (light)",
                "Dracula Purple",
                "Dracula Purple (light)",
                "Dracula Pink",
                "Dracula Pink (light)",
            ],
            defaultColorCodes
        ),
    ];
}

function buildQuickPickItems(
    entries: ColorEntry[],
    defaultColorName?: string
): ColorQuickPickItem[] {
    const items: ColorQuickPickItem[] = [];

    for (const entry of entries) {
        if (isColorGroup(entry)) {
            items.push({
                label: entry.name,
                description: "(group)",
                colors: entry.colors,
            });
            continue;
        }

        if (entry.name === defaultColorName) {
            continue;
        }

        items.push({
            label: entry.name,
            color: {
                activeBackground: entry.activeBackground,
                activeForeground: entry.activeForeground,
                borderColor: entry.borderColor,
                inactiveBackground: entry.inactiveBackground,
            },
        });
    }

    return items;
}

function groupQuickPickItems(
    entries: ColorEntry[],
    includeBack = false
): ColorQuickPickItem[] {
    const items = buildQuickPickItems(entries);

    if (!includeBack) {
        return items;
    }

    return [
        {
            label: BACK_ITEM_LABEL,
            description: "(up)",
            isBack: true,
        },
        {
            label: GROUP_CONTENTS_LABEL,
            kind: vscode.QuickPickItemKind.Separator,
        },
        ...items,
    ];
}

function getInitialActiveItem(items: ColorQuickPickItem[]): ColorQuickPickItem | undefined {
    return items.find((item) => item.kind !== vscode.QuickPickItemKind.Separator && item.isBack !== true);
}

async function selectQuickPickItem(
    items: ColorQuickPickItem[],
    placeHolder: string,
    onPreview?: (color: ColorCode | undefined) => void | Thenable<void>
): Promise<ColorQuickPickItem | undefined> {
    return new Promise((resolve) => {
        const quickPick = vscode.window.createQuickPick<ColorQuickPickItem>();
        let accepted = false;
        let resolved = false;

        const finish = (item: ColorQuickPickItem | undefined) => {
            if (resolved) {
                return;
            }
            resolved = true;
            quickPick.dispose();
            resolve(item);
        };

        quickPick.items = items;
        quickPick.placeholder = placeHolder;

        const initialActiveItem = getInitialActiveItem(items);
        if (initialActiveItem !== undefined) {
            quickPick.activeItems = [initialActiveItem];

            if (onPreview !== undefined) {
                void Promise.resolve(onPreview(initialActiveItem.color)).catch(console.error);
            }
        }

        quickPick.onDidChangeActive((activeItems) => {
            if (onPreview === undefined) {
                return;
            }

            const activeItem = activeItems[0];
            void Promise.resolve(onPreview(activeItem?.color)).catch(console.error);
        });

        quickPick.onDidAccept(() => {
            accepted = true;
            finish(quickPick.selectedItems[0] || quickPick.activeItems[0]);
            quickPick.hide();
        });

        quickPick.onDidHide(() => {
            if (!accepted) {
                finish(undefined);
            }
        });

        quickPick.show();
    });
}

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
    defaultColorCodes.set("Red", { activeBackground: "#E53935", activeForeground: "#FFFFFF", borderColor: "#B71C1C", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Orange", { activeBackground: "#FB8C00", activeForeground: "#000000", borderColor: "#E65100", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Yellow", { activeBackground: "#FDD835", activeForeground: "#000000", borderColor: "#F9A825", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Green", { activeBackground: "#43A047", activeForeground: "#FFFFFF", borderColor: "#1B5E20", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Blue", { activeBackground: "#1E88E5", activeForeground: "#FFFFFF", borderColor: "#0D47A1", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Purple", { activeBackground: "#8E24AA", activeForeground: "#FFFFFF", borderColor: "#4A148C", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Pink", { activeBackground: "#D81B60", activeForeground: "#FFFFFF", borderColor: "#880E4F", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Dark", { activeBackground: "#263238", activeForeground: "#FFFFFF", borderColor: "#90A4AE", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Light", { activeBackground: "#FAFAFA", activeForeground: "#263238", borderColor: "#B0BEC5", inactiveBackground: "#FFFFFF" });
    defaultColorCodes.set("Dracula Red", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#FF5555", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Red (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#FF5555", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Orange", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#FFB86C", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Orange (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#FFB86C", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Yellow", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#F1FA8C", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Yellow (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#F1FA8C", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Green", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#50FA7B", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Green (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#50FA7B", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Cyan", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#8BE9FD", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Cyan (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#8BE9FD", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Purple", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#BD93F9", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Purple (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#BD93F9", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Pink", { activeBackground: "#282A36", activeForeground: "#F8F8F2", borderColor: "#FF79C6", inactiveBackground: "#44475A" });
    defaultColorCodes.set("Dracula Pink (light)", { activeBackground: "#F8F8F2", activeForeground: "#282A36", borderColor: "#FF79C6", inactiveBackground: "#44475A" });

    const invertedColorCodes: Map<string, ColorCode> = new Map();
    const originalEntries = [...defaultColorCodes.entries()];
    for (const [key, value] of originalEntries) {
        const invertedKey = key + " (inverted)";
        invertedColorCodes.set(invertedKey, {
            borderColor: value.activeBackground,
            activeBackground: value.borderColor,
            activeForeground: value.activeForeground,
            inactiveBackground: value.inactiveBackground,
        });
    }

    DEFAULT_COLOR_ENTRIES = buildDefaultColorEntries(defaultColorCodes, invertedColorCodes);
    setColorMapFromEntries(DEFAULT_COLOR_CODES, DEFAULT_COLOR_ENTRIES);

    const customColors = vscode.workspace.getConfiguration("vscode-projects").get<unknown[]>("customColorCodes", []);
    CUSTOM_COLOR_ENTRIES = parseColorEntries(customColors);
    setColorMapFromEntries(CUSTOM_COLOR_CODES, CUSTOM_COLOR_ENTRIES);
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
        throw new Error("No colors are available.");
    }
    let projectHash: number = hashStr(projectName);
    return allColors[projectHash % allColors.length];
}

export function getDefaultColor(projectName: string): ColorCode {
    const colorName = defaultColorCode(projectName);
    const color = CUSTOM_COLOR_CODES.get(colorName) || DEFAULT_COLOR_CODES.get(colorName);

    if (color === undefined) {
        throw new Error("Color not defined.");
    }

    return color;
}

export function getItems(projectName: string): utils.QuickPickItemsWithDefault {
    const defaultColorName = defaultColorCode(projectName);
    const defaultItem: ColorQuickPickItem = {
        label: defaultColorName,
        description: "(default)",
        color: getDefaultColor(projectName),
    };

    const items: vscode.QuickPickItem[] = [];

    if (CUSTOM_COLOR_ENTRIES.length > 0) {
        items.push({ label: "Custom Colors", kind: vscode.QuickPickItemKind.Separator });
        items.push(...buildQuickPickItems(CUSTOM_COLOR_ENTRIES, defaultColorName));
    }

    items.push({ label: "Default Colors", kind: vscode.QuickPickItemKind.Separator });
    items.push(...buildQuickPickItems(DEFAULT_COLOR_ENTRIES, defaultColorName));

    return {
        items: [defaultItem, ...items],
        default: defaultItem,
    };
}

export async function selectColor(
    projectName: string,
    placeHolder = "Select Color Theme",
    entries?: ColorEntry[],
    onPreview?: (color: ColorCode | undefined) => void | Thenable<void>
): Promise<ColorCode | undefined> {
    const pickerStack: Array<{ items: ColorQuickPickItem[]; placeHolder: string; }> = [
        {
            items: entries === undefined
                ? getItems(projectName).items as ColorQuickPickItem[]
                : groupQuickPickItems(entries, true),
            placeHolder,
        },
    ];

    while (pickerStack.length > 0) {
        const currentPicker = pickerStack[pickerStack.length - 1];
        const selected = await selectQuickPickItem(
            currentPicker.items,
            currentPicker.placeHolder,
            onPreview
        );

        if (selected === undefined) {
            return undefined;
        }

        if (selected.isBack) {
            pickerStack.pop();
            continue;
        }

        if (selected.colors !== undefined) {
            pickerStack.push({
                items: groupQuickPickItems(selected.colors, true),
                placeHolder: `Select ${selected.label}`,
            });
            continue;
        }

        return processSelected(selected);
    }

    return undefined;
}

export function processSelected(selectedItem: vscode.QuickPickItem): ColorCode {
    const colorItem = selectedItem as ColorQuickPickItem;
    if (colorItem.color !== undefined) {
        return colorItem.color;
    }

    const colorName = selectedItem.label;
    const color = DEFAULT_COLOR_CODES.get(colorName) || CUSTOM_COLOR_CODES.get(colorName);

    if (color === undefined) {
        throw new Error("Color not defined.");
    }
    return color;
}
