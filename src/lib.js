
class geomBase{
	constructor(){
		geomBase.geomLst.push(this);
		this.lines = [];
		this.proj = [];
	}

	destructor(){
		this.lines.forEach(e => {
			e.geometry.dispose();
			e.material.dispose();
			scene.remove(e);
		});
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

geomBase.drawFace = (arr, faces = []) => {
	const geom = new THREE.Geometry();
	geomBase.updateFace(arr, geom, faces);
	return THREE.SceneUtils.createMultiMaterialObject(geom, geomBase.materials);
};

geomBase.drawLine = (dots, ord = null) => {
	const geometry = new THREE.Geometry();
	geomBase.updateLine(dots, geometry, ord);
	return new THREE.Line(geometry, geomBase.mat);
} 

geomBase.drawArr = (dot, color = 0xffffff) => {
	const geometry = new THREE.ArrowHelper();
	geomBase.updateArr(dot, geometry, color);
	return geometry;
} 

geomBase.updateFace = (arr, face, faces = []) => {
	const vertices = arr.map(ele => new THREE.Vector3(...ele));
	if(!!!faces[0])
		Array(--arr.length).fill(0).map((e, index) => ++index).reduce((pre, cur) => {
			faces.push(new THREE.Face3(0, pre, cur));
			return cur;
		});
	face.vertices = vertices;
	face.faces = faces;
	face.computeFaceNormals(); 
	face.elementsNeedUpdate = true;
	face.normalsNeedUpdate = true;
	face.verticesNeedUpdate = true;
}

geomBase.updateLine = (dots, line, ord = null) => {
	if(!!ord)
		dots = ord.map(e => dots[e])
	dots.map((ele, i) => {
		line.vertices[i] = new THREE.Vector3(...ele);
	});
	line.verticesNeedUpdate = true;
};

geomBase.updateArr = (dot, geometry, color = null) => {
	const ori = new THREE.Vector3(...dot[0]);
	const vec = new THREE.Vector3(...dot[1]);
	geometry.position.copy(ori);
	const len = vec.length();
	if(len){
		geometry.setLength(len , 0.2 * len, 6);
		geometry.setDirection(vec.normalize());
	}
	if(!!color)
		geometry.setColor(new THREE.Color(color));
};

geomBase.update = (angularSpeed = 0.1) => {
	const time = (new Date()).getTime(),
    	  timeDiff = time - geomBase.lastTime;
	geomBase.angleChange = angularSpeed * timeDiff * 2 * Math.PI / 750;
	geomBase.geomLst.forEach(e => {
		if(e.timeVar)
			e.anime(timeDiff);
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

class multiFaceGeom extends geomBase{
	constructor(spin, projType){
		super();
		this.spin = spin;
		if(!!(spin[0]))
		 	this.timeVar = true;
		this.projType = projType;
		this.mesh = [];
	}

	projSurf(type){
		if(type){
			const dist = this.surf.flat().reduce((pre, cur) => {
				const  curr = cur[3];
				return pre > curr ? pre : curr;
			});
			this.proj = this.surf.map(vertices => {
				return vertices.map(dot => geomBase.proj(dot, dist));
			});
		}else{
			this.proj = this.surf.map(vertices => {
				return vertices.map(dot => dot.slice(0,3));
			});
		}
	}

	movProj(offset){
		this.proj = this.proj.map(vertices => {
			return vertices.map(dot => math.add(dot, offset).valueOf());
		});
	}

	initFace(r, face){
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
			this.mesh.push(geomBase.drawFace(arr, face));
			this.lines.push(geomBase.drawLine(arr.concat([arr[0]])));
		});
	}

	updateFace(arr, index, face){
		geomBase.updateFace(arr, this.mesh[index].children[0].geometry, face);
		geomBase.updateLine(arr.concat([arr[0]]), this.lines[index].geometry);
	}

	update(angleChange, offset, face){
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
				this.updateFace(arr, index, face);
			});
		}
	}

	anime(){
		this.update(geomBase.angleChange, null, this.faceOrd);
	}

