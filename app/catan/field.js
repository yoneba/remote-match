'use strict';

const Random = require("../random.js");

/**
 * @typedef {"木"|"泥"|"羊"|"麦"|"鉄"} Resource
 * @typedef {2|3|4|5|6|7|8|9|10|11|12} Dice
 * @typedef {{resource:Resource|"荒",dice:(1|Dice)}} Face
 * @typedef {owner:string,type:number} Vertex
 * @typedef {number} Edge
 */

/**
 * @public
 * @description the number of faces in a line.
 */
const fsize = 7;

/**
 * @public
 * @description the number of vertices in a line.
 */
const vsize = fsize * 2;

/**
 * @public
 * @description the indexes of faces within the effective range.
 */
const valid_face = [
    10, 11, 12,
    16, 17, 18, 19,
    22, 23, 24, 25, 26,
    29, 30, 31, 32,
    36, 37, 38
];

/**
 * @public
 * @description the indexes of vertices within the effective range.
 */
const valid_vertex = [
    21, 22, 23, 24, 25, 26, 27,
    33, 34, 35, 36, 37, 38, 39, 40, 41,
    45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
    58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
    72, 73, 74, 75, 76, 77, 78, 79, 80,
    86, 87, 88, 89, 90, 91, 92
];

/**
 * @public
 * @description the indexes of edges within the effective range.
 */
const valid_edge = [
    31, 32, 33, 34, 35, 36, 37, 38, 39, 41,
    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62,
    67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 83,
    87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101,
    108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
    129, 130, 132, 133, 135, 136
];

/**
 * @public
 * @member {Face[]} face the face elements of the field topology.
 * @member {Vertex[]} vertex the vertex elements of the field topology.
 * @member {Edge[]} edge the edge elements of the field topology.
 * @member {(Resource|"３")[]} coast the order of coasts.
 * @member {Object<(Resource|"３"),number[]>} wharf vertices where trading can be done.
 */
class Field {
    /**
     * @public
     * @constructor
     * @param {?Face[]} face the initial distribution of faces.
     * @param {?(Resource|"３")[]} coast the initial order of coasts.
     */
    constructor(face = null, coast = null) {
        this.face = face ?? initializeFace();
        this.vertex = initializeVertex();
        this.edge = initializeEdge();
        this.coast = coast ?? Random.shuffle(["木", "泥", "羊", "麦", "鉄", "３"]);
        this.wharf = Field.computeWharf(this.coast);
    }

    /**
     * @protected
     * @throws {RangeError} when this.edge[e] is not null.
     * @param {number} p the index of the player.
     * @param {number} e the index of the edge.
     * @returns {number} distance of the longest trail containing e.
     */
    measure(p, e) {
        if (this.edge[e] != null) throw RangeError("free edge must be designated");
        return 1 + this.dfs(p, ...Field.endpoints(e), (p, v) => this.dfs(p, v, null, () => 0));
    }

    /**
     * @callback Field~dfsCallback
     * @param {number} p the index of the player.
     * @param {number} v the index of the vertex to start a search from.
     * @returns {number} the maximum possible distance of a trail from v.
     */
    /**
     * @private
     * @param {number} p the index of the player.
     * @param {number} v the index of the vertex to start a search from.
     * @param {?number} w the index of the vertex to start a search from when the one from v cannot go further.
     * @param {Field~dfsCallback} sequel the callback function to be called when the search from v cannot go further.
     * @returns {number} the maximum possible sum of distance of a trail from v and that from w.
     */
    dfs(p, v, w, sequel) {
        let dist = 0;
        if (this.vertex[v] == null || this.vertex[v].owner === p) {
            const adj = Field.adjacent(v), inc = Field.incident(v);
            for (let i = 0; i < adj.length; i++) {
                if (this.edge[inc[i]] !== p) continue;
                this.edge[inc[i]] = null;
                dist = Math.max(dist, 1 + this.dfs(p, adj[i], w, sequel));
                this.edge[inc[i]] = p;
            }
        }
        if (dist === 0) return sequel(p, w);
        return dist;
    }

    /**
     * @public
     * @param {number} p the index of the player.
     * @param {number} e the index of the edge.
     * @returns {boolean} true if the player p can build a road at e.
     */
    admissible(p, e) {
        const isolated = valid_vertex.find(v => this.vertex[v]?.owner === p && !this.connected(p, v));
        return this.edge[e] == null && (isolated == null || Field.endpoints(e).includes(isolated))
            && Field.endpoints(e).some(v => this.vertex[v]?.owner === p || this.vertex[v] == null && this.connected(p, v));
    }

