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

import { Expression, ExpressionStatement, MemberExpression } from 'estree';
import { Token } from 'moo';
import * as estree from './estree';

export function stmt1(result: [MemberExpression, null, Token, null, Expression]): ExpressionStatement {
	const left = result[0];
	const right = result[4];
	return estree.expressionStatement(estree.assignmentExpression(left, '=', right));
}

export function stmt2(result: [Token, null, MemberExpression, null, Token, null, Expression]): ExpressionStatement {
	const left = result[2];
	const right = result[6];
	return estree.expressionStatement(estree.assignmentExpression(left, '=', right));
}

export function stmt3(
	result: [Token, null, MemberExpression, null, Token, null, Token, null, Expression],
): ExpressionStatement {
	const left = result[2];
	const right = result[8];
	return estree.expressionStatement(estree.assignmentExpression(left, '=', right));
}
