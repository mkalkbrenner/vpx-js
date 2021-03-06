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

import { IRenderable, RenderInfo } from '../../game/irenderable';
import { Matrix3D } from '../../math/matrix3d';
import { BufferGeometry, Group, Matrix4, MeshStandardMaterial, Object3D, PointLight } from '../../refs.node';
import { progress } from '../../util/logger';
import { Pool } from '../../util/object-pool';
import { ItemState } from '../../vpt/item-state';
import { LightData } from '../../vpt/light/light-data';
import { LightState } from '../../vpt/light/light-state';
import { Material } from '../../vpt/material';
import { Mesh } from '../../vpt/mesh';
import { Table, TableGenerateOptions } from '../../vpt/table/table';
import { Texture } from '../../vpt/texture';
import { IRenderApi, MeshConvertOptions } from '../irender-api';
import { ThreeConverter } from './three-converter';
import { ThreeLightGenerator } from './three-light-generator';
import { ThreeLightMeshGenerator } from './three-light-mesh-generator';
import { ThreeMapGenerator } from './three-map-generator';
import { ThreeMaterialGenerator } from './three-material-generator';
import { releaseGeometry, ThreeMeshGenerator } from './three-mesh-generator';
import { ThreePlayfieldMeshGenerator } from './three-playfield-mesh-generator';

export class ThreeRenderApi implements IRenderApi<Object3D, BufferGeometry, PointLight> {

	public static readonly SCALE = 0.05;
	public static readonly SHADOWS = true;

	public static POOL = {
		Matrix4: new Pool<Matrix4>(Matrix4),
		BufferGeometry: new Pool<BufferGeometry>(BufferGeometry),
	};

	private readonly converter: ThreeConverter;
	private readonly meshConvertOpts: MeshConvertOptions;
	private readonly playfieldGenerator: ThreePlayfieldMeshGenerator;
	private readonly lightMeshGenerator: ThreeLightMeshGenerator;
	private readonly meshGenerator = new ThreeMeshGenerator();
	private readonly mapGenerator: ThreeMapGenerator;
	private readonly materialGenerator: ThreeMaterialGenerator;
	private readonly lightGenerator: ThreeLightGenerator;

	constructor(opts?: MeshConvertOptions) {
		this.meshConvertOpts = opts || {
			applyMaterials: false,
			optimizeTextures: false,
		};
		this.mapGenerator = new ThreeMapGenerator(this.meshConvertOpts.applyTextures);
		this.materialGenerator = new ThreeMaterialGenerator(this.mapGenerator);
		this.converter = new ThreeConverter(this.meshGenerator, this.mapGenerator, this.materialGenerator, this.meshConvertOpts);
		this.playfieldGenerator = new ThreePlayfieldMeshGenerator();
		this.lightMeshGenerator = new ThreeLightMeshGenerator();
		this.lightGenerator = new ThreeLightGenerator();
	}

	public async preloadTextures(textures: Texture[], table: Table): Promise<void> {
		progress().show('Pre-loading textures');
		await this.mapGenerator.loadTextures(textures, table);
	}

	public transformScene(scene: Group, table: Table): void {
		const dim = table.getDimensions();
		scene.rotateX(Math.PI / 2);
		scene.translateY(-dim.height * ThreeRenderApi.SCALE / 2);
		scene.translateX(-dim.width * ThreeRenderApi.SCALE / 2);
		scene.scale.set(ThreeRenderApi.SCALE, ThreeRenderApi.SCALE, ThreeRenderApi.SCALE);
	}

	public createParentNode(name: string): Group {
		const group = new Group();
		group.name = name;
		return group;
	}

	public createPointLight(lightData: LightData): PointLight {
		return this.lightGenerator.createPointLight(lightData);
	}

	public addChildToParent(group: Group, obj: Object3D | Group): void {
		group.add(obj);
	}

	public findInGroup(group: Group, name: string): Object3D | undefined {
		return group.children.find(c => c.name === name);
	}

	public removeFromParent(group: Group, obj: Object3D | Group): void {
		/* istanbul ignore next */
		if (!obj) {
			return;
		}
		group.remove(obj);
	}

