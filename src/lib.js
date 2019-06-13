
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

geomBase.rotateM = (dim, cords, rad) => {
	let J = math.identity(dim--).valueOf();
	cords.forEach((cord, i) => {
		const I = math.identity(dim + 1).valueOf();
		[I[cord[0]][cord[0]], I[cord[0]][cord[1]]] = [Math.cos(rad), -Math.sin(rad)];
		[I[cord[1]][cord[0]], I[cord[1]][cord[1]]] = [Math.sin(rad), Math.cos(rad)];
		J = math.multiply(I, J);
	});
	return J;
}

geomBase.combNum = dim => k_combinations(new Array(dim).fill(0).map((e, index) => index), 2);


class hyperCube extends geomBase{
	constructor(dim, dims, offset = null, spin, projType = true){
		super();
		this.dim = dim;
		this.spin = !!spin ? spin : Array(dim).fill(false);
		this.dims = !!dims ? dims : Array(dim).fill(30);
		this.projType = projType;
		this.surf = this.baseSurf(dim, dims);
		this.proj = [];
		this.lines = [];
		this.mesh = [];
		this.movSurf();
		this.extSurf();
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

	updatePara(arr, index){
		const vertices = arr.map(ele => {
			return new THREE.Vector3(...ele);
		});
		const faces = [new THREE.Face3(0, 1, 2), new THREE.Face3(1, 2, 3)];
		if(!!this.mesh && !!this.mesh[index]){
			const geom = this.mesh[index].children[0];
			geom.geometry.vertices = vertices;
			geom.geometry.faces = faces;
			geom.geometry.computeFaceNormals(); 
			geom.geometry.elementsNeedUpdate = true;
			geom.geometry.normalsNeedUpdate = true;
			geom.geometry.verticesNeedUpdate = true;
			//this.mesh[index].children[0].geometry.attributes.position.needsUpdate = true;
			vertices.slice(0, 2).concat(vertices[3], vertices[2], vertices[0]).reduce((pre, cur, i) => {
				const line = this.lines[index][i - 1];
				line.geometry.vertices[0] = pre;
				line.geometry.vertices[1] = cur;
				line.geometry.verticesNeedUpdate = true;
				//line.geometry.attributes.position.needsUpdate = true;
				return cur;
			})
		}else{
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
		}
	}

	update(angleChange, offset){
		if(!!angleChange)
			this.surf = this.surf.map(vertices => {
				return vertices.map(dot => {
					return math.multiply(geomBase.rotateM(this.dim, this.spin, angleChange), dot);
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

function toRad (deg){
	return deg / 180 * Math.PI;
}

function k_combinations(set, k) {
	var i, j, combs, head, tailcombs;
	
	// There is no way to take e.g. sets of 5 elements from
	// a set of 4.
	if (k > set.length || k <= 0) {
		return [];
	}
	
	// K-sized set has only one K-sized subset.
	if (k == set.length) {
		return [set];
	}
	
	// There is N 1-sized subsets in a N-sized set.
	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}
	
	// Assert {1 < k < set.length}
	
	// Algorithm description:
	// To get k-combinations of a set, we want to join each element
	// with all (k-1)-combinations of the other elements. The set of
	// these k-sized sets would be the desired result. However, as we
	// represent sets with lists, we need to take duplicates into
	// account. To avoid producing duplicates and also unnecessary
	// computing, we use the following approach: each element i
	// divides the list into three: the preceding elements, the
	// current element i, and the subsequent elements. For the first
	// element, the list of preceding elements is empty. For element i,
	// we compute the (k-1)-computations of the subsequent elements,
	// join each with the element i, and store the joined to the set of
	// computed k-combinations. We do not need to take the preceding
	// elements into account, because they have already been the i:th
	// element so they are already computed and stored. When the length
	// of the subsequent list drops below (k-1), we cannot find any
	// (k-1)-combs, hence the upper limit for the iteration:
	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		// head is a list that includes only our current element.
		head = set.slice(i, i + 1);
		// We take smaller combinations from the subsequent elements
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
		}
	}
	return combs;
}


/**
 * Combinations
 * 
 * Get all possible combinations of elements in a set.
 * 
 * Usage:
 *   combinations(set)
 * 
 * Examples:
 * 
 *   combinations([1, 2, 3])
 *   -> [[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]
 * 
 *   combinations([1])
 *   -> [[1]]
 */
function combinations(set) {
	var k, i, combs, k_combs;
	combs = [];
	
	// Calculate all non-empty k-combinations
	for (k = 1; k <= set.length; k++) {
		k_combs = k_combinations(set, k);
		for (i = 0; i < k_combs.length; i++) {
			combs.push(k_combs[i]);
		}
	}
	return combs;
}
