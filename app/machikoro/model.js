'use strict';

/**
 * @typedef {"駅"|"ショッピングモール"|"遊園地"|"電波塔"} Landmark
 * @typedef {"麦畑"|"牧場"|"パン屋"|"カフェ"|"コンビニ"|"森林"|"スタジアム"|"テレビ局"|"ビジネスセンター"|"チーズ工場"|"家具工場"|"鉱山"|"ファミレス"|"リンゴ園"|"青果市場"} Facility
 * @typedef {1|2|3|4|5|6|7|8|9|10|11|12} DotSum
 */

/**
 * @private
 * @type {Object<Landmark|Facility,number>}
 * @description coins required for each card.
 */
const cost = {
    "駅": 4, "ショッピングモール": 10, "遊園地": 16, "電波塔": 22,
    "麦畑": 1, "牧場": 1, "パン屋": 1, "カフェ": 2, "コンビニ": 2,
    "森林": 3, "スタジアム": 6, "テレビ局": 7, "ビジネスセンター": 8, "チーズ工場": 5,
    "家具工場": 3, "鉱山": 6, "ファミレス": 3, "リンゴ園": 3, "青果市場": 2,
};

/**
 * @public
 * @member {number} coin the amount of money the player possesses.
 * @member {Object<Landmark,(0|1)>} landmarks landmarks the player has built.
 * @member {Object<Facility,number>} facilities facilities the player has built.
 */
class Player {
    /**
     * @public
     * @constructor
     */
    constructor() {
        this.coin = 3;
        this.landmarks = { "駅": 0, "ショッピングモール": 0, "遊園地": 0, "電波塔": 0 };
        this.facilities = {
            "麦畑": 1, "牧場": 0, "パン屋": 1, "カフェ": 0, "コンビニ": 0,
            "森林": 0, "スタジアム": 0, "テレビ局": 0, "ビジネスセンター": 0, "チーズ工場": 0,
            "家具工場": 0, "鉱山": 0, "ファミレス": 0, "リンゴ園": 0, "青果市場": 0,
        };
    }

    /**
     * @public
     * @param {Landmark|Facility} card to purchase.
     * @returns whether the player has enough coins.
     */
    afford(card) {
        return this.coin >= cost[card];
    }

    /**
     * @public
     * @param {Landmark|Facility} card to purchase.
     * @returns whether the player can purchase the card.
     */
    canPurchase(card) {
        if (!this.afford(card)) return false;
        if (Object.keys(this.landmarks).includes(card)) return this.landmarks[card] === 0;
        return !["スタジアム", "テレビ局", "ビジネスセンター"].includes(card) || this.facilities[card] === 0;
    }

    /**
     * @public
     * @mutable
     * @throws {RangeError} when the purchase is invalid.
     * @param {Landmark|Facility} card 
     */
    purchase(card) {
        if (!this.afford(card)) throw RangeError("The player does not have enough coins.");
        this.coin -= cost[card];
        if (Object.keys(this.landmarks).includes(card)) {
            if (this.landmarks[card] > 0) throw RangeError("The player has already built the landmark.");
            this.landmarks[card] = 1;
        }
        else {
            if (["スタジアム", "テレビ局", "ビジネスセンター"].includes(card) && this.facilities[card] > 0)
                throw RangeError("Each type of large facility is limited up to 1 per player.");
            ++this.facilities[card];
        }
    }

    /**
     * @public
     * @param {DotSum} n dots of dice.
     * @returns {number} coins to take by red cards.
     */
    imposition(n) {
        if (n === 3) return this.facilities["カフェ"] * (1 + this.landmarks["ショッピングモール"]);
        if (n === 9 || n === 10) return this.facilities["ファミレス"] * (2 + this.landmarks["ショッピングモール"]);
        return 0;
    }

    /**
     * @public
     * @param {DotSum} n dots of dice.
     * @param {boolean} oneself whether the turn is the player's or not.
     * @returns {number} coins to receive by blue or green cards.
     */
    gain(n, oneself) {
        if (n === 1) return this.facilities["麦畑"];
        if (n === 2) return this.facilities["牧場"] + (oneself ? this.facilities["パン屋"] * (1 + this.landmarks["ショッピングモール"]) : 0);
        if (n === 3) return oneself ? this.facilities["パン屋"] * (1 + this.landmarks["ショッピングモール"]) : 0;
        if (n === 4) return oneself ? this.facilities["コンビニ"] * (3 + this.landmarks["ショッピングモール"]) : 0;
        if (n === 5) return this.facilities["森林"];
        if (n === 7) return oneself ? this.facilities["チーズ工場"] * this.facilities["牧場"] * 3 : 0;
        if (n === 8) return oneself ? this.facilities["家具工場"] * (this.facilities["森林"] + this.facilities["鉱山"]) * 3 : 0;
        if (n === 9) return this.facilities["鉱山"] * 5;
        if (n === 10) return this.facilities["リンゴ園"] * 3;
        if (n === 11 || n === 12) return oneself ? this.facilities["青果市場"] * (this.facilities["麦畑"] + this.facilities["リンゴ園"]) * 2 : 0;
        return 0;
    }

