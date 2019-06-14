
class geomBase{
	constructor(){
		geomBase.geomLst.push(this);
		
	}
}

geomBase.geomLst = [];
geomBase.lastTime = 0;

geomBase.materials = [
	new THREE.MeshBasicMaterial({color:0x0099ff, 
								 transparent:true, 
								 opacity:0.2, 
								 side: THREE.DoubleSide})
];   
geomBase.mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 4 } );

geomBase.update = (angularSpeed = 0.1) => {
	let time = (new Date()).getTime();
    let timeDiff = time - geomBase.lastTime;
	let angleChange = angularSpeed * timeDiff * 2 * Math.PI / 750;
	geomBase.geomLst.forEach(e => {
		if(!!e.spin)
			e.update(angleChange);
	});
	geomBase.lastTime = time;
}

geomBase.proj = (dot, dist) => {
	dot = dot.concat();
	const factor = dist * 4 / (dist * 3 - dot.splice(3)[0]);
	return dot.map(val => val * factor);
};

geomBase.spin = (dot, rad) => {
	const dim = dot.length - 1;
	const I = math.identity(dim + 1).valueOf();

	[I[dim - 1][dim -1], I[dim - 1][dim]] = [Math.cos(rad), Math.sin(rad)];
	[I[dim][dim -1], I[dim][dim]] = [-Math.sin(rad), Math.cos(rad)];
	const ret = math.multiply(I, dot).valueOf();
	return ret;
};

geomBase.rotateM = (dim, cords, rads) => {
	let J = math.identity(dim--).valueOf();
	cords.forEach((cord, i) => {
		const I = math.identity(dim + 1).valueOf();
		[I[cord[0]][cord[0]], I[cord[0]][cord[1]]] = [Math.cos(rads[i]), -Math.sin(rads[i])];
		[I[cord[1]][cord[0]], I[cord[1]][cord[1]]] = [Math.sin(rads[i]), Math.cos(rads[i])];
		J = math.multiply(I, J);
	});
	return J;
}

geomBase.combNum = dim => k_combinations(new Array(dim).fill(0).map((e, index) => index), 2);


class hyperCube extends geomBase{
	constructor(dim, dims, offset = null, rotation = null, spin, projType = true){
		super();
		this.dim = dim;
		this.spin = !!spin ? spin : Array(dim).fill(false);
		this.dims = !!dims ? dims : Array(dim).fill(30);
		this.projType = projType;
		this.surf = this.baseSurf(dim);
		this.proj = [];
		this.mesh = [];
		this.lines = [];
		this.movSurf();
		this.extSurf();
		this.initPara(rotation);
		this.update(null, !!offset ? offset : [0, 0, 0]);
		this.lines.flat().forEach(e => scene.add(e));
		this.mesh.forEach(e => scene.add(e));
	}

	baseSurf(dim){
		let I = math.identity(dim).valueOf();
		if(!!this.dims)
			I = I.map((e, index) => {
				if(!!this.dims[index])
					e[index] = this.dims[index];
				return e;
			});
		return k_combinations(I, 2).map(e => {
			const vertices = [];
			vertices.push(math.zeros(dim).valueOf());
			vertices.push(e[0]);
			vertices.push(e[1]);
			vertices.push(math.add(e[0],e[1]).valueOf());
			vertices.co = [e[0].findIndex(e => e > 0), 
						   e[1].findIndex(e => e > 0)];
			return vertices;
		});
	}

	movSurf(){
		const offset = this.dims.map(e => -e / 2);
		this.surf = this.surf.map(vertices => {
			const ret =  vertices.map(dot => {
				return math.add(dot, offset).valueOf();
			});
			ret.co = vertices.co;
			return ret;
		});
	}

	extSurf(){
		this.surf.forEach(vertices => {
			const [...dimss] = this.dims;
			dimss[vertices.co[0]] = 0;
			dimss[vertices.co[1]] = 0;
			const combe = [];
			dimss.forEach((e, index) => {
				if(e != 0){
					const pad = math.zeros(this.dim).valueOf();
					pad[index] = this.dims[index];
					combe.push(pad);
				}
			});
			combinations(combe).forEach(comb => {
				this.surf.push(vertices.map(dot => {
					comb.forEach(op => {
						dot = math.add(dot, op).valueOf();
					});
					return dot;
				}));
			});
		});	
	}

