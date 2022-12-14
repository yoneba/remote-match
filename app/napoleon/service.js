'use strict';

const fs = require("fs");

const NapoleonModel = require("./model.js");
const DomainService = require("../service.js");

/** @todo cooperate with AI subroutine */
/** @todo recording and replaying function */
/** @todo consider how to handle timing of painting (browser refresh is needed at present) */

/**
 * @public
 * @member {NapoleonModel} game the data structure for the napoleon game.
 */
class NapoleonService extends DomainService {
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
     * @summary conduct the napoleon game.
     */
    async main() {
        this.game = new NapoleonModel(this.participant.length);
        console.log(`[${this.name}] a napoleon game has started (participants: ${this.participant}).`);
        for (let ttl = this.game.player.length - 1; ttl >= 0; ttl--) {
            this.notify();
            const { subject, data: { declaration } } = await this.listen();
            console.log(`[${this.name}] ${this.participant[subject]} has declared ${declaration}.`);
            if (declaration !== this.game.player[subject].bid) ttl = this.game.player.length;
            this.game.bet(subject, declaration);
        }
        this.game.turn = null;
        await this.notify();
        this.game.elect();
        console.log(`[${this.name}] ${this.participant[this.game.napoleon]} has inaugurated as napoleon.`);
        this.notify();
        const { data: { trump, medal } } = await this.listen();
        this.game.designate(trump, medal);
        console.log(`[${this.name}] (${trump}, ${medal}) has been designated.`);
        await this.notify();
        this.game.draw();
        console.log(`[${this.name}] napoleon has drawn cards in the piled kitty.`);
        const locateCard = (nickname) => {
            const card = this.game.translate(nickname);
            if (this.game.kitty.includes(card)) return "???";
            if (this.game.player[this.game.napoleon].hand.includes(card)) return "??????";
            if (this.game.player[this.game.adjutant].hand.includes(card)) return "??????";
            return "??????";
        };
        fs.appendFile("napoleon.log", (new Date()).toISOString() + ' ' + JSON.stringify(
            Object.fromEntries([
                ["????????????", locateCard("????????????")],
                ["???????????????", locateCard("??????????????????????????????")],
                ["??????????????????", locateCard("??????????????????")],
                ["??????????????????", locateCard("??????????????????")],
                ["???????????????", locateCard("???????????????")],
                ["???????????????", locateCard("???????????????")],
                ["????????????3", locateCard("????????????3")],
            ])
        ) + '\n', () => { });
        this.notify();
        const { data: { trash } } = await this.listen();
        this.game.discard(trash);
        console.log(`[${this.name}] napoleon has discarded ${trash.map(i => this.game.player[this.game.napoleon].hand[i])}.`);
        while (this.game.winner === "") {
            while (this.game.layout.includes(null)) {
                this.notify();
                const { subject, data: { index, request } } = await this.listen();
                console.log(
                    `[${this.name}] ${this.participant[subject]} has played ` +
                    `${this.game.player[subject].hand[index]}` +
                    (request != null ? ` and requested ${request}` : ``) +
                    `.`
                );
                this.game.play(subject, index, request);
            }
            await this.notify();
            this.game.liquidate();
        }
        console.log(`[${this.name}] ${this.game.winner} has won.`);
        this.notify();
        await this.listen();
        delete this.game;
    }
}

Object.assign(NapoleonService, { minimum: 4, maximum: 5 });

module.exports = NapoleonService;
