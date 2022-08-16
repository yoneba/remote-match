'use strict';

const Random = require("../random.js");
const CatanModel = require("./model.js");
const DomainService = require("../service.js");

/**
 * @public
 * @member {CatanModel} game the data structure for the catan game.
 */
class CatanService extends DomainService {
    /**
     * @public
     * @constructor
     * @param {string} name the name of the service output to the log.
     * @param {EventEmitter} target the target EventEmitter object to send notification to.
     */
    constructor(name, target) {
        super(name, target);
    }

    /**
     * @public
     * @summary conduct the catan game.
     */
    async main() {
        this.game = new CatanModel(this.participant.length);
        console.log(`[${this.name}] a catan game has started (participants: ${this.participant}).`);
        while (this.game.score(this.game.turn) < 10) {
            const { subject, data: { func, args } } = await this.listen();
            if (func === "rollDice") {
                let n1 = 1 + Random.rand(6), n2 = 1 + Random.rand(6);
                if (n1 + n2 === 7 && this.game.elapsed < this.game.player.length * 3) {
                    n2 = 1 + Random.rand(5);
                    if (n1 + n2 >= 7) ++n2;
                }
                const n = this.game.bless(n1 + n2);
                console.log(`[${this.name}] the dice roll was ${n}.`);
                this.supplement.dice = { n1, n2 };
                this.notify();
                if (n === 7) {
                    let trashes = this.game.player.map(x => x.handnum > 7 ? null : { "木": 0, "泥": 0, "羊": 0, "麦": 0, "鉄": 0 });
                    while (trashes.includes(null)) {
                        const { subject: who, data: { args: [trash] } } = await this.listen();
                        trashes[who] = trash;
                    }
                    for (let i = 0; i < trashes.length; i++) {
                        const trash = trashes[i];
                        if (Object.values(trash).reduce((s, x) => s + x, 0) > 0) {
                            this.game.burst(i, trash);
                            console.log(`[${this.name}] ${this.participant[i]} discarded ${trash} due to burst.`);
                        }
                    }
                }
            }
            else if (func === "negotiate") {
                const [whom, give, take] = args;
                this.supplement.negotiation = { whom, give, take };
                this.notify();
                const { data: { args: [accepted] } } = await this.listen();
                if (accepted)
                    this.game.barter(subject, whom, give, take);
                Object.assign(this.supplement.negotiation, { accepted });
            }
            else if (func === "buildSettlementAndRoad") {
                const [v, e] = args;
                this.game.buildSettlement(subject, v);
                this.game.buildRoad(subject, e);
                this.game.turnEnd();
                console.log(`[${this.name}] ${this.participant[subject]} has built a settlement at ${v} and a road at ${e}.`);
            }
            else {
                this.game[func](subject, ...args);
                console.log(`[${this.name}] ${this.participant[subject]} did "${func}" with arguments ${args}.`);
                if (func === "turnEnd") delete this.supplement.dice;
            }
            this.notify();
            delete this.supplement.negotiation;
        }
        console.log(`[${this.name}] ${this.participant[this.game.turn]} has won.`);
        this.notify();
        await this.listen();
        delete this.game;
    }
}

Object.assign(CatanService, { minimum: 3, maximum: 4 });

module.exports = CatanService;