    /**
     * @public
     * @returns {boolean} whether the player has completed landmarks.
     */
    complete() {
        return Object.values(this.landmarks).every(x => x > 0);
    }
}

/**
 * @public
 * @member {Player[]} player participating players.
 * @member {number} turn the index of the player to move.
 * @member {{n1:(0|1|2|3|4|5|6),n2:(0|1|2|3|4|5|6)}} dice current dots of dice.
 * @member {number} chance the remaining number of trials in which the player can throw dice.
 * @member {{variation:{func:string,args:any[]}[]}} history progress of the game.
 */
class MachikoroModel {
    /**
     * @public
     * @constructor
     * @param {number} n the number of players.
     */
    constructor(n) {
        this.player = [];
        for (let i = 0; i < n; i++) this.player.push(new Player);
        this.turn = 0;
        this.dice = [0, 0];
        this.chance = 1;
        this.history = { variation: [] };
    }

    /**
     * @public
     * @mutable
     * @returns the current turn-player.
     */
    get currentPlayer() {
        return this.player[this.turn];
    }

    /**
     * @public
     * @param {(1|2|3|4|5|6)} n1 first dots of dice.
     * @param {(0|1|2|3|4|5|6)} n2 second dots of dice.
     * @summary cast dices.
     */
    cast(n1, n2) {
        this.history.variation.push({ func: "cast", args: [n1, n2] });
        this.dice = [n1, n2];
        --this.chance;
    }

    /**
     * @public
     * @mutable
     * @param {boolean} again whether to revoke dice rolls or not.
     * @summary use the effect of radio tower or not.
     */
    retry(again) {
        this.history.variation.push({ func: "retry", args: [again] });
        if (again) this.dice = [0, 0];
        else this.chance = 0;
    }

    /**
     * @public
     * @mutable
     * @param {{tv_target:[number],bc_target:[number],give:[Facility],take:[Facility]}} large_facility_args args to pass to authority.
     * @summary process transactions by the dots of dice.
     */
    transact(large_facility_args) {
        this.history.variation.push({ func: "transact", args: [large_facility_args] });
        const n = this.dice[0] + this.dice[1];
        const { tv_target, bc_target, give, take } = large_facility_args;
        this.defray(n);
        if (n === 6) this.authority(tv_target, bc_target, give, take);
        this.bless(n);
    }

    /**
     * @protected
     * @mutable
     * @param {DotSum} n dots of dice.
     * @summary process imposition by red cards.
     */
    defray(n) {
        for (let i = 1; i < this.player.length; i++) {
            const p = (this.turn + i) % this.player.length;
            const charge = Math.min(this.player[p].imposition(n), this.currentPlayer.coin);
            this.currentPlayer.coin -= charge;
            this.player[p].coin += charge;
        }
    }

    /**
     * @protected
     * @mutable
     * @throws {RangeError} when the exchange is not executable.
     * @param {?number} tv_target the person from whom receive TV charge.
     * @param {?number} bc_target the person with whom exchange facilities by the effect of BC.
     * @param {?Facility} give the facility to give by the effect of BC.
     * @param {?Facility} take the facility to take by the effect of BC.
     */
    authority(tv_target, bc_target, give, take) {
        if (this.currentPlayer.facilities["スタジアム"] > 0) {
            for (let p = 0; p < this.player.length; p++) {
                if (p == this.turn) continue;
                const charge = Math.min(2, this.player[p].coin);
                this.player[p].coin -= charge;
                this.currentPlayer.coin += charge;
            }
        }
        if (this.currentPlayer.facilities["テレビ局"] > 0 && tv_target != null) {
            const charge = Math.min(5, this.player[tv_target].coin);
            this.player[tv_target].coin -= charge;
            this.currentPlayer.coin += charge;
        }
        if (this.currentPlayer.facilities["ビジネスセンター"] > 0 && bc_target != null) {
            if (this.currentPlayer.facilities[give] === 0 || this.player[bc_target].facilities[take] === 0)
                throw RangeError("Facilities to exchange does not exist.");
            --this.currentPlayer.facilities[give];
            --this.player[bc_target].facilities[take];
            ++this.currentPlayer.facilities[take];
            ++this.player[bc_target].facilities[give];
        }
    }

    /**
     * @protected
     * @mutable
     * @param {DotSum} n dots of dice.
     * @summary process gain by blue or green cards.
     */
    bless(n) {
        for (let p = 0; p < this.player.length; p++) {
            const income = this.player[p].gain(n, p === this.turn);
            this.player[p].coin += income;
        }
    }

    /**
     * @public
     * @throws {RangeError} when the turn player cannot buy the card.
     * @param {?Landmark|Facility}
     * @summary buy some card or pass.
     */
    buy(card) {
        const once_more = this.currentPlayer.landmarks["遊園地"] > 0 && this.dice[0] === this.dice[1];
        if (card != null) this.currentPlayer.purchase(card);
        if (!(once_more || this.currentPlayer.complete())) this.turn = (this.turn + 1) % this.player.length;
        this.dice = [0, 0];
        this.chance = 1 + this.currentPlayer.landmarks["電波塔"];
    }
}

module.exports = MachikoroModel;
