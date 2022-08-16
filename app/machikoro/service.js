'use strict';

const Random = require("../random.js");
const MachikoroModel = require("./model.js");
const DomainService = require("../service.js");

/**
 * @public
 * @member {MachikoroModel} game the data structure for the machikoro game.
 */
class MachikoroService extends DomainService {
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
     * @summary conduct the machikoro game.
     */
    async main() {
        this.game = new MachikoroModel(this.participant.length);
        console.log(`[${this.name}] a machikoro game has started (participants: ${this.participant}).`);
        while (!this.game.currentPlayer.complete()) {
            const { subject, data: { rolls } } = await this.listen();
            const n1 = 1 + Random.rand(6), n2 = rolls > 1 ? 1 + Random.rand(6) : 0;
            this.game.cast(n1, n2);
            console.log(`[${this.name}] the dice rolls were ${n1}+${n2}=${n1 + n2}.`);
            if (this.game.chance > 0) {
                this.notify();
                const { data: { revoke } } = await this.listen();
                if (revoke) {
                    this.game.retry(true);
                    console.log(`[${this.name}] the dice rolls were revoked.`);
                    this.notify();
                    continue;
                }
            }
            this.game.retry(false);
            let large_facility_args = {};
            if (n1 + n2 === 6 && (this.game.player[subject].facilities["テレビ局"] > 0 || this.game.player[subject].facilities["ビジネスセンター"] > 0)) {
                this.notify();
                large_facility_args = (await this.listen()).data;
            }
            this.game.transact(large_facility_args);
            this.notify();
            const { data: { card } } = await this.listen();
            this.game.buy(card);
            console.log(`[${this.name}] ${this.participant[subject]} has bought ${card}.`);
            this.notify();
        }
        console.log(`[${this.name}] ${this.participant[this.game.turn]} has won.`);
        this.notify();
        await this.listen();
        delete this.game;
    }
}

Object.assign(MachikoroService, { minimum: 2, maximum: 4 });

module.exports = MachikoroService;
