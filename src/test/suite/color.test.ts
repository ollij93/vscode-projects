import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as color from '../../color';

suite('Color Test Suite', () => {
    let getConfigurationStub: sinon.SinonStub;
    let createQuickPickStub: sinon.SinonStub;
    let quickPickPlans: Array<(quickPick: FakeQuickPick) => void>;

    interface FakeQuickPick extends vscode.QuickPick<vscode.QuickPickItem> {
        triggerActive(items: vscode.QuickPickItem[]): void;
        triggerAccept(): void;
        triggerValue(value: string): void;
    }

    function createFakeQuickPick(): FakeQuickPick {
        const activeCallbacks: Array<(items: readonly vscode.QuickPickItem[]) => void> = [];
        const acceptCallbacks: Array<() => void> = [];
        const hideCallbacks: Array<() => void> = [];
        const valueCallbacks: Array<(value: string) => void> = [];

        const quickPick = {
            items: [] as readonly vscode.QuickPickItem[],
            selectedItems: [] as readonly vscode.QuickPickItem[],
            activeItems: [] as readonly vscode.QuickPickItem[],
            value: "",
            placeholder: "",
            title: undefined,
            step: undefined,
            totalSteps: undefined,
            enabled: true,
            busy: false,
            ignoreFocusOut: false,
            matchOnDescription: false,
            matchOnDetail: false,
            keepScrollPosition: false,
            buttons: [],
            show() {
                const plan = quickPickPlans.shift();
                if (plan) {
                    plan(this as unknown as FakeQuickPick);
                }
            },
            hide() {
                hideCallbacks.forEach((callback) => callback());
            },
            dispose() {
                return undefined;
            },
            onDidChangeActive(callback: (items: readonly vscode.QuickPickItem[]) => void) {
                activeCallbacks.push(callback);
                return new vscode.Disposable(() => undefined);
            },
            onDidAccept(callback: () => void) {
                acceptCallbacks.push(callback);
                return new vscode.Disposable(() => undefined);
            },
            onDidHide(callback: () => void) {
                hideCallbacks.push(callback);
                return new vscode.Disposable(() => undefined);
            },
            onDidChangeSelection() {
                return new vscode.Disposable(() => undefined);
            },
            onDidChangeValue(callback: (value: string) => void) {
                valueCallbacks.push(callback);
                return new vscode.Disposable(() => undefined);
            },
            onDidTriggerButton() {
                return new vscode.Disposable(() => undefined);
            },
            onDidTriggerItemButton() {
                return new vscode.Disposable(() => undefined);
            },
            triggerActive(items: vscode.QuickPickItem[]) {
                this.activeItems = items;
                activeCallbacks.forEach((callback) => callback(items));
            },
            triggerAccept() {
                acceptCallbacks.forEach((callback) => callback());
            },
            triggerValue(value: string) {
                this.value = value;
                valueCallbacks.forEach((callback) => callback(value));
            },
        };

        return quickPick as unknown as FakeQuickPick;
    }

    setup(() => {
        // Stub the configuration to control custom colors for tests
        getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
        quickPickPlans = [];
        createQuickPickStub = sinon.stub(vscode.window, 'createQuickPick').callsFake(createFakeQuickPick);
    });

    teardown(() => {
        sinon.restore();
    });

    test('Test getItems without custom colors', () => {
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => {
                if (key === 'customColorCodes') {
                    return [];
                }
                return undefined;
            }
        } as vscode.WorkspaceConfiguration);

        color.loadColorCodes();

        const items = color.getItems("");
        assert.strictEqual(items.items[0].description, "(default)");
        assert.strictEqual(items.items[0], items.default);

        // Check for the 'Default Colors' separator
        const separator = items.items.find(item => item.kind === vscode.QuickPickItemKind.Separator && item.label === 'Default Colors');
        assert.ok(separator, "'Default Colors' separator should exist");

        assert.ok(items.items.find(item => item.label === 'NFL'), "'NFL' group should exist");
        assert.ok(items.items.find(item => item.label === 'Basic'), "'Basic' group should exist");
        assert.ok(items.items.find(item => item.label === 'Dracula'), "'Dracula' group should exist");
        assert.strictEqual(items.items.find(item => item.label === 'AFC'), undefined, "Conference groups should not appear at the top level");
        assert.strictEqual(items.items.find(item => item.label === 'NFC'), undefined, "Conference groups should not appear at the top level");
        assert.strictEqual(items.items.find(item => item.label === 'Chicago Bears'), undefined, "Leaf colors should not appear at the top level");
        assert.strictEqual(items.items.find(item => item.label === 'Red'), undefined, "Basic leaf colors should not appear at the top level");
        assert.strictEqual(items.items.find(item => item.label === 'Dracula Red'), undefined, "Dracula leaf colors should not appear at the top level");
    });

    test('Test getItems with custom color groups', () => {
        const customColors = [
            {
                name: 'My Custom Group',
                colors: [
                    { name: 'My Custom Color', activeBackground: '#111', activeForeground: '#fff', borderColor: '#222', inactiveBackground: '#000' },
                ],
            },
        ];
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => {
                if (key === 'customColorCodes') {
                    return customColors;
                }
                return undefined;
            }
        } as vscode.WorkspaceConfiguration);

        color.loadColorCodes();

        const items = color.getItems("");

        // Check for the 'Custom Colors' separator
        const customSeparator = items.items.find(item => item.kind === vscode.QuickPickItemKind.Separator && item.label === 'Custom Colors');
        assert.ok(customSeparator, "'Custom Colors' separator should exist");

        // Check for the custom color group item
        const customGroupItem = items.items.find(item => item.label === 'My Custom Group');
        assert.ok(customGroupItem, "Custom color group should exist");
        assert.strictEqual(customGroupItem?.description, "(group)");
        assert.strictEqual(items.items.find(item => item.label === 'My Custom Color'), undefined, "Nested custom colors should not appear at the top level");
    });

    test('Test processSelected', () => {
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => []
        } as vscode.WorkspaceConfiguration);
        color.loadColorCodes();

        let item = { label: "Chicago Bears" };
        assert.deepStrictEqual(
            color.processSelected(item),
            color.DEFAULT_COLOR_CODES.get("Chicago Bears")
        );

        item = { label: "NO COLOR" };
        assert.throws(() => { color.processSelected(item); }, "Should throw for non-existent color");
    });

    test('Test selectColor enters groups recursively', async () => {
        const customColors = [
            {
                name: 'My Custom Group',
                colors: [
                    { name: 'My Custom Color', activeBackground: '#111', activeForeground: '#fff', borderColor: '#222', inactiveBackground: '#000' },
                ],
            },
        ];
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => {
                if (key === 'customColorCodes') {
                    return customColors;
                }
                return undefined;
            }
        } as vscode.WorkspaceConfiguration);
        color.loadColorCodes();

        quickPickPlans.push((quickPick) => {
            const selectedItem = quickPick.items.find(item => item.label === 'My Custom Group');
            if (!selectedItem) {
                throw new Error('Missing My Custom Group item');
            }
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });
        quickPickPlans.push((quickPick) => {
            const selectedItem = quickPick.items.find(item => item.label === 'My Custom Color');
            if (!selectedItem) {
                throw new Error('Missing My Custom Color item');
            }
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });

        const selectedColor = await color.selectColor("");
        assert.deepStrictEqual(selectedColor, {
            activeBackground: '#111',
            activeForeground: '#fff',
            borderColor: '#222',
            inactiveBackground: '#000',
        });
        assert.strictEqual(createQuickPickStub.callCount, 2);
    });

    test('Test selectColor returns undefined on cancel', async () => {
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => []
        } as vscode.WorkspaceConfiguration);
        color.loadColorCodes();

        quickPickPlans.push((quickPick) => {
            quickPick.hide();
        });

        const selectedColor = await color.selectColor("");
        assert.strictEqual(selectedColor, undefined);
    });

    test('Test selectColor search expands grouped entries at the top level', async () => {
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => []
        } as vscode.WorkspaceConfiguration);
        color.loadColorCodes();

        quickPickPlans.push((quickPick) => {
            assert.strictEqual(quickPick.items.find(item => item.label === 'Seattle Seahawks'), undefined);
            quickPick.triggerValue('seahawks');

            const selectedItem = quickPick.items.find(item => item.label === 'Seattle Seahawks');
            if (!selectedItem) {
                throw new Error('Missing Seattle Seahawks item');
            }
            assert.strictEqual(selectedItem.description, 'NFL');
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });

        const selectedColor = await color.selectColor("");
        assert.deepStrictEqual(selectedColor, color.DEFAULT_COLOR_CODES.get("Seattle Seahawks"));
        assert.strictEqual(createQuickPickStub.callCount, 1);
    });

    test('Test selectColor can go back to the parent group list', async () => {
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => []
        } as vscode.WorkspaceConfiguration);
        color.loadColorCodes();

        quickPickPlans.push((quickPick) => {
            const selectedItem = quickPick.items.find(item => item.label === 'NFL');
            if (!selectedItem) {
                throw new Error('Missing NFL item');
            }
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });
        quickPickPlans.push((quickPick) => {
            const backItem = quickPick.items.find(item => item.label === 'Back');
            if (!backItem) {
                throw new Error('Missing Back item');
            }
            assert.strictEqual(quickPick.items.find(item => item.label === 'AFC'), undefined);
            assert.strictEqual(quickPick.items.find(item => item.label === 'NFC'), undefined);
            assert.ok(quickPick.items.find(item => item.label === 'Chicago Bears'));
            quickPick.triggerActive([backItem]);
            quickPick.selectedItems = [backItem];
            quickPick.triggerAccept();
        });
        quickPickPlans.push((quickPick) => {
            const selectedItem = quickPick.items.find(item => item.label === 'Basic');
            if (!selectedItem) {
                throw new Error('Missing Basic item');
            }
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });
        quickPickPlans.push((quickPick) => {
            const selectedItem = quickPick.items.find(item => item.label === 'Red');
            if (!selectedItem) {
                throw new Error('Missing Red item');
            }
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });

        const selectedColor = await color.selectColor("");
        assert.deepStrictEqual(selectedColor, color.DEFAULT_COLOR_CODES.get("Red"));
        assert.strictEqual(createQuickPickStub.callCount, 4);
    });

    test('Test grouped picker shows Back separately and focuses the first real item', async () => {
        getConfigurationStub.withArgs('vscode-projects').returns({
            get: (key: string) => []
        } as vscode.WorkspaceConfiguration);
        color.loadColorCodes();

        quickPickPlans.push((quickPick) => {
            const selectedItem = quickPick.items.find(item => item.label === 'Basic');
            if (!selectedItem) {
                throw new Error('Missing Basic item');
            }
            quickPick.triggerActive([selectedItem]);
            quickPick.selectedItems = [selectedItem];
            quickPick.triggerAccept();
        });
        quickPickPlans.push((quickPick) => {
            assert.strictEqual(quickPick.items[0].label, 'Back');
            assert.strictEqual(quickPick.items[1].kind, vscode.QuickPickItemKind.Separator);
            assert.strictEqual(quickPick.activeItems[0]?.label, 'Red');
            quickPick.hide();
        });

        const selectedColor = await color.selectColor("");
        assert.strictEqual(selectedColor, undefined);
        assert.strictEqual(createQuickPickStub.callCount, 2);
    });
});
