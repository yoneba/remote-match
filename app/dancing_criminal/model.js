'use strict';

const Random = require("../random.js");

/**
 * @public
 * @member {{hand:string[],used:string[]}[]} player participating players.
 */
class DancingCriminalModel {
    /**
     * @public
     * @constructor
     * @param {number} n the number of players.
     * @param {string[][]} selected_cards the cards to be used in the game.
     */
    constructor(n = 4, selected_cards = null) {
        this.player = Array.from(selected_cards ?? this.constructor.selectedCards(n), hand => {
            return { hand, used: [] };
        });
    }

    /**
     * @public
     * @mutable
     * @param {number} p the index of the player.
     * @param {number} j the index of the card to play.
     * @param {number} target the index of the target player of the card.
     */
    play(p, j, target) {
        const card = this.player[p].hand[j];
    }

    /**
     * 
     * @param {number} n the number of players.
     * @returns {string[][]} the initial cards of each player.
     */
    static selectedCards(n) {
        let card_list = ["第一発見者", "犯人", "探偵", "アリバイ", "たくらみ", "アリバイ", "探偵", "たくらみ",
            "アリバイ", "目撃者", "目撃者", "目撃者", "一般人", "一般人", "アリバイ", "アリバイ",
            "取り引き", "取り引き", "取り引き", "取り引き", "取り引き", "情報操作", "情報操作", "情報操作",
            "うわさ", "うわさ", "うわさ", "うわさ", "探偵", "探偵", "少年", "いぬ"];
        const fixed = [0, 0, 0, 4, 5, 6, 8, 9];
        for (let i = 32; i > n * 4; i--)card_list.splice(fixed[n] + Random.rand(i - fixed[n]), 1);
        Random.shuffle(card_list);
        let selected_cards = [];
        for (let i = 0; i < n; i++)selected_cards.push(card_list.slice(4 * i, 4 * i + 4));
        return selected_cards;
    }
}

module.exports = DancingCriminalModel;
