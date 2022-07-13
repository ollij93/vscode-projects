import * as assert from 'assert';

import * as color from '../../color';

suite('Color Test Suite', () => {
    test('Test getItems', () => {
        // Empty project name gives hash of 0 and first color code is selected
        let items = color.getItems("");
        assert.strictEqual(items.items[0].label, "Arizona Cardinals");
        assert.strictEqual(items.items[0].description, "(default)");
        assert.strictEqual(items.items[0], items.default);
        // Check all the expected items are included
        assert.strictEqual(items.items.length, 32);
        // Check another project has a different item as the default
        items = color.getItems("TEST");
        assert.notStrictEqual(items.items[0].label, "Arizona Cardinals");
        assert.strictEqual(items.items[1].label, "Arizona Cardinals");
        assert.strictEqual(items.items[0], items.default);
    });

    test('Test processSelected', () => {
        let item = { label: "Chicago Bears" };
        assert.strictEqual(
            color.processSelected(item),
            color.COLOR_CODES.get("Chicago Bears")
        );

        item = { label: "NO COLOR" };
        assert.throws(() => {color.processSelected(item);});
    });
});

