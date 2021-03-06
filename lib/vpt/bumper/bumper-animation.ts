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

import { IAnimation } from '../../game/ianimatable';
import { PlayerPhysics } from '../../game/player-physics';
import { Vertex3D } from '../../math/vertex3d';
import { Table } from '../table/table';
import { BumperData } from './bumper-data';
import { BumperState } from './bumper-state';

export class BumperAnimation implements IAnimation {

	private readonly data: BumperData;
	private readonly state: BumperState;

	private timeMsec: number = 0;
	private ringAnimate: boolean = false;
	private ringDown: boolean = false;
	private doSkirtAnimation: boolean = false;
	private skirtCounter: number = 0;

	public enableSkirtAnimation: boolean = true;
	public hitEvent: boolean = false; // m_bumperanim_hitEvent
	public ballHitPosition: Vertex3D = new Vertex3D();

	constructor(data: BumperData, state: BumperState) {
		this.data = data;
		this.state = state;
	}

	public init(timeMsec: number): void {
		this.timeMsec = timeMsec;
	}

	public updateAnimation(newTimeMsec: number, table: Table): void {

		const oldTimeMsec = this.timeMsec < newTimeMsec ? this.timeMsec : newTimeMsec;
		this.timeMsec = newTimeMsec;
		const diffTimeMsec = (newTimeMsec - oldTimeMsec);
		const state = this.hitEvent ? 1 : 0;    // 0 = not hit, 1 = hit

		this.updateRingAnimation(state, diffTimeMsec, table);
		this.updateSkirtAnimation(state, diffTimeMsec);
	}

	private updateRingAnimation(state: number, diffTimeMsec: number, table: Table) {
		if (this.data.isRingVisible) {
			const limit = this.data.ringDropOffset + (this.data.heightScale * 0.5) * table.getScaleZ();
			if (state === 1) {
				this.ringAnimate = true;
				this.ringDown = true;
				this.hitEvent = false;
			}
			if (this.ringAnimate) {
				let step = this.data.ringSpeed * table.getScaleZ();
				if (this.ringDown) {
					step = -step;
				}
				this.state.ringOffset += step * diffTimeMsec;
				if (this.ringDown) {
					if (this.state.ringOffset <= -limit) {
						this.state.ringOffset = -limit;
						this.ringDown = false;
					}
				} else {
					if (this.state.ringOffset >= 0.0) {
						this.state.ringOffset = 0.0;
						this.ringAnimate = false;
					}
				}
			}
		}
	}

	private updateSkirtAnimation(state: number, diffTimeMsec: number) {
		if (this.data.isSkirtVisible) {
			if (this.enableSkirtAnimation) {
				if (state === 1) {
					this.doSkirtAnimation = true;
					this.updateSkirtState();
					this.skirtCounter = 0.0;
				}
				if (this.doSkirtAnimation) {
					this.skirtCounter += diffTimeMsec;
					if (this.skirtCounter > 160.0) {
						this.doSkirtAnimation = false;
						this.resetSkirtState();
					}
				}
			}
		} else {
			this.resetSkirtState();
		}
	}

	private resetSkirtState() {
		this.state.skirtRotX = 0;
		this.state.skirtRotY = 0;
	}

	private updateSkirtState(): void {
		const SKIRT_TILT = 5.0;
		const hitX = this.ballHitPosition.x;
		const hitY = this.ballHitPosition.y;
		let dy = Math.abs(hitY - this.data.center.y);
		if (dy === 0.0) {
			dy = 0.000001;
		}
		const dx = Math.abs(hitX - this.data.center.x);
		const skirtA = Math.tan(dx / dy);
		let rotX = Math.cos(skirtA) * SKIRT_TILT;
		let rotY = Math.sin(skirtA) * SKIRT_TILT;
		if (this.data.center.y < hitY) {
			rotX = -rotX;
		}
		if (this.data.center.x > hitX) {
			rotY = -rotY;
		}
		this.state.skirtRotX = rotX;
		this.state.skirtRotY = rotY;
	}
}
