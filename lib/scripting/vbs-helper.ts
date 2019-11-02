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

import { Transpiler } from './transpiler';

export class VBSHelper {

	private readonly transpiler: Transpiler;
	private transpileCount = 0;

	constructor(transpiler: Transpiler) {
		this.transpiler = transpiler;
	}

	/**
	 * Recursive function to create a multi-dimension array.
	 */

	public dim(dimensions: number[], position: number = 0): any[] {
		const dimension = dimensions && dimensions.length ? dimensions[position] + 1 : 0;
		const array = new Array(dimension).fill(undefined);
		if (++position < dimensions.length) {
			for (let index = 0; index < dimension; index++) {
				array[index] = this.dim(dimensions, position);
			}
		}
		return array;
	}

	/**
	 * Function to re-dimension an array and preserve values if requested.
	 */

	public redim(array: any[], dimensions: number[], preserve: boolean = false): any[] {
		let tmpArray = array;
		for (let index = 0; index < dimensions.length - 1; index++) {
			const dimension = dimensions[index] + 1;
			if (tmpArray.length !== dimension) {
				throw new Error('Only last dimension can be changed');
			}
			tmpArray = tmpArray[0];
		}
		if (!preserve) {
			return this.dim(dimensions);
		}
		return this.redim_resize(array, dimensions);
	}

	public transpileInline(vbs: string) {
		// don't show oneliners in devtools
		if (vbs.length > 150) {
			return `//@ sourceURL=inline${this.transpileCount++}.js\n${this.transpiler.transpile(vbs)}`;
		} else {
			return this.transpiler.transpile(vbs);
		}		
	}

	/**
	 * Recursive helper function to resize a multi-dimension array.
	 */

	private redim_resize(array: any[], dimensions: number[], position: number = 0): any[] {
		const dimension = dimensions[position] + 1;
		if (position === dimensions.length - 1) {
			if (array.length > dimension) {
				array.splice(-(array.length - dimension));
			} else if (array.length < dimension) {
				array = array.concat(new Array(dimension - array.length).fill(undefined));
			}
		}
		if (++position < dimensions.length) {
			for (let index = 0; index < dimension; index++) {
				array[index] = this.redim_resize(array[index], dimensions, position);
			}
		}
		return array;
	}

	public getOrCall(obj: any, param?: number) {
		if (typeof obj === 'function') {
			return typeof param === 'undefined' ? obj.bind(obj)() : obj.bind(obj)(param);
		}
		if (typeof param === 'undefined') {
			return obj;
		}
		return obj[param];
	}

}