    /**
     * @public
     * @param {number} v the index of the vertex.
     * @returns {boolean} true if v is vacant and not adjacent to any settlement or city.
     */
    stable(v) {
        return this.vertex[v] == null && Field.adjacent(v).every(w => this.vertex[w] == null);
    }

    /**
     * @public
     * @param {number} p the index of the player.
     * @param {number} v the index of the vertex.
     * @returns {boolean} true if v is incident to some road of p.
     */
    connected(p, v) {
        return Field.incident(v).some(e => this.edge[e] === p);
    }

    /**
     * @public
     * @param {number} p the index of the player.
     * @param {number} v the index of the vertex.
     * @returns {boolean} true if p can build a city at v.
     */
    urbanizable(p, v) {
        return this.vertex[v]?.owner === p && this.vertex[v]?.type === "開拓地";
    }

    /**
     * @public
     * @throws {RangeError} when f is out of bounds.
     * @param {number} f the index of a face.
     * @returns {number[]} indices of encircling vertices.
     */
    static periphery(f) {
        if (!valid_face.includes(f)) throw RangeError("face index out of bounds");
        return [f * 2 + 1, f * 2 + 2, f * 2 + 3, f * 2 + vsize, f * 2 + vsize + 1, f * 2 + vsize + 2];
    }

    /**
     * @public
     * @throws {RangeError} when v is out of bounds.
     * @param {number} v the index of a vertex.
     * @returns {number[]} indices of surrounding faces.
     */
    static vicnity(v) {
        if (!valid_vertex.includes(v)) throw RangeError("vertex index out of bounds");
        if (v & 1) return [(v - 1) / 2 - 1, (v - 1) / 2, (v - 1) / 2 - fsize].filter(f => valid_face.includes(f));
        return [v / 2 - fsize - 1, v / 2 - fsize, v / 2 - 1].filter(f => valid_face.includes(f));
    }

    /**
     * @public
     * @throws {RangeError} when v is out of bounds.
     * @param {number} v the index of a vertex.
     * @returns {number[]} indices of adjacent vertices.
     */
    static adjacent(v) {
        if (!valid_vertex.includes(v)) throw RangeError("vertex index out of bounds");
        return [v - 1, v + 1, v & 1 ? v + vsize - 1 : v - vsize + 1].filter(v => valid_vertex.includes(v));
    }

    /**
     * @public
     * @throws {RangeError} when v is out of bounds.
     * @param {number} v the index of a vertex.
     * @returns {number[]} indices of indicent edges.
     */
    static incident(v) {
        if (!valid_vertex.includes(v)) throw RangeError("vertex index out of bounds");
        if (v & 1) return [(v - 1) * 3 / 2, (v - 1) * 3 / 2 + 1, (v - 1) * 3 / 2 + 2].filter(e => valid_edge.includes(e));
        return [(v - 2) * 3 / 2 + 1, v * 3 / 2, (v - vsize) * 3 / 2 + 2].filter(e => valid_edge.includes(e));
    }

    /**
     * @public
     * @throws {RangeError} when e is out of bounds.
     * @param {number} e the index of an edge.
     * @returns {number[]} indices of endpoint vertices.
     */
    static endpoints(e) {
        if (!valid_edge.includes(e)) throw RangeError("edge index out of bounds");
        const r = e % 3, q = (e - r) / 3;
        if (r === 0) return [q * 2 + 1, q * 2];
        if (r === 1) return [q * 2 + 1, q * 2 + 2];
        return [q * 2 + 1, q * 2 + vsize];
    }

    /**
     * @private
     * @param {(Resource|"３")[]} coast the order of coasts.
     * @returns {Object<(Resource|"３"),number[]>} indices of corresponding wharfs.
     */
    static computeWharf(coast) {
        const circumference = [
            [31, 33, 34, 36, 37],
            [39, 41, 60, 62, 81],
            [83, 100, 101, 118, 119],
            [136, 135, 133, 132, 130],
            [129, 110, 108, 89, 87],
            [68, 67, 50, 49, 32]
        ];
        const wharf = { "木": [], "泥": [], "羊": [], "麦": [], "鉄": [], "３": [] };
        for (let i = 0; i < coast.length; i++) {
            if (["泥", "羊", "麦"].includes(coast[i])) {
                wharf["３"].push(...Field.endpoints(circumference[i][0]));
                wharf[coast[i]].push(...Field.endpoints(circumference[i][3]));
            }
            else wharf[coast[i]].push(...Field.endpoints(circumference[i][2]));
        }
        return wharf;
    }
}