	projSurf(type){
		if(type){
			const dist = this.surf.flat().reduce((pre, cur) => {
				const  curr = cur[3];
				return pre > curr ? pre : curr;
			});
			this.proj = this.surf.map(vertices => {
				return vertices.map(dot => {
					return geomBase.proj(dot, dist);
				});
			});
		}else{
			this.proj = this.surf.map(vertices => {
				return vertices.map(dot => {
					return dot.slice(0,3);
				});
			});
		}
	}

	movProj(offset){
		this.proj = this.proj.map(vertices => {
			return vertices.map(dot => {
				return math.add(dot, offset).valueOf();
			})
		});
	}

	initPara(r){
		if(!!r){
			this.surf = this.surf.map(vertices => {
				const spin = r.map(e => e.slice(0,2));
				const angle = r.map(e => e.slice(2,3));
				return vertices.map(dot => {
					return math.multiply(geomBase.rotateM(this.dim, spin, angle), dot);
				});
			});
		}
		this.projSurf();
		this.proj.forEach((arr, index) => {
			const vertices = arr.map(ele => {
				return new THREE.Vector3(...ele);
			});
			const faces = [new THREE.Face3(0, 1, 2), new THREE.Face3(1, 2, 3)];
			const geom = new THREE.Geometry();
			geom.vertices = vertices;
			geom.faces = faces;
			geom.computeFaceNormals(); 
			this.mesh.push(THREE.SceneUtils.createMultiMaterialObject(geom, geomBase.materials));
			const lineBuf = [];
			vertices.slice(0, 2).concat(vertices[3], vertices[2], vertices[0]).reduce((pre, cur) => {
				const geometry = new THREE.Geometry();
				geometry.vertices.push(pre);
				geometry.vertices.push(cur);
				lineBuf.push (new THREE.Line(geometry, geomBase.mat));
				return cur;
			});
			this.lines.push(lineBuf);
		});
	}
	
	updatePara(arr, index){
		const vertices = arr.map(ele => {
			return new THREE.Vector3(...ele);
		});
		const faces = [new THREE.Face3(0, 1, 2), new THREE.Face3(1, 2, 3)];
		const geom = this.mesh[index].children[0];
		geom.geometry.vertices = vertices;
		geom.geometry.faces = faces;
		geom.geometry.computeFaceNormals(); 
		geom.geometry.elementsNeedUpdate = true;
		geom.geometry.normalsNeedUpdate = true;
		geom.geometry.verticesNeedUpdate = true;
		vertices.slice(0, 2).concat(vertices[3], vertices[2], vertices[0]).reduce((pre, cur, i) => {
			const line = this.lines[index][i - 1];
			line.geometry.vertices[0] = pre;
			line.geometry.vertices[1] = cur;
			line.geometry.verticesNeedUpdate = true;
			return cur;
		})
	}

	update(angleChange, offset){
		if(!!angleChange)
			this.surf = this.surf.map(vertices => {
				return vertices.map(dot => {
					const r = this.spin.concat().fill(angleChange);
					return math.multiply(geomBase.rotateM(this.dim, this.spin, r), dot);
				});
			});
		if(!!angleChange || !!offset){
			this.projSurf(this.projType);
			if(!!offset){
				this.movProj(offset);
				this.offset = offset;
			}else{
				this.movProj(this.offset);
			}

			this.proj.forEach((arr, index) => {
				this.updatePara(arr, index);
			});
		}
	}
}

class simplex4 extends geomBase{
	constructor(dims, offset = null, rotation = null, spin, projType = true){
		super();
		this.dim = 4;
		this.spin = !!spin ? spin : Array(dim).fill(false);
		this.dims = !!dims ? dims : Array(dim).fill(30);
		this.projType = projType;
		this.surf = this.baseSurf();
		this.proj = [];
		this.mesh = [];
		this.lines = [];
		this.initTri(rotation);
		this.update(null, !!offset ? offset : [0, 0, 0]);
		this.lines.flat().forEach(e => scene.add(e));
		this.mesh.forEach(e => scene.add(e));
	}

	baseSurf(){
		const z = 1 / Math.sqrt(5);
		let vertices = [[1, 1, 1, -z], 
						  [1, -1, -1, -z], 
						  [-1, 1, -1, -z],
						  [-1, -1, 1, -z],
						  [0, 0, 0, 1 / z - z]];
		if(!!this.dims){
			let I = math.identity(4).valueOf();
			I = I.map((e, index) => {
				if(!!this.dims[index])
					e[index] = this.dims[index];
				return e;
			});
			vertices = vertices.map(e => math.multiply(I, e));
		}	
		return k_combinations(vertices, 3);
	}

