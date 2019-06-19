class demo {
    constructor () {
        this._h3 = () => new hilbertCurve(3, 7, 30);
        this._h2 = () => new hilbertCurve(2, 15, 30);
        this._s4 = () => new simplex4( Array(4).fill(100), null, [[0,1, Math.PI/4], [0,1, Math.PI/4]], [[2, 3]], 0);
        this._c40 = () => new hyperCube(4, Array(4).fill(100), [0,50,50], [], [[0, 3], [1, 3]], 0);
        this._c41 = () => new hyperCube(4, Array(4).fill(80), [-150,80,50], [], [[0, 3], [1, 3]], 1);
        this._c5 = () => new hyperCube(5, Array(5).fill(80), [150,80,50], [], [[0,4], [1, 4]], 1);
        this._v1 = () => ndArr.fromFunc([e => e[1] / 3, e => -e[0] / 3, e => 0, e => -e[3] / 5], -160,[], 5, 80, 4, 0,[], null, 0);
        this._v2 = () => ndArr.fromFunc([e => e[0] / 5, e => e[1] / 5, e => e[2] / 5, e => e[3]/5], -100,[], 5, 50, 4, 0,[[0,3],[2,3]], null, 0);
        this._v3 = () => ndArr.fromFunc([e => e[1] / 5, e => -e[2] / 5, e => e[0] / 5, e => -e[3] / 5], -160,[], 5, 80, 4, 0,[[0,3],[2,3]], null, 0);
        this._t1 = () => new nDtensor([[0,-70,0],[70,0,0],[0,0,0]]);
    }

    get h3 () {this._h3()}
    set h3 (p) {}

    get h2 () {this._h2()}
    set h2 (p) {}

    get s4 () {this._s4()}
    set s4 (p) {}

    get c40 () {this._c40()}
    set c40 (p) {}

    get c41 () {this._c41()}
    set c41 (p) {}

    get c5 () {this._c5()}
    set c5 (p) {}

    get v1 () {this._v1()}
    set v1 (p) {}

    get v2 () {this._v2()}
    set v2 (p) {}

    get v3 () {this._v3()}
    set v3 (p) {}
}

const d = new demo();