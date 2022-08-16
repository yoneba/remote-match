'use strict';

/** @todo validate inputs and throw exception */

const Random = require("../random.js");
const Field = require("./field.js");

/**
 * @typedef {"道"|"開拓地"|"都市"} Building
 * @typedef {Building|"発展"} Action
 * @typedef {"騎士"|"街道建設"|"発見"|"独占"|"得点"} Development
 * @typedef {{type:Development,status:("unused"|"used"))}} Chance
 */

/**
 * @private
 * @type {Object<Action,Object<Resource,number>>}
 * @description resources required for each action.
 */
const cost = {
    "道": { "木": 1, "泥": 1, "羊": 0, "麦": 0, "鉄": 0 },
    "開拓地": { "木": 1, "泥": 1, "羊": 1, "麦": 1, "鉄": 0 },
    "都市": { "木": 0, "泥": 0, "羊": 0, "麦": 2, "鉄": 3 },
    "発展": { "木": 0, "泥": 0, "羊": 1, "麦": 1, "鉄": 1 }
};

/**
 * @public
 * @member {Object<Resource,number>} hand resources the player has.
 * @member {Chance[]} chance chance cards the player has.
 * @member {number} distance the maximum number of edges of the player's trail.
 */
class Player {
    /**
     * @public
     * @constructor
     */
    constructor() {
        this.hand = { "木": 0, "泥": 0, "羊": 0, "麦": 0, "鉄": 0 };
        this.chance = [];
        this.distance = 0;
    }

    /**
     * @public
     * @returns {number} the number of cards the player has.
     */
    get handnum() {
        return Object.values(this.hand).reduce((s, n) => s + n);
    }

    /**
     * @public
     * @mutable
     * @param {Object<Resource,number>} resource_vector a resource vector to be added to the hand.
     */
    add(resource_vector) {
        for (const r of Object.keys(this.hand)) this.hand[r] += resource_vector[r];
    }

    /**
     * @public
     * @mutable
     * @param {Object<Resource,number>} resource_vector a resource vector to be subtracted from the hand.
     */
    subtract(resource_vector) {
        for (const r of Object.keys(this.hand)) this.hand[r] -= resource_vector[r];
    }

    /**
     * @public
     * @param {Action} action what to do.
     * @returns {boolean} whether the player has enough resources to perform the action.
     */
    afford(action) {
        return Object.keys(this.hand).every(r => this.hand[r] >= cost[action][r]);
    }
    
    /**
     * @public
     * @returns {number} the knight power.
     */
    get knightPower() {
        return this.chance.filter(d => d.type === "騎士" && d.status === "used").length;
    }
}

/**
 * @public
 * @inheritdoc
 * @member {Player[]} player participating players.
 * @member {Object<Development,number>} development remaining development cards.
 * @member {number} turn the index of the player to move.
 * @member {?number} robber the index of the face where the robber exists.
 * @member {?number} longest the index of the player who possesses longest.
 * @member {?number} largest the index of the player who possesses largest.
 * @member {boolean} executable true if the player to move may execute a chance card.
 * @member {{face:Face[],coast:(Resource|"３")[],variation:{func:string,args:any[]}[]}} history progress of the game.
 */
class CatanModel extends Field {
    /**
     * @public
     * @constructor
     * @param {number} n the number of players.
     * @param {?Face[]} face the initial distribution of faces.
     * @param {?(Resource|"３")[]} coast the initial order of coasts.
     */
    constructor(n = 4, face = null, coast = null) {
        super(face, coast);
        this.player = [];
        for (let i = 0; i < n; i++) this.player.push(new Player);
        this.development = { "騎士": 14, "街道建設": 2, "発見": 2, "独占": 2, "得点": 5 };
        this.turn = 0;
        this.robber = this.face.findIndex(x => x != null && x.resource === "荒");
        this.longest = null;
        this.largest = null;
        this.executable = true;
        this.history = { face: this.face, coast: this.coast, variation: [] };
    }

    /**
     * @public
     * @param {number} p the index of the player.
     * @returns {number} the player's score.
     */
    score(p) {
        let s = this.vertex.filter(x => x?.owner === p && x?.type === "開拓地").length
            + this.vertex.filter(x => x?.owner === p && x?.type === "都市").length * 2
            + this.player[p].chance.filter(d => d.type === "得点").length;
        if (p === this.longest) s += 2;
        if (p === this.largest) s += 2;
        return s;
    }

