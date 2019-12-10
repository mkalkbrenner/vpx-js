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

import { Storage } from '../..';
import { ReadResult } from '../../io/ole-doc';
import { SoundOutTypes } from '../enums';
import { ItemData } from '../item-data';

export class PinSoundData extends ItemData {

	public path!: string;
	public internalName!: string;
	public wfx!: WaveFormat;

	/**
	 * Sound data start
	 */
	public offset: number = 0;

	/**
	 * Sound data length
	 */
	public len: number = 0;

	private i = 0;
	private outputTarget: number = SoundOutTypes.Table;
	private volume!: number;
	private balance!: number;
	private fade!: number;

	public static async fromStorage(storage: Storage, itemName: string): Promise<PinSoundData> {
		const soundData = new PinSoundData(itemName);
		await storage.streamFiltered(itemName, 0, soundData.stream.bind(soundData));
		return soundData;
	}

	public constructor(itemName: string) {
		super(itemName);
	}

	public getHeader(): Buffer {
		const header = Buffer.alloc(44);
		header.write('RIFF', 0);
		header.writeInt32LE(this.len + 36, 4); // 9411670
		header.write('WAVE', 8);
		header.write('fmt ', 12);
		header.writeInt32LE(16, 16);
		header.writeInt16LE(this.wfx.formatTag, 20);
		header.writeInt16LE(this.wfx.channels, 22);
		header.writeInt32LE(this.wfx.samplesPerSec, 24);
		header.writeInt32LE(this.wfx.samplesPerSec * this.wfx.bitsPerSample * this.wfx.channels / 8, 28);
		header.writeInt16LE(this.wfx.blockAlign, 32);
		header.writeInt16LE(this.wfx.bitsPerSample, 34);
		header.write('data', 36);
		header.writeInt32LE(this.len, 40);
		return header;
	}

	private async stream(result: ReadResult): Promise<number | null> {
		const len = this.getInt(result.data);
		this.i++;
		switch (this.i) {
			case 1: this.name = this.getString(result.data, len + 4); return len + 4;
			case 2: this.path = this.getString(result.data, len + 4); return len + 4;
			case 3: this.internalName = this.getString(result.data, len + 4); return len + 4;
			case 4: this.wfx = new WaveFormat(result.data); return WaveFormat.STRUCT_SIZE;
			case 5:
				this.len = this.getInt(result.data);
				this.offset = result.storageOffset + 4;
				return this.len + 4;
			case 6: this.outputTarget = result.data.readUInt8(0); return 1;
			case 7: this.volume = this.getInt(result.data); return 4;
			case 8: this.balance = this.getInt(result.data); return 4;
			case 9: this.fade = this.getInt(result.data); return 4;
			case 10: this.volume = this.getInt(result.data); return 4;
		}
		return null;
	}
}

export class WaveFormat {

	public static readonly STRUCT_SIZE = 18;

	/**
	 * Format type
	 */
	public formatTag: number;

	/**
	 * Number of channels (i.e. mono, stereo...)
	 */
	public channels: number;

	/**
	 * Sample rate
	 */
	public samplesPerSec: number;

	/**
	 * For buffer estimation
	 */
	public avgBytesPerSec: number;

	/**
	 * Block size of data
	 */
	public blockAlign: number;
	/**
	 * Number of bits per sample of mono data
	 */
	public bitsPerSample: number;

	/**
	 * The count in bytes of the size of extra information (after cbSize)
	 */
	public cbSize: number;

	constructor(data: Buffer) {
		this.formatTag = data.readUInt16LE(0);
		this.channels = data.readUInt16LE(2);
		this.samplesPerSec = data.readUInt32LE(4);
		this.avgBytesPerSec = data.readUInt32LE(8);
		this.blockAlign = data.readUInt16LE(12);
		this.bitsPerSample = data.readUInt16LE(14);
		this.cbSize = data.readUInt16LE(16);
	}
}