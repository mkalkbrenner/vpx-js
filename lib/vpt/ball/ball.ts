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

import { Object3D } from 'three';
import { Table } from '../..';
import { IHittable } from '../../game/ihittable';
import { IMovable } from '../../game/imovable';
import { IPlayable } from '../../game/iplayable';
import { IRenderable } from '../../game/irenderable';
import { Player } from '../../game/player';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { HitObject } from '../../physics/hit-object';
import { Meshes } from '../item-data';
import { TableData } from '../table/table-data';
import { VpTableExporterOptions } from '../table/table-exporter';
import { BallData } from './ball-data';
import { BallHit } from './ball-hit';
import { BallMeshGenerator } from './ball-mesh-generator';
import { BallMover } from './ball-mover';
import { BallState } from './ball-state';

export class Ball implements IPlayable, IMovable<BallState>, IHittable, IRenderable {

	public readonly state: BallState;
	public readonly data: BallData;
	private readonly meshGenerator: BallMeshGenerator;
	public readonly hit: BallHit;

	// unique ID for each ball
	public readonly id: number;

	public static idCounter = 0;

	// ugly hacks
	public oldVel: Vertex3D = new Vertex3D();

	constructor(data: BallData, state: BallState, initialVelocity: Vertex3D, tableData: TableData) {
		this.id = Ball.idCounter++;
		this.data = data;
		this.state = state;
		this.meshGenerator = new BallMeshGenerator(data);
		this.hit = new BallHit(this, data, state, initialVelocity, tableData);
	}

	public getName(): string {
		return `Ball${this.id}`;
	}

	public applyState(obj: Object3D, table: Table, player: Player): void {
		const zheight = !this.hit.isFrozen ? this.state.pos.z : this.state.pos.z - this.data.radius;
		const orientation = new Matrix3D().set([
			[this.state.orientation.matrix[0][0], this.state.orientation.matrix[1][0], this.state.orientation.matrix[2][0], 0.0],
			[this.state.orientation.matrix[0][1], this.state.orientation.matrix[1][1], this.state.orientation.matrix[2][1], 0.0],
			[this.state.orientation.matrix[0][2], this.state.orientation.matrix[1][2], this.state.orientation.matrix[2][2], 0.0],
			[0, 0, 0, 1],
		]);
		const trans = new Matrix3D().setTranslation(this.state.pos.x, this.state.pos.y, zheight);
		const matrix = new Matrix3D()
			.setScaling(this.data.radius, this.data.radius, this.data.radius)
			.preMultiply(orientation)
			.multiply(trans);

		obj.matrix = matrix.toRightHanded().toThreeMatrix4();
		obj.matrixWorldNeedsUpdate = true;
	}

	public getState(): BallState {
		return this.state;
	}

	public getMover(): BallMover {
		return this.hit.getMoverObject();
	}

	public getCollision(): CollisionEvent {
		return this.hit.coll;
	}

	public setCollision(coll: CollisionEvent) {
		return this.hit.coll = coll;
	}

	public setupPlayer(player: Player, table: Table): void {
		// there is no ball yet on player setup
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit ];
	}

	public getMeshes(table: Table, opts: VpTableExporterOptions): Meshes {
		return { ball: { mesh: this.meshGenerator.getMesh().transform(new Matrix3D().toRightHanded()) } };
	}

	public isVisible(table: Table): boolean {
		return true;
	}

	public isCollidable(): boolean {
		return true;
	}
}
