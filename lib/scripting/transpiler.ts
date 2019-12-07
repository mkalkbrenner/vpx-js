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

import { generate } from 'escodegen';
import { Program } from 'estree';
import { Grammar, Parser } from 'nearley';
import { Player } from '../game/player';
import { logger } from '../util/logger';
import { Enums, EnumsApi } from '../vpt/enums';
import { GlobalApi } from '../vpt/global-api';
import { Table } from '../vpt/table/table';
import { Stdlib } from './stdlib';
import { AmbiguityTransformer } from './transformer/ambiguity-transformer';
import { CleanupTransformer } from './transformer/cleanup-transformer';
import { EventTransformer } from './transformer/event-transformer';
import { FunctionHoistTransformer } from './transformer/function-hoist-transformer';
import { ReferenceTransformer } from './transformer/reference-transformer';
import { ScopeTransformer } from './transformer/scope-transformer';
import { WrapTransformer } from './transformer/wrap-transformer';
import { VBSHelper } from './vbs-helper';
import { VbsProxyHandler } from './vbs-proxy-handler';
import vbsGrammar from './vbscript';

//self.escodegen = require('escodegen');

// the table script function
declare function play(scope: any, table: { [key: string]: any }, enums: EnumsApi, globalApi: GlobalApi, stdlib: Stdlib, vbsHelper: VBSHelper, player: Player): void;

export class Transpiler {

	private readonly table: Table;
	private readonly player: Player;
	private readonly itemApis: { [p: string]: any };
	private readonly enumApis: EnumsApi;
	private readonly globalApi: GlobalApi;
	private readonly stdlib: Stdlib;

	constructor(table: Table, player: Player) {
		this.table = table;
		this.player = player;
		this.itemApis = this.table.getElementApis();
		this.enumApis = Enums;
		this.globalApi = new GlobalApi(this.table, player);
		this.stdlib = new Stdlib();
	}

	public transpile(vbs: string, globalFunction?: string, globalObject?: string) {

		//logger().debug(vbs);
		const then = Date.now();
		let ast = this.parse(vbs + '\n');
		logger().info('[Transpiler.transpile]: Parsed in %sms', Date.now() - then);

		let now = Date.now();
		ast = new CleanupTransformer(ast).transform();
		ast = new FunctionHoistTransformer(ast).transform();
		ast = new EventTransformer(ast, this.table.getElements()).transform();
		ast = new ReferenceTransformer(ast, this.table, this.itemApis, this.enumApis, this.globalApi, this.stdlib).transform();
		ast = new ScopeTransformer(ast).transform();
		ast = new AmbiguityTransformer(ast, this.itemApis, this.enumApis, this.globalApi, this.stdlib).transform();
		ast = new WrapTransformer(ast).transform(globalFunction, globalObject);
		logger().info('[Transpiler.transpile]: Transformed in %sms', Date.now() - now);
		//logger().debug('AST:', ast);

		now = Date.now();
		const js = this.generate(ast);
		logger().info('[Transpiler.transpile]: Generated in %sms (total transpilation time: %sms)', Date.now() - now, Date.now() - then);
		logger().debug(js);

		return js;
	}

	public execute(vbs: string, globalScope: any, globalObject?: string) {

		globalObject = globalObject || (typeof window !== 'undefined' ? 'window' : (typeof self !== 'undefined' ? 'self' : 'global'));
		const js = this.transpile(vbs, 'play', globalObject);

		// tslint:disable-next-line:no-eval
		eval('//@ sourceURL=tablescript.js\n' + js);
		play(new Proxy(globalScope, new VbsProxyHandler()), this.itemApis, this.enumApis, this.globalApi, this.stdlib, new VBSHelper(this), this.player);
	}

	private parse(vbs: string): Program {

		const parser = new Parser(Grammar.fromCompiled(vbsGrammar));
		parser.feed(vbs);
		/* istanbul ignore if */
		if (parser.results.length === 0) {
			throw new Error('Parser returned no results.');
		}
		return parser.results[0];
	}

	private generate(ast: Program): string {
		return generate(ast);
	}
}