    /**
     * @public
     * @param {number} p the index of the player.
     * @param {Building} building the type of the building.
     * @returns {number} the number of building blocks remaining.
     */
    remaining(p, building) {
        if (building === "道") return 15 - this.edge.filter(x => x === p).length;
        if (building === "開拓地") return 5 - this.vertex.filter(x => x?.owner === p && x?.type === "開拓地").length;
        if (building === "都市") return 4 - this.vertex.filter(x => x?.owner === p && x?.type === "都市").length;
    }

    /**
     * @protected
     * @param {number} p the index of the player.
     * @returns {number} the distance of a longest trail.
     */
    recomputeDistance(p) {
        const dist = 0;
        const roads = this.valid_edge.filter(e => this.edge[e] === p);
        for (let i = roads.length; i > dist; i--) {
            const e = roads[i - 1];
            this.edge[e] = null;
            dist = Math.max(dist, this.measure(p, e));
        }
        for (const e of roads) this.edge[e] = p;
        return dist;
    }
    
    /**
     * @public
     * @mutable
     * @param {number} p the index of the player to rob.
     * @param {number} f the index of the face where the robber will go.
     * @param {?number} q the index of the player to be robbed.
     * @param {?Resource} [r] resource to deprive.
     */
    rob(p, f, q, r = q != null ? Random.pick(this.player[q].hand) : null) {
        if (this.history.variation[this.history.variation.length - 1].func !== "executeChanceCard")
            this.history.variation.push({ func: "rob", args: [p, f, q, r] });
        this.robber = f;
        if (r != null) {
            --this.player[q].hand[r];
            ++this.player[p].hand[r];
        }
    }

    /**
     * @public
     * @param {number} p the index of the player.
     * @param {Resource} r resource to export.
     * @returns {number} the number of resource cards needed for trading.
     */
    exchangeRate(p, r) {
        if (this.wharf[r].some(v => this.vertex[v]?.owner === p)) return 2;
        if (this.wharf["３"].some(v => this.vertex[v]?.owner === p)) return 3;
        return 4;
    }

    /**
     * @public
     * @mutable
     * @param {Dice} [n] dots of dice.
     * @summary yielded resources are supplied to each player.
     * @returns {number} dots of dice.
     */
    bless(n = 1 + Random.rand(6) + 1 + Random.rand(6)) {
        this.history.variation.push({ func: "bless", args: [n] });
        for (const f of this.valid_face) {
            if (this.face[f].dice !== n || f === this.robber) continue;
            for (const v of Field.periphery(f)) {
                if (this.vertex[v] == null) continue;
                this.player[this.vertex[v].owner].hand[this.face[f].resource] += 1 + (this.vertex[v].type === "都市");
            }
        }
        return n;
    }

