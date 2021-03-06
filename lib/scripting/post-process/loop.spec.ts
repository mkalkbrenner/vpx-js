/*
 * VPDB - Virtual Pinball Database
 * Copyright (C) 2019 freezy <freezy@vpdb.io>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { expect } from 'chai';
import { Grammar } from '../grammar/grammar';
import { Transformer } from '../transformer/transformer';

let grammar: Grammar;

before(async () => {
	grammar = new Grammar();
});

describe('The VBScript transpiler - Loop', () => {
	it('should transpile a "For...Next" statement', () => {
		const vbs = `For j = 1 To 20\ntotal = total + 1\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('for (j = 1; j <= 20; j += 1) {\n    total = total + 1;\n}');
	});

	it('should transpile an empty "For...Next" statement', () => {
		const vbs = `For j = 1 To 20\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('for (j = 1; j <= 20; j += 1) {\n}');
	});

	it('should transpile an inline "For...Next" statement', () => {
		const vbs = `If mBalls Then For ii = 1 to mBalls : x = 5 : Next`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('if (mBalls) {\n    for (ii = 1; ii <= mBalls; ii += 1) {\n        x = 5;\n    }\n}');
	});

	it('should transpile an inline "For/Each...Next" statement', () => {
		const vbs = `If BallsInPlay>=1 Then For Each x In BulbP:x.image="Bulb_On":x.TriggerSingleUpdate:Next`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(
			"if (BallsInPlay >= 1) {\n    for (x of BulbP) {\n        x.image = 'Bulb_On';\n        x.TriggerSingleUpdate();\n    }\n}",
		);
	});

	it('should transpile a "For/Step...Next" increment statement ', () => {
		const vbs = `For j = 1 To 20 Step 3\ntotal = total + 1\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('for (j = 1; 3 < 0 ? j >= 20 : j <= 20; j += 3) {\n    total = total + 1;\n}');
	});

	it('should transpile a "For/Step...Next" decrement statement ', () => {
		const vbs = `For j = 1 To 20 Step -3\ntotal = total + 1\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('for (j = 1; -3 < 0 ? j >= 20 : j <= 20; j += -3) {\n    total = total + 1;\n}');
	});

	it('should transpile a "For/Each...Next" statement', () => {
		const vbs = `For Each x In students\ntotal = total + x\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('for (x of students) {\n    total = total + x;\n}');
	});

	it('should transpile an empty "For/Each...Next" statement', () => {
		const vbs = `For Each x In students\nNext`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('for (x of students) {\n}');
	});

	it('should transpile a "Do While...Loop" statement', () => {
		const vbs = `Dim x\nx = 1\nDo While x < 5\nx = x + 1\nLoop`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\nwhile (x < 5) {\n    x = x + 1;\n}');
	});

	it('should transpile an empty "Do While...Loop" statement', () => {
		const vbs = `Dim x\nx = 1\nDo While x < 5\nLoop`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\nwhile (x < 5) {\n}');
	});

	it('should transpile a "Do Until...Loop" statement', () => {
		const vbs = `Dim x\nx = 1\nDo Until x = 5\nx = x + 1\nLoop`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`let x;\nx = 1;\ndo {\n    if (${Transformer.VBSHELPER_NAME}.equals(x, 5))\n        break;\n    x = x + 1;\n} while (true);`);
	});

	it('should transpile an empty "Do Until...Loop" statement', () => {
		const vbs = `Dim x\nx = 1\nDo Until x = 5\nLoop`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal(`let x;\nx = 1;\ndo {\n    if (${Transformer.VBSHELPER_NAME}.equals(x, 5))\n        break;\n} while (true);`);
	});

	it('should transpile a "Do...Loop While" statement', () => {
		const vbs = `Dim x\nx = 7\nDo\nx = x + 1\nLoop While x < 5`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 7;\ndo {\n    x = x + 1;\n} while (x < 5);');
	});

	it('should transpile an empty "Do...Loop While" statement', () => {
		const vbs = `Dim x\nx = 7\nDo\nLoop While x < 5`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 7;\ndo {\n} while (x < 5);');
	});

	it('should transpile a "Do...Loop Until" statement', () => {
		const vbs = `Dim i\ni = 10\nDo\ni = i + 1\nLoop Until i < 15`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let i;\ni = 10;\ndo {\n    i = i + 1;\n    if (i < 15)\n        break;\n} while (true);');
	});

	it('should transpile an empty "Do...Loop Until" statement', () => {
		const vbs = `Dim i\ni = 10\nDo\nLoop Until i < 15`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let i;\ni = 10;\ndo {\n    if (i < 15)\n        break;\n} while (true);');
	});

	it('should transpile a "Do...Loop" statement', () => {
		const vbs = `Dim x\nx = 7\nDo\nx = x + 1\nLoop`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 7;\ndo {\n    x = x + 1;\n} while (true);');
	});

	it('should transpile a "While...WEnd" statement', () => {
		const vbs = `Dim x\nx = 1\nWhile x < 5\nx = x + 1\nWEnd`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\nwhile (x < 5) {\n    x = x + 1;\n}');
	});

	it('should transpile an empty "While...WEnd" statement', () => {
		const vbs = `Dim x\nx = 1\nWhile x < 5\nWEnd`;
		const js = grammar.vbsToJs(vbs);
		expect(js).to.equal('let x;\nx = 1;\nwhile (x < 5) {\n}');
	});
});