	destructor(){
		this.mesh.forEach(e => {
			e.children[0].geometry.dispose();
			e.children[0].material.dispose();
			scene.remove(e);
		});
		this.lines.forEach(e => {
			e.geometry.dispose();
			e.material.dispose();
			scene.remove(e);
		});
	}
}

class hyperCube extends multiFaceGeom{
	constructor(dim, dims = null, offset = null, rotation = null, spin = [], projType = true){
		super(spin, projType);
		this.dim = dim;
		this.dims = !!dims ? dims : Array(dim).fill(30);
		this.surf = this.baseSurf(dim);
		this.movSurf();
		this.extSurf();
		this.faceOrd = [new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3)];
		this.initFace(rotation, this.faceOrd);
		this.update(null, !!offset ? offset : [0, 0, 0], this.faceOrd);
		this.lines.forEach(e => scene.add(e));
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
			vertices.push(e[0], math.add(e[0],e[1]).valueOf(),e[1]);
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
}

class simplex4 extends multiFaceGeom{
	constructor(dims, offset = null, rotation = null, spin = [], projType = true){
		super(spin, projType);
		this.dim = 4;
		this.dims = !!dims ? dims : Array(dim).fill(30);
		this.surf = this.baseSurf();
		this.faceOrd = [new THREE.Face3(0, 1, 2)];
		this.initFace(rotation, this.faceOrd);
		this.update(null, !!offset ? offset : [0, 0, 0], this.faceOrd);
		this.lines.forEach(e => scene.add(e));
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
}

class hilbertCurve extends geomBase{
	constructor(dim, orders, uLength = 30, projType = false){
		super();
		this.dim = dim;
		this.hil = Module.cwrap("hilbert", "number", ["number", "number", "number"]);
		this.orders = orders;
		this.uLength = uLength;
		this.projType = projType;
		this.spin = [];
		this.Vecs = this.baseVec();
		this.movVec();
		this.initVec();

		scene.add(this.line);
	}
	baseVec(){
		const ord = (this.orders + 1) ** this.dim;
		return Array(ord).fill(Array(this.dim).fill(0)).map((e, i) => {
			const p = this.hil(this.dim, ord, i);
			return e.map((c, index) => this.uLength * Module.getValue(p + index * 4,'i32'));
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
		this.proj.forEach(ele => {
			geometry.vertices.push(new THREE.Vector3(...ele));
		});
		this.line = new getColoredBufferLine( 0.2, 1.5, geometry);
		this.lines.push(this.line);
	}
}

class ndArr extends geomBase{
	constructor(dim, vec, spin = [], projType = false){
		super();
		this.dim = dim;
		this.Vecs = vec;
		this.spin = spin;
		if(!!(spin[0]))
		 	this.timeVar = true;
		this.projType = projType;
		this.projVec(vec);
		this.initArr();
		this.arrs.forEach(e => scene.add(e));
	}

	projVec(type){
		if(type){
			const dist = this.Vecs.reduce((pre, cur) => {
				const  curr = cur[1][3];
				return pre > curr ? pre : curr;
			});
			this.proj = this.Vecs.map(dot => {
				const ret = [];
				ret[0] = dot[0].slice(0,3);
				const vecVal = dot[1].concat();
				vecVal.pop();
				ret[1] = geomBase.proj(vecVal, Math.abs(dist));
				return ret;
			});
		}else{
			this.proj = this.Vecs.map(dot => {
				const ret = [];
				ret[0] = dot[0].slice(0,3);
				ret[1] = dot[1].slice(0,3);
				return ret;
			});
		}
	}

	initArr(){
		this.projVec(this.projType);
		this.arrs = this.proj.map((vec, i) => {
			return geomBase.drawArr(vec, this.Vecs[i][1].concat().pop());
		});
	}

	updateArr(arr, index){
		geomBase.updateArr(arr, this.arrs[index], this.Vecs[index][1].concat().pop());
	}

	update(angleChange, arr){
		if(!!arr){
			this.Vecs = arr;
		}
		if(!!angleChange)
			this.Vecs = this.Vecs.map(dot => {
				const r = this.spin.concat().fill(angleChange);
				const //color = dot[1].pop(),
					  dbuf = dot[0].pop();
				dot[1][3] = Math.cos(angleChange) * dot[1][3];
				//dot[1] = math.multiply(geomBase.rotateM(this.dim, this.spin, r), dot[1]);
				dot[0] = math.multiply(geomBase.rotateM(this.dim, this.spin, r), dot[0]);
				//dot[1].push(color);
				dot[0].push(dbuf);
				return [dot[0], dot[1]];
			});
		this.projVec(this.projType);
		this.proj.forEach((arr, index) => {
			this.updateArr(arr, index);
		});
	}

	anime(t){
		if(!!this.func && this.func.tVarFunc)
			this.updateFunc(this.func.tVarFunc(t));
		this.update(geomBase.angleChange);
	}

	updateFunc(param){
		this.Vecs = this.func.update(param);
	}

	destructor(){
		this.arrs.forEach(e => scene.remove(e));
	}
}

ndArr.fromFunc = (expr, initVal, initPara, steps, stepLen = 1, 
												  dim = null, 
												  spin = [], 
												  tVarFunc = null,
												  projType = false, 
												  specColor = false) => {
	if(!specColor){
		dim = expr.length;
		const rainbow = new Rainbow();
		rainbow.setSpectrum("blue", "cyan", "green", "yellow", "orange", "red");
		rainbow.setNumberRange(0, (steps * stepLen / 2) * Math.sqrt(2));
		expr.push((function(dims) {
			dims = dims.concat().pop();
			return parseInt(`0x${this.colourAt(math.norm(dims))}`, 16) ;
		}).bind(rainbow));
	}
	const func = new ndVecFunc(expr, initVal, initPara, steps, stepLen, dim, true);
	//func.vecs.splice(1, 1);
	func.tVarFunc = tVarFunc;
	const ret =  new ndArr(dim, func.vecs, spin, projType);
	ret.func = func;
	return ret;
}

class ndVecFunc{
	constructor(expr, initVal, initPara, steps, stepLen = 1, dim = null, color = false){
		this.vecs = [];
		this.expr = expr;
		this.initVal = initVal;
		this.steps = steps;
		this.stepLen = stepLen;
		this.dim = !!dim ? dim : expr.length;
		this.color = color;
		initVal -= stepLen;
		permute(Array(this.dim).fill(Array(steps).fill(0).map(() => initVal += stepLen))).forEach((val, ind) => {
			const vect = [];
			if(color)
				val = val.concat([val]);
			expr.forEach(exp => {
					vect.push(exp(val, ...initPara));
				});
			this.vecs.push([val, vect]);
		})
	}

	update(para){
		permute(Array(this.expr.length).fill(Array(this.steps).fill(0).map(() => 
			this.initVal += this.stepLen))).forEach((val, index) => {
			expr.forEach((exp, i) => this.vecs[index][1][i] = exp(val[i], ...para));
		})
		return this.vecs;
	}
}

function toRad (deg){
	return deg / 180 * Math.PI;
}


//following codes are runtime libs mainly from stackOverflow
function permute(input) {
  var out = [];

  (function permute_r(input, current) {
    if (input.length === 0) {
      out.push(current);
      return;
    }

    var next = input.slice(1);

    for (var i = 0, n = input[0].length; i != n; ++i) {
      permute_r(next, current.concat([input[0][i]]));
    }
  }(input, []));

  return out;
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
  
  /*
RainbowVis-JS 
Released under Eclipse Public License - v 1.0
*/

function Rainbow()
{
	"use strict";
	var gradients = null;
	var minNum = 0;
	var maxNum = 100;
	var colours = ['ff0000', 'ffff00', '00ff00', '0000ff']; 
	setColours(colours);
	
	function setColours (spectrum) 
	{
		if (spectrum.length < 2) {
			throw new Error('Rainbow must have two or more colours.');
		} else {
			var increment = (maxNum - minNum)/(spectrum.length - 1);
			var firstGradient = new ColourGradient();
			firstGradient.setGradient(spectrum[0], spectrum[1]);
			firstGradient.setNumberRange(minNum, minNum + increment);
			gradients = [ firstGradient ];
			
			for (var i = 1; i < spectrum.length - 1; i++) {
				var colourGradient = new ColourGradient();
				colourGradient.setGradient(spectrum[i], spectrum[i + 1]);
				colourGradient.setNumberRange(minNum + increment * i, minNum + increment * (i + 1)); 
				gradients[i] = colourGradient; 
			}

			colours = spectrum;
		}
	}

	this.setSpectrum = function () 
	{
		setColours(arguments);
		return this;
	}

	this.setSpectrumByArray = function (array)
	{
		setColours(array);
		return this;
	}

	this.colourAt = function (number)
	{
		if (isNaN(number)) {
			throw new TypeError(number + ' is not a number');
		} else if (gradients.length === 1) {
			return gradients[0].colourAt(number);
		} else {
			var segment = (maxNum - minNum)/(gradients.length);
			var index = Math.min(Math.floor((Math.max(number, minNum) - minNum)/segment), gradients.length - 1);
			return gradients[index].colourAt(number);
		}
	}

	this.colorAt = this.colourAt;

	this.setNumberRange = function (minNumber, maxNumber)
	{
		if (maxNumber > minNumber) {
			minNum = minNumber;
			maxNum = maxNumber;
			setColours(colours);
		} else {
			throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
		}
		return this;
	}
}

function ColourGradient() 
{
	"use strict";
	var startColour = 'ff0000';
	var endColour = '0000ff';
	var minNum = 0;
	var maxNum = 100;

	this.setGradient = function (colourStart, colourEnd)
	{
		startColour = getHexColour(colourStart);
		endColour = getHexColour(colourEnd);
	}

	this.setNumberRange = function (minNumber, maxNumber)
	{
		if (maxNumber > minNumber) {
			minNum = minNumber;
			maxNum = maxNumber;
		} else {
			throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
		}
	}

	this.colourAt = function (number)
	{
		return calcHex(number, startColour.substring(0,2), endColour.substring(0,2)) 
			+ calcHex(number, startColour.substring(2,4), endColour.substring(2,4)) 
			+ calcHex(number, startColour.substring(4,6), endColour.substring(4,6));
	}
	
	function calcHex(number, channelStart_Base16, channelEnd_Base16)
	{
		var num = number;
		if (num < minNum) {
			num = minNum;
		}
		if (num > maxNum) {
			num = maxNum;
		} 
		var numRange = maxNum - minNum;
		var cStart_Base10 = parseInt(channelStart_Base16, 16);
		var cEnd_Base10 = parseInt(channelEnd_Base16, 16); 
		var cPerUnit = (cEnd_Base10 - cStart_Base10)/numRange;
		var c_Base10 = Math.round(cPerUnit * (num - minNum) + cStart_Base10);
		return formatHex(c_Base10.toString(16));
	}

	function formatHex(hex) 
	{
		if (hex.length === 1) {
			return '0' + hex;
		} else {
			return hex;
		}
	} 
	
	function isHexColour(string)
	{
		var regex = /^#?[0-9a-fA-F]{6}$/i;
		return regex.test(string);
	}

	function getHexColour(string)
	{
		if (isHexColour(string)) {
			return string.substring(string.length - 6, string.length);
		} else {
			var name = string.toLowerCase();
			if (colourNames.hasOwnProperty(name)) {
				return colourNames[name];
			}
			throw new Error(string + ' is not a valid colour.');
		}
	}
	
	// Extended list of CSS colornames s taken from
	// http://www.w3.org/TR/css3-color/#svg-color
	var colourNames = {
		red: "FF0000",
		orange: "FFA500",
		yellow: "FFFF00",
		green: "008000",
		cyan: "00FFFF",
		blue: "0000FF",
		purple: "800080",
	}
}