/**
 * @private
 * @returns {Face[]} an array of objects containing resources and rolls of dice.
 */
function initializeFace() {
    const face = new Array(fsize * fsize).fill(null);
    for (const f of valid_face) face[f] = {};
    generateResource(face);
    generateDice(face);
    return face;
}

const neighbor = [-1, -fsize, -fsize + 1, 1, fsize, fsize - 1];

/**
 * @private
 * @mutable
 * @param {Object[]} face resources will be distributed.
 */
function generateResource(face) {
    const corner = [38, 36, 22, 10, 12, 26];
    let waiting = { "木": 4, "泥": 3, "羊": 4, "麦": 4, "鉄": 3, "荒": 1 };
    for (const f of valid_face) {
        if (corner.includes(f)) continue;
        let pot = { ...waiting };
        const west = f + neighbor[0], northwest = f + neighbor[1], northeast = f + neighbor[2];
        if (valid_face.includes(northwest) && "resource" in face[northwest]
            && (valid_face.includes(west) && face[west].resource === face[northwest].resource
                || valid_face.includes(northeast) && face[northeast].resource === face[northwest].resource))
            pot[face[northwest].resource] = 0;
        const r = Random.pick(pot);
        face[f].resource = r;
        --waiting[r];
    }
    let stock = [];
    for (const resource of Object.keys(waiting)) {
        for (let k = 0; k < waiting[resource]; k++) {
            const locatable = corner.filter((f, i) => {
                return [...neighbor, ...neighbor].slice(i, i + 3).filter(d => face[f + d].resource === resource).length <= 1
                    && (k == 0 || [neighbor[i], neighbor[(i + 2) % neighbor.length]].every(d => face[f + d].resource !== resource));
            });
            stock.push({ resource, locatable });
        }
    }
    while (stock.length > 0) {
        const min_degree = Math.min(...Array.from(stock, x => x.locatable.length));
        const chosen = stock.findIndex(x => x.locatable.length === min_degree);
        const position = Random.extract(stock[chosen].locatable.filter(f => !("resource" in face[f])));
        face[position].resource = stock[chosen].resource;
        stock.splice(chosen, 1);
    }
}

/**
 * @private
 * @mutable
 * @param {Object[]} face spots of dice will be distributed.
 */
function generateDice(face) {
    /**
     * @param {number} n a pip.
     * @returns {number} the index to place it at.
     */
    function randomPlace(n) {
        return Random.extract(valid_face.filter(f => {
            if ("dice" in face[f]) return false;
            for (let i = 0; i < neighbor.length; i++) {
                let g = f + neighbor[i];
                if (!valid_face.includes(g) || !("dice" in face[g])) continue;
                if (face[g].dice === n) return false;
                if (Math.abs(n - 7) === 1 && Math.abs(face[g].dice - 7) === 1) return false;
                if (Math.abs(n - 7) === 2 && Math.abs(face[g].dice - 7) === 2) {
                    g = f + neighbor[(i + 1) % neighbor.length];
                    if (valid_face.includes(g) && Math.abs(face[g].dice - 7) === 1) return false;
                    g = f + neighbor[(i + neighbor.length - 1) % neighbor.length];
                    if (valid_face.includes(g) && Math.abs(face[g].dice - 7) === 1) return false;
                }
            }
            return true;
        }));
    }
    face[valid_face.find(f => face[f].resource === "荒")].dice = 1;
    for (const d of [6, 6, 8, 8, 5, 5, 9, 9]) face[randomPlace(d)].dice = d;
    const gentle = [4, 10, 3, 11, 2];
    while (gentle.length > 0) {
        const adjoin = valid_face.map(f => "dice" in face[f] ? -1 : neighbor.filter(r => valid_face.includes(f + r) && !("dice" in face[f + r])).length);
        const d = Random.extract(gentle);
        face[valid_face[adjoin.indexOf(Math.max(...adjoin))]].dice = d;
        face[randomPlace(d)].dice = d !== 2 ? d : 12;
    }
}

/**
 * @private
 * @returns {Vertex[]} an array of objects containing the owner and type of the building (initially null).
 */
function initializeVertex() {
    const vertex = new Array(2 * fsize * fsize).fill(null);
    return vertex;
}

/**
 * @private
 * @returns {Edge[]} an array of indices indicating the owner of the road (initially null).
 */
function initializeEdge() {
    const edge = new Array(3 * fsize * fsize).fill(null);
    return edge;
}

Object.assign(Field.prototype, { fsize, vsize, valid_face, valid_vertex, valid_edge });
module.exports = Field;
