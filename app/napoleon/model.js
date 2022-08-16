'use strict';

/** @todo validate inputs and throw exception */

const Random = require("../random.js");

/**
 * @typedef {"スペード"|"ハート"|"ダイヤ"|"クラブ"} Suit
 * @typedef {string} Card
 * @typedef {{hand:Card[],obtained:Card[],bid:?number}[]} Player
 */

 /**
  * @public
  * @member {Card[]} layout upcards appearing on the field.
  * @member {Card[]} kitty remaining downcards used for the exchange of napoleon's hand.
  * @member {Player[]} player participating players.
  * @member {number} turn the index of the player to move.
  * @member {number} rotation 1 if clockwise player.length - 1 if counter clockwise.
  * @member {(Suit|"ジョーカー")[]} constraint suits players must follow (in a prioritized order).
  * @member {number} contract the boundary value to determine the winner.
  * @member {number} napoleon the index of napoleon.
  * @member {number} adjutant the index of the adjutant.
  * @member {Suit} trump the suit of the trump.
  * @member {string} medal the nickname of the card the owner of which is the adjutant.
  * @member {{seeder:number[],variation:{func:string,args:any[]}[]}} history progress of the game.
  */
class NapoleonModel {
    /**
     * @public
     * @constructor
     * @param {number} n the number of players.
     * @param {number[]} seeder the seeding array used for hand distribution.
     */
    constructor(n = 5, seeder = []) {
        this.layout = new Array(n).fill(null);
        this.kitty = [];
        this.player = [];
        for (let i = 0; i < n; i++)this.player.push({ hand: [], obtained: [], bid: null });
        const card_list = this.constructor.cardList();
        if (seeder.length === 0) {
            for (let i = 0; i < card_list.length; i++)seeder.push(Math.floor(i / Math.floor(50 / n)));
            Random.shuffle(seeder);
        }
        for (let i = 0; i < card_list.length; i++) {
            const card = card_list[i];
            const p = seeder[i];
            if (p < n) this.player[p].hand.push(card);
            else this.kitty.push(card);
        }
        this.turn = 0;
        this.rotation = 1;
        this.constraint = [];
        this.contract = 19 - this.player.length;
        this.history = { seeder, variation: []};
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} n the bid.
     */
    bet(p, n) {
        this.history.variation.push({ func: "bet", args: [p, n] });
        this.player[p].bid = n;
        if (n > this.contract) this.contract = n;
        this.turn = (this.turn + this.rotation) % this.player.length;
    }

    /**
     * @public
     * @mutable
     * @summary elect napoleon by lottery.
     */
    elect() {
        const vote = this.player.map(x => x.bid);
        const greatest = Math.max(...vote);
        const candidate = vote.map((x, i) => x === greatest ? i : -1).filter(x => x >= 0);
        this.napoleon = Random.extract(candidate);
        this.turn = this.napoleon;
    }

    /**
     * @public
     * @mutable
     * @param {Suit} trump the suit to be set as the trump.
     * @param {string} medal the player who has this card will be inaugurated as the adjutant.
     * @summary set trump and medal.
     */
    designate(trump, medal) {
        this.history.variation.push({ func: "designate", args: [trump, medal] });
        this.trump = trump;
        this.medal = ["マイティ", "正ジャック", "裏ジャック"].find(x => this.translate(x) === medal) ?? medal;
    }

    /**
     * @public
     * @mutable
     * @returns {number[]} indices of drawn cards.
     */
    draw() {
        this.player[this.napoleon].hand.push(...this.kitty);
        this.player[this.napoleon].hand.sort((a, b) => this.constructor.ord(a) - this.constructor.ord(b));
        this.adjutant = this.player.findIndex(x => x.hand.some(y => y === this.translate(this.medal)));
        const drawn = this.kitty.map(x => this.player[this.napoleon].hand.indexOf(x));
        this.kitty = [];
        return drawn;
    }

    /**
     * @public
     * @mutable
     * @param {number[]} trash indices of cards to discard.
     */
    discard(trash) {
        this.history.variation.push({ func: "discard", args: [trash] });
        this.kitty = trash.map(i => this.player[this.napoleon].hand[i]);
        this.kitty.sort((a, b) => (a.match(/(10|J|Q|K|A)$/) != null) - (b.match(/(10|J|Q|K|A)$/) != null));
        this.player[this.napoleon].hand = this.player[this.napoleon].hand.filter(x => !this.kitty.includes(x));
    }