    /**
     * @public
     * @mutable
     * @summary ends the current player's turn.
     */
    turnEnd() {
        if (this.elapsed < this.player.length || this.elapsed >= 2 * this.player.length)
            this.turn = (this.turn + 1) % this.player.length;
        this.executable = true;
        this.history.variation.push({ func: "turnEnd", args: [] });
        if (this.elapsed >= this.player.length && this.elapsed < 2 * this.player.length)
            this.turn = (this.turn + this.player.length - 1) % this.player.length;
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} e the index of the edge.
     * @param {boolean} [pay] true if the player is to pay cost.
     */
    buildRoad(p, e, pay = this.elapsed >= 2 * this.player.length) {
        this.history.variation.push({ func: "buildRoad", args: [p, e, pay] });
        if (pay) this.player[p].subtract(cost["道"]);
        const d = this.measure(p, e);
        if (d > this.player[p].distance) {
            if (d >= 5 && this.player.every(x => x.distance < d)) this.longest = p;
            this.player[p].distance = d;
        }
        this.edge[e] = p;
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} v the index of the vertex.
     * @param {boolean} [pay] true if the player is to pay cost.
     */
    buildSettlement(p, v, pay = this.elapsed >= 2 * this.player.length) {
        this.history.variation.push({ func: "buildSettlement", args: [p, v, pay] });
        if (pay) this.player[p].subtract(cost["開拓地"]);
        else if (this.elapsed >= this.player.length)
            Field.vicnity(v).map(f => this.face[f].resource).forEach(r => r !== "荒" && ++this.player[p].hand[r]);
        this.vertex[v] = { owner: p, type: "開拓地" };
        const junction = Field.incident(v).map(e => this.edge[e]);
        const q = junction.find((x, i) => x != null && i !== junction.lastIndexOf(x));
        if (q != null && q !== p) {
            const d = this.recomputeDistance(q);
            if (d < this.player[q].distance) {
                this.player[q].distance = d;
                if (this.longest === q) {
                    const dist_array = this.player.map(x => x.distance);
                    const max_dist = Math.max(...dist_array);
                    const champion = dist_array.indexOf(max_dist);
                    if (max_dist < 5 || champion !== dist_array.lastIndexOf(max_dist)) this.longest = null;
                    else this.longest = champion;
                }
            }
        }
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} v the index of the vertex.
     */
    buildCity(p, v) {
        this.history.variation.push({ func: "buildCity", args: [p, v] });
        this.player[p].subtract(cost["都市"]);
        this.vertex[v].type = "都市";
    }
    
    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {Development} [d] the card to be drawn.
     */
    develop(p, d = Random.pick(this.development)) {
        this.history.variation.push({ func: "development", args: [p, d] });
        this.player[p].subtract(cost["発展"]);
        --this.development[d];
        this.player[p].chance.push({ type: d, status: "unused" });
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {Object<Resource,number>} trash a resource vector to be discarded.
     */
    burst(p, trash) {
        this.history.variation.push({ func: "burst", args: [p, trash] });
        this.player[p].subtract(trash);
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} j the card at j th position of this.player[p].chance will be used.
     * @param {...any} args arguments.
     */
    executeChanceCard(p, j, ...args) {
        this.history.variation.push({ func: "executeChanceCard", args: [p, j, ...args] });
        const card = this.player[p].chance[j];
        card.status = "used";
        this.executable = false;
        if (card.type === "騎士") {
            const [f, q, r] = args;
            this.rob(p, f, q, r);
            const power = this.player[p].knightPower;
            if (power >= 3 && (this.largest == null || power > this.player[this.largest].knightPower)) this.largest = p;
        }
        if (card.type === "街道建設") {
            const [e1, e2] = args;
            if (e1 != null) this.buildRoad(p, e1, false);
            if (e2 != null) this.buildRoad(p, e2, false);
        }
        if (card.type === "発見") {
            const [r1, r2] = args;
            ++this.player[p].hand[r1];
            ++this.player[p].hand[r2];
        }
        if (card.type === "独占") {
            const [r] = args;
            for (let i = 0; i < this.player.length; i++) {
                if (i === p) continue;
                this.player[p].hand[r] += this.player[i].hand[r];
                this.player[i].hand[r] = 0;
            }
        }
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {Resource} exp resource to export.
     * @param {Resource} imp resource to import.
     */
    trade(p, exp, imp) {
        this.history.variation.push({ func: "trade", args: [p, exp, imp] });
        this.player[p].hand[exp] -= this.exchangeRate(p, exp);
        ++this.player[p].hand[imp];
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} q the index of the player.
     * @param {Object<Resource,number>} give the resource vector p gives to q.
     * @param {Object<Resource,number>} take the resource vector q gives to p.
     */
    barter(p, q, give, take) {
        this.history.variation.push({ func: "barter", args: [p, q, give, take] });
        this.player[p].add(take);
        this.player[q].add(give);
        this.player[p].subtract(give);
        this.player[q].subtract(take);
    }

    /**
     * @private
     * @returns {number} the present turn count.
     */
    get elapsed() {
        return this.history.variation.filter(x => x.func === "turnEnd").length;
    }
}

CatanModel.prototype.validate = {
    "サイコロ": function () { return true; },
    "終了": function () { return true; },
    "道": function (p, e) {
        return this.remaining(p, "道") > 0 && this.admissible(p, e)
            && (this.elapsed < 2 * this.player.length || this.player[p].afford("道"));
    },
    "開拓地": function (p, v) {
        return this.remaining(p, "開拓地") > 0 && this.stable(v)
            && (this.elapsed < 2 * this.player.length || this.player[p].afford("開拓地") && this.connected(p, v));
    },
    "都市": function (p, v) {
        return this.remaining(p, "都市") > 0 && this.urbanizable(p, v) && this.player[p].afford("都市");
    },
    "発展": function (p) {
        return Object.values(this.development).reduce((s, n) => s + n) > 0 && this.player[p].afford("発展");
    },
    "騎士": function (p, f, q) {
        return Field.periphery(f).every(v => v == null) || Field.periphery(f).some(v => v?.owner === q);
    },
    "街道建設": function (p, e1, e2) {
        return this.remaining(p, "道") === 0 && e1 == null && e2 == null
            || this.remaining(p, "道") === 1 && this.admissible(e1) && e2 == null
            || this.remaining(p, "道") >= 2 && this.admissible(e1) && this.admissible(e2);
    },
    "発見": function (p, r1, r2) { return true; },
    "独占": function (p, r) { return true; },
};

module.exports = CatanModel;
