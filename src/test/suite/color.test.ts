import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as color from '../../color';

suite('Color Test Suite', () => {
    let getConfigurationStub: sinon.SinonStub;

    setup(() => {
        // Stub the configuration to control custom colors for tests
        getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
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

        // Total items = 1 default item + 1 separator + 63 other default colors
        assert.strictEqual(items.items.length, 65, "There should be 65 items in total");
    });

    test('Test getItems with custom colors', () => {
        const customColors = [
            { name: 'My Custom Color', activeBackground: '#111', activeForeground: '#fff', borderColor: '#222', inactiveBackground: '#000' },
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

        // Check for the custom color item
        const customColorItem = items.items.find(item => item.label === 'My Custom Color');
        assert.ok(customColorItem, "Custom color item should exist");

        // Total items = 1 default item + 2 separators + 63 other default colors + 1 custom color
        assert.strictEqual(items.items.length, 67, "There should be 67 items in total");
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
});