    /**
     * @public
     * @param {number} [p] the index of the player.
     * @returns {number[]} indices of cards which may be played.
     */
    availableCards(p = this.turn) {
        for (const suit of this.constraint) {
            const match = this.player[p].hand.filter(x => x.includes(suit) || x.endsWith("ジョーカー"));
            if (match.some(x => x.includes(suit))) return match.map(x => this.player[p].hand.indexOf(x));
        }
        return this.player[p].hand.map((x, i) => i);
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} j the index of the card to play.
     * @param {?Suit} request the suit to force other players to follow (set when leading joker).
     */
    play(p, j, request) {
        this.history.variation.push({ func: "play", args: [p, j, request] });
        const card = this.player[p].hand.splice(j, 1)[0];
        this.layout[p] = card;
        if (this.constraint.length === 0) {
            this.constraint.push(request ?? card.split("の")[0]);
            if (card === "クラブの3") this.constraint.unshift("ジョーカー");
        }
        this.turn = (this.turn + this.rotation) % this.player.length;
    }

    /**
     * @public
     * @mutable
     * @summary settle the trick and prepare a new trick.
     */
    liquidate() {
        const lead = this.umpire();
        for (const card of this.layout)
            if (card.endsWith("J") && ["正ジャック", "裏ジャック"].every(x => card !== this.translate(x)))
                this.rotation = this.player.length - this.rotation;
        this.kitty.push(...this.layout);
        this.player[lead].obtained.push(...this.kitty.filter(x => x.match(/(10|J|Q|K|A)$/)));
        this.kitty = [];
        this.layout.fill(null);
        this.turn = lead;
        this.constraint = [];
    }

    /**
     * @protected
     * @returns {number} the index of the player to take the trick.
     */
    umpire() {
        const stagger = this.layout.find(x => x === "ハートのQ");
        const mighty = this.layout.find(x => x === this.translate("マイティ"));
        const extra = this.layout.find(x => x === "エクストラジョーカー");
        let joker = null;
        for (let i = 0; i < this.player.length; i++)
            if (this.layout[(this.turn + this.rotation * i) % this.player.length].endsWith("ジョーカー"))
                joker = this.layout[(this.turn + this.rotation * i) % this.player.length];
        const holy = this.layout.find(x => x === this.translate("正ジャック"));
        const evil = this.layout.find(x => x === this.translate("裏ジャック"));
        const special = mighty && stagger || mighty || extra || joker || holy || evil;
        if (special) return this.layout.indexOf(special);
        const critical = this.layout.some(x => x.startsWith(this.trump))
            ? this.trump : this.constraint[this.constraint.length - 1];
        const power = this.layout.map(x => x.startsWith(critical) ? this.constructor.ord(x) : -1);
        if (this.history.variation.filter(x => x.func === "play").length > this.player.length
            && !power.includes(-1) && this.layout.some(x => x.endsWith("2")))
            return this.layout.findIndex(x => x.endsWith("2"));
        return power.indexOf(Math.max(...power));
    }

    /**
     * @public
     * @returns {"連合軍"|"ナポレオン軍"|""} the winner of the game (empty string if not determined).
     */
    get winner() {
        let declarer = 0, defender = 0;
        for (let i = 0; i < this.player.length; i++) {
            if (i === this.napoleon || i === this.adjutant) declarer += this.player[i].obtained.length;
            else defender += this.player[i].obtained.length;
        }
        if (defender > 20 - this.contract || declarer === 20 && this.contract < 20) return "連合軍";
        if (declarer >= this.contract && (defender > 0 || this.contract === 20)) return "ナポレオン軍";
        return "";
    }

    /**
     * @protected
     * @param {string} nickname the nickname of a card.
     * @returns {Card} the real name of the card.
     */
    translate(nickname) {
        if (nickname === "マイティ") return (this.trump !== "スペード" ? "スペード" : "クラブ") + "のA";
        if (nickname === "正ジャック") return this.trump + "のJ";
        if (nickname === "裏ジャック") return this.constructor.inverse(this.trump) + "のJ";
        return nickname;
    }

    /**
     * @public
     * @returns {Card[]} an exclusive and exhaustive ordered list of cards.
     */
    static cardList() {
        const card_list = [];
        for (const suit of ["スペード", "ハート", "ダイヤ", "クラブ"])
            for (const rank of ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"])
                card_list.push(`${suit}の${rank}`);
        for (const rank of ["黒", "赤", "エクストラ"]) card_list.push(`${rank}ジョーカー`);
        return card_list;
    }

    /**
     * @public
     * @param {Suit} suit 
     * @returns {Suit} the inverse suit.
     */
    static inverse(suit) {
        return { "スペード": "クラブ", "ハート": "ダイヤ", "ダイヤ": "ハート", "クラブ": "スペード" }[suit];
    }

    /**
     * @public
     * @param {Card} card a card.
     * @returns {number} the order of the card.
     */
    static ord(card) {
        return this.cardList().indexOf(card);
    }
}

module.exports = NapoleonModel;
