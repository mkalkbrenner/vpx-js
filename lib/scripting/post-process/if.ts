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

import { BlockStatement, Comment, Expression, IfStatement, Statement } from 'estree';
import { Token } from 'moo';
import * as estree from '../estree';

export function stmt(
	result: [Token, null, Expression, null, Token, Comment[], BlockStatement, Statement, Token, null, Token, Comment[]],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const alternate = result[7];
	const leadingComments = result[5] || [];
	const trailingComments = result[11] || [];
	return estree.ifStatement(test, consequent, alternate, leadingComments, trailingComments);
}

export function stmtInline(
	result: [Token, null, Expression, null, Token, null, Statement, null, Statement, null, Token],
): IfStatement {
	const test = result[2];
	const consequent = result[6];
	const alternate = result[8];
	return estree.ifStatement(test, consequent, alternate, [], []);
}

export function elseStmt1(
	result: [Token, null, Expression, null, Token, Comment[], BlockStatement, Statement],
): IfStatement {
	const expr = result[2];
	const comments = result[5] || [];
	const consequent = result[6];
	const alternate = result[7];
	return estree.ifStatement(expr, consequent, alternate, [], comments);
}

export function elseStmt2(
	result: [Token, null, Expression, null, Token, null, Statement, Comment[], Statement],
): IfStatement {
	const expr = result[2];
	const consequent = result[6];
	const comments = result[7] || [];
	const alternate = result[8];
	return estree.ifStatement(expr, consequent, alternate, [], comments);
}

export function elseStmt3(result: [Token, null, Statement, Comment[]]): Statement {
	const statement = result[2];
	const comments = result[3] || [];
	statement.trailingComments = comments;
	return statement;
}

export function elseStmt4(result: [Token, Comment[], BlockStatement]): Statement {
	const comments = result[1] || [];
	const statement = result[2];
	if (statement != null) {
		statement.trailingComments = comments;
	}
	return statement;
}

export function elseOpt(result: [Token, null, Statement]): Statement {
	const statement = result[2];
	return statement;
}