	projSurf(type){
		if(type){
			const dist = this.surf.flat().reduce((pre, cur) => {
				const  curr = cur[3];
				return pre > curr ? pre : curr;
			});
			this.proj = this.surf.map(vertices => {
				return vertices.map(dot => {
					return geomBase.proj(dot, dist);
				});
			});
		}else{
			this.proj = this.surf.map(vertices => {
				return vertices.map(dot => {
					return dot.slice(0,3);
				});
			});
		}
	}

	movProj(offset){
		this.proj = this.proj.map(vertices => {
			return vertices.map(dot => {
				return math.add(dot, offset).valueOf();
			})
		});
	}

	initTri(r){
		if(!!r){
			this.surf = this.surf.map(vertices => {
				const spin = r.map(e => e.slice(0,2));
				const angle = r.map(e => e.slice(2,3));
				return vertices.map(dot => {
					return math.multiply(geomBase.rotateM(this.dim, spin, angle), dot);
				});
			});
		}
		this.projSurf();
		this.proj.forEach((arr, index) => {
			const vertices = arr.map(ele => {
				return new THREE.Vector3(...ele);
			});
			const faces = [new THREE.Face3(0, 1, 2)];
			const geom = new THREE.Geometry();
			geom.vertices = vertices;
			geom.faces = faces;
			geom.computeFaceNormals(); 
			this.mesh.push(THREE.SceneUtils.createMultiMaterialObject(geom, geomBase.materials));
			const lineBuf = [];
			vertices.concat(vertices[0]).reduce((pre, cur) => {
				const geometry = new THREE.Geometry();
				geometry.vertices.push(pre);
				geometry.vertices.push(cur);
				lineBuf.push (new THREE.Line(geometry, geomBase.mat));
				return cur;
			});
			this.lines.push(lineBuf);
		});
	}
	
	updateTri(arr, index){
		const vertices = arr.map(ele => {
			return new THREE.Vector3(...ele);
		});
		const faces = [new THREE.Face3(0, 1, 2)];
		const geom = this.mesh[index].children[0];
		geom.geometry.vertices = vertices;
		geom.geometry.faces = faces;
		geom.geometry.computeFaceNormals(); 
		geom.geometry.elementsNeedUpdate = true;
		geom.geometry.normalsNeedUpdate = true;
		geom.geometry.verticesNeedUpdate = true;
		vertices.concat(vertices[0]).reduce((pre, cur, i) => {
			const line = this.lines[index][i - 1];
			line.geometry.vertices[0] = pre;
			line.geometry.vertices[1] = cur;
			line.geometry.verticesNeedUpdate = true;
			return cur;
		})
	}

	update(angleChange, offset){
		if(!!angleChange)
			this.surf = this.surf.map(vertices => {
				return vertices.map(dot => {
					const r = this.spin.concat().fill(angleChange);
					return math.multiply(geomBase.rotateM(this.dim, this.spin, r), dot);
				});
			});
		if(!!angleChange || !!offset){
			this.projSurf(this.projType);
			if(!!offset){
				this.movProj(offset);
				this.offset = offset;
			}else{
				this.movProj(this.offset);
			}

			this.proj.forEach((arr, index) => {
				this.updateTri(arr, index);
			});
		}
	}
}

class hilbertCurve extends geomBase{
	constructor(dim, orders, uLength = 30, projType = true){
		super();
		this.dim = dim;
		
		this.projType = projType;
		
	}
}

function toRad (deg){
	return deg / 180 * Math.PI;
}

function k_combinations(set, k) {
	var i, j, combs, head, tailcombs;

	if (k > set.length || k <= 0) {
		return [];
	}

	if (k == set.length) {
		return [set];
	}

	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}

	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		head = set.slice(i, i + 1);
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
		}
	}
	return combs;
}


function combinations(set) {
	var k, i, combs, k_combs;
	combs = [];
	
	for (k = 1; k <= set.length; k++) {
		k_combs = k_combinations(set, k);
		for (i = 0; i < k_combs.length; i++) {
			combs.push(k_combs[i]);
		}
	}
	return combs;
}
