
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
geomBase.mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 6 } );

geomBase.update = (angularSpeed = 0.1) => {
	let time = (new Date()).getTime();
    let timeDiff = time - geomBase.lastTime;
	let angleChange = angularSpeed * timeDiff * 2 * Math.PI / 750;
	geomBase.geomLst.forEach(e => {
		if(!!(e.spin[0]))
			e.update(angleChange);
	});
	geomBase.lastTime = time;
}

geomBase.proj = (dot, dist) => {
	dot = dot.concat();
	const factor = dist * 4 / (dist * 3 - dot.splice(3)[0]);
	return dot.map(val => val * factor);
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

geomBase.purge = () => {
	geomBase.geomLst.forEach(e => e.destructor());
	geomBase.geomLst = [];
};

geomBase.combNum = dim => k_combinations(new Array(dim).fill(0).map((e, index) => index), 2);


class hyperCube extends geomBase{
	constructor(dim, dims = null, offset = null, rotation = null, spin = [], projType = true){
		super();
		this.dim = dim;
		this.spin = spin;
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
		this.proj.forEach((arr) => {
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
				geometry.vertices.push(pre, cur);
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

	destructor(){
		this.mesh.forEach(e => {
			e.children[0].geometry.dispose();
			e.children[0].material.dispose();
			scene.remove(e);
		});
		this.lines.flat().forEach(e => {
			e.geometry.dispose();
			e.material.dispose();
			scene.remove(e);
		});
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
		this.proj.forEach(arr => {
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
				geometry.vertices.push(pre, cur);
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

	destructor(){
		this.mesh.forEach(e => {
			e.children[0].geometry.dispose();
			e.children[0].material.dispose();
			scene.remove(e);
		});
		this.lines.flat().forEach(e => {
			e.geometry.dispose();
			e.material.dispose();
			scene.remove(e);
		});
	}
}

class hilbertCurve extends geomBase{
	constructor(dim, orders, uLength = 30, projType = false){
		super();
		this.dim = dim;
		this.hil = Module.cwrap("hilbert", "[number]", ["number", "number", "number"]);
		this.orders = orders;
		this.uLength = uLength;
		this.projType = projType;
		this.proj = [];
		this.Vecs = this.baseVec();
		this.movVec();
		this.initVec();
		scene.add(this.line);
	}
	baseVec(){
		const ord = (this.orders + 1) ** this.dim;
		return Array(ord).fill(Array(this.dim).fill(0)).map((e, i) => {
			const value = this.hil(this.dim, ord, i);
			return e.map((c, index) => this.uLength * getValue(value + index * 4, 'i32'));
		});
	}
	movVec(){
		const offset = Array(this.dim).fill(- (this.orders * this.uLength / 2));
		this.Vecs = this.Vecs.map(dot => math.add(dot, offset).valueOf());
	}
	projVec(type){
		if(type){
			const dist = this.Vecs.reduce((pre, cur) => {
				const  curr = cur[3];
				return pre > curr ? pre : curr;
			});
			this.proj = this.Vecs.map(dot => geomBase.proj(dot, dist));
		}else{
			this.proj = this.Vecs.map(dot => dot.slice(0,3));
		}
	}
	initVec(){
		this.projVec(this.projType);
		const geometry = new THREE.Geometry();
		this.proj.map(ele => {
			geometry.vertices.push(new THREE.Vector3(...ele));
		});
		
		this.line = new getColoredBufferLine( 0.2, 1.5, geometry );
	}

	destructor(){
		this.line.geometry.dispose();
		this.line.material.dispose();
		scene.remove(line);
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

function changeColor( line, options ) {

	var colors = line.geometry.attributes.color.array;
	var segments = line.geometry.attributes.color.count * 3;
	var frequency = 1 /  ( options.steps * segments );
	var color = new THREE.Color();
  
	for ( var i = 0, l = segments; i < l; i ++ ) {
	  color.set ( makeColorGradient( i, frequency, options.phase ) );
  
	  colors[ i * 3 ] = color.r;
	  colors[ i * 3 + 1 ] = color.g;
	  colors[ i * 3 + 2 ] = color.b;
  
	}
	
	// update
	  line.geometry.attributes[ "color" ].needsUpdate = true;
	
  }
  
  // create colored line
  // using buffer geometry
  function getColoredBufferLine ( steps, phase, geometry ) {
  
	var vertices = geometry.vertices;
	var segments = geometry.vertices.length;
  
	// geometry
	var geometry = new THREE.BufferGeometry();
  
	// material
	var lineMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors,
													 linewidth: 9 });
  
	// attributes
	var positions = new Float32Array( segments * 3 ); // 3 vertices per point
	var colors = new Float32Array( segments * 3 );
  
	var frequency = 1 /  ( steps * segments );
	var color = new THREE.Color();
  
	var x, y, z;
  
	for ( var i = 0, l = segments; i < l; i ++ ) {
  
	  x = vertices[ i ].x;
	  y = vertices[ i ].y;
	  z = vertices[ i ].z;
  
	  positions[ i * 3 ] = x;
	  positions[ i * 3 + 1 ] = y;
	  positions[ i * 3 + 2 ] = z;
  
	  color.set ( makeColorGradient( i, frequency, phase ) );
  
	  colors[ i * 3 ] = color.r;
	  colors[ i * 3 + 1 ] = color.g;
	  colors[ i * 3 + 2 ] = color.b;
  
	  }
  
	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
  
	// line
	var line = new THREE.Line( geometry, lineMaterial );
  
	return line;
  
  }
  
  /* COLORS */			 
  function makeColorGradient ( i, frequency, phase ) {  
  
	var center = 128;
	var width = 127;
	  
	var redFrequency, grnFrequency, bluFrequency;
	   grnFrequency = bluFrequency = redFrequency = frequency;
	
	var phase2 = phase + 2;
	var phase3 = phase + 4;
  
	var red   = Math.sin( redFrequency * i + phase ) * width + center;
	var green = Math.sin( grnFrequency * i + phase2 ) * width + center;
	var blue  = Math.sin( bluFrequency * i + phase3 ) * width + center;
  
	return parseInt( '0x' + _byte2Hex( red ) + _byte2Hex( green ) + _byte2Hex( blue ) );
  }
  
  function _byte2Hex (n) {
	var nybHexString = "0123456789ABCDEF";
	return String( nybHexString.substr( ( n >> 4 ) & 0x0F, 1 ) ) + nybHexString.substr( n & 0x0F, 1 );
  }
  