	public removeChildren(node: Object3D | undefined): void {
		/* istanbul ignore next */
		if (!node) {
			return;
		}
		if (node.children) {
			node.remove(...node.children);
		}
	}

	public applyMatrixToNode(matrix: Matrix3D, obj: Object3D): void {
		/* istanbul ignore next */
		if (!obj) {
			return;
		}
		/* istanbul ignore if */
		if (!obj.matrix) {
			obj.matrix = new Matrix4();
		} else {
			obj.matrix.identity();
		}
		const m4 = ThreeRenderApi.POOL.Matrix4.get();
		m4.set(
			matrix._11, matrix._21, matrix._31, matrix._41,
			matrix._12, matrix._22, matrix._32, matrix._42,
			matrix._13, matrix._23, matrix._33, matrix._43,
			matrix._14, matrix._24, matrix._34, matrix._44,
		);
		obj.applyMatrix(m4);
		ThreeRenderApi.POOL.Matrix4.release(m4);
	}

	public applyVisibility(isVisible: boolean | number, obj: Object3D): void {
		/* istanbul ignore next */
		if (!obj) {
			return;
		}
		obj.visible = !!isVisible;
		if (obj.children && obj.children.length > 0) {
			for (const child of obj.children) {
				child.visible = !!isVisible;
			}
		}
	}

	public applyMeshToNode(mesh: Mesh, obj: Object3D): void {
		/* istanbul ignore next */
		if (!obj) {
			return;
		}
		const destGeo = (obj as any).geometry;
		const srcGeo = this.meshGenerator.convertToBufferGeometry(mesh);

		if (srcGeo.attributes.position.array.length !== destGeo.attributes.position.array.length) {
			throw new Error(`Trying to apply geometry of ${srcGeo.attributes.position.array.length} positions to ${destGeo.attributes.position.array.length} positions.`);
		}
		for (let i = 0; i < destGeo.attributes.position.array.length; i++) {
			destGeo.attributes.position.array[i] = srcGeo.attributes.position.array[i];
		}
		destGeo.attributes.position.needsUpdate = true;
		releaseGeometry(srcGeo);
	}

	public applyLighting(state: LightState, initialIntensity: number, obj: Object3D | undefined): void {
		this.lightGenerator.applyLighting(state, initialIntensity, obj);
	}

	public applyMaterial(obj?: Object3D, material?: Material, map?: string, normalMap?: string, envMap?: string, emissiveMap?: string): void {
		/* istanbul ignore next */
		if (!obj) {
			return;
		}
		if (obj.children && obj.children.length > 0) {
			for (const child of obj.children) {
				const threeMaterial: MeshStandardMaterial = (child as any).material;
				this.materialGenerator.applyMaterial(threeMaterial, material);
				this.materialGenerator.applyMap(threeMaterial, map);
				this.materialGenerator.applyNormalMap(threeMaterial, normalMap);
				this.materialGenerator.applyEnvMap(threeMaterial, envMap);
				this.materialGenerator.applyEmissiveMap(threeMaterial, material, emissiveMap);
			}
		} else {
			const threeMaterial: MeshStandardMaterial = (obj as any).material;
			this.materialGenerator.applyMaterial(threeMaterial, material);
			this.materialGenerator.applyMap(threeMaterial, map);
			this.materialGenerator.applyNormalMap(threeMaterial, normalMap);
			this.materialGenerator.applyEnvMap(threeMaterial, envMap);
			this.materialGenerator.applyEmissiveMap(threeMaterial, material, emissiveMap);
		}
	}

	public createObjectFromRenderable(renderable: IRenderable<ItemState>, table: Table, opts: TableGenerateOptions): Group {
		return this.converter.createObject(renderable, table, this, opts);
	}

	public createMesh(obj: RenderInfo<BufferGeometry>): Object3D {
		return this.converter.createMesh(obj);
	}

	public createLightGeometry(lightData: LightData, table: Table): BufferGeometry {
		return this.lightMeshGenerator.createLight(lightData, table);
	}

	public createPlayfieldGeometry(table: Table, opts: TableGenerateOptions): BufferGeometry {
		return this.playfieldGenerator.createPlayfieldGeometry(table, opts);
	}

}
