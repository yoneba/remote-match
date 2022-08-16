'use strict';

const NapoleonModel = require("../model.js");

test("constructor", () => {
    for (let n = 3; n <= 7; n++) {
        const game = new NapoleonModel(n);
        const hand_length = Math.floor(50 / n);
        expect(game.kitty.length).toBe(55 - hand_length * n);
        expect(game.player.length).toBe(n);
        expect(game.turn).toBe(0);
        expect(game.rotation).toBe(1);
        expect(game.constraint).toEqual([]);
        expect(game.contract).toBe(19 - n);
        for (const pl of game.player) {
            expect(pl.hand.length).toBe(hand_length);
            for (let i = 1; i < pl.hand.length; i++)
                expect(NapoleonModel.ord(pl.hand[i - 1]) < NapoleonModel.ord(pl.hand[i])).toBeTruthy();
            expect(pl.obtained).toEqual([]);
        }
        expect(game.kitty.concat(...game.player.map(x => x.hand)).sort((a, b) => {
            return NapoleonModel.ord(a) - NapoleonModel.ord(b);
        })).toEqual(NapoleonModel.cardList());
    }
});

describe("progress", () => {
    const seeder = [
        0, 3, 1, 1, 4, 4, 3, 3, 0, 3, 0, 0, 3,
        1, 4, 0, 4, 4, 4, 2, 2, 2, 0, 0, 1, 2,
        5, 2, 3, 3, 4, 5, 2, 0, 4, 1, 1, 2, 4,
        0, 5, 5, 1, 3, 0, 3, 1, 3, 5, 4, 2, 1,
        1, 2, 2,
    ];
    const game = new NapoleonModel(5, seeder);
    describe("seeding", () => {
        expect(game.kitty).toEqual([
            "ダイヤの2",
            "ダイヤの7",
            "クラブの3",
            "クラブの4",
            "クラブのJ"
        ]);
        expect(game.player[0].hand).toEqual([
            "スペードの2",
            "スペードの10",
            "スペードのQ",
            "スペードのK",
            "ハートの4",
            "ハートのJ",
            "ハートのQ",
            "ダイヤの9",
            "クラブの2",
            "クラブの7"
        ]);
        expect(game.player[1].hand).toEqual([
            "スペードの4",
            "スペードの5",
            "ハートの2",
            "ハートのK",
            "ダイヤのJ",
            "ダイヤのQ",
            "クラブの5",
            "クラブの9",
            "クラブのA",
            "黒ジョーカー"
        ]);
        expect(game.player[2].hand).toEqual([
            "ハートの8",
            "ハートの9",
            "ハートの10",
            "ハートのA",
            "ダイヤの3",
            "ダイヤの8",
            "ダイヤのK",
            "クラブのK",
            "赤ジョーカー",
            "エクストラジョーカー"
        ]);
        expect(game.player[3].hand).toEqual([
            "スペードの3",
            "スペードの8",
            "スペードの9",
            "スペードのJ",
            "スペードのA",
            "ダイヤの4",
            "ダイヤの5",
            "クラブの6",
            "クラブの8",
            "クラブの10"
        ]);
        expect(game.player[4].hand).toEqual([
            "スペードの6",
            "スペードの7",
            "ハートの3",
            "ハートの5",
            "ハートの6",
            "ハートの7",
            "ダイヤの6",
            "ダイヤの10",
            "ダイヤのA",
            "クラブのQ"
        ]);
    });
    describe("auction", () => {
        game.bet(0, 0);
        expect(game.player[0].bid).toBe(0);
        expect(game.turn).toBe(1);
        game.bet(1, 0);
        expect(game.player[1].bid).toBe(0);
        expect(game.contract).toBe(14);
        game.bet(2, 15);
        expect(game.player[2].bid).toBe(15);
        expect(game.contract).toBe(15);
        game.bet(3, 0);
        expect(game.player[3].bid).toBe(0);
        game.bet(4, 0);
        expect(game.player[4].bid).toBe(0);
        expect(game.turn).toBe(0);
        expect(game.contract).toBe(15);
        game.elect();
        expect(game.napoleon).toBe(2);
        expect(game.turn).toBe(2);
    });
    describe("designate", () => {
        game.designate("ハート", "マイティ");
        expect(game.trump).toBe("ハート");
        expect(game.medal).toEqual("マイティ");
        const added = game.draw();
        expect(game.adjutant).toBe(3);
        expect(game.player[game.napoleon].hand).toEqual([
            "ハートの8",
            "ハートの9",
            "ハートの10",
            "ハートのA",
            "ダイヤの2",
            "ダイヤの3",
            "ダイヤの7",
            "ダイヤの8",
            "ダイヤのK",
            "クラブの3",
            "クラブの4",
            "クラブのJ",
            "クラブのK",
            "赤ジョーカー",
            "エクストラジョーカー"
        ]);
        expect(added).toEqual([4, 6, 9, 10, 11]);
    });
    describe("discard", () => {
        game.discard([5, 8, 10, 11, 12]);
        expect(game.kitty).toEqual([
            "ダイヤの3",
            "クラブの4",
            "ダイヤのK",
            "クラブのJ",
            "クラブのK",
        ]);
        expect(game.player[game.napoleon].hand).toEqual([
            "ハートの8",
            "ハートの9",
            "ハートの10",
            "ハートのA",
            "ダイヤの2",
            "ダイヤの7",
            "ダイヤの8",
            "クラブの3",
            "赤ジョーカー",
            "エクストラジョーカー"
        ]);
    });
    describe("availableCards (lead)", () => {
        expect(game.availableCards()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    describe("play (leading joker)", () => {
        game.play(2, 9, "ハート");
        expect(game.layout).toEqual([
            null,
            null,
            "エクストラジョーカー",
            null,
            null,
        ]);
        expect(game.player[game.napoleon].hand).toEqual([
            "ハートの8",
            "ハートの9",
            "ハートの10",
            "ハートのA",
            "ダイヤの2",
            "ダイヤの7",
            "ダイヤの8",
            "クラブの3",
            "赤ジョーカー"
        ]);
        expect(game.turn).toBe(3);
        expect(game.constraint).toEqual(["ハート"]);
    });
    describe("availableCards (arbitrary)", () => {
        expect(game.availableCards(3)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    game.play(3, 3);
    describe("availableCards (must follow)", () => {
        expect(game.availableCards()).toEqual([2, 3, 4, 5]);
    });
    game.play(4, 2);
    game.play(0, 4);
    describe("availableCards (must follow + joker)", () => {
        expect(game.availableCards()).toEqual([2, 3, 9]);
    });
    describe("play (non-leading)", () => {
        game.play(1, 2);
        expect(game.layout).toEqual([
            "ハートの4",
            "ハートの2",
            "エクストラジョーカー",
            "スペードのJ",
            "ハートの3",
        ]);
        expect(game.constraint).toEqual(["ハート"]);
    });
    describe("liquidate", () => {
        game.liquidate();
        expect(game.winner).toBe("");
        expect(game.kitty).toEqual([]);
        expect(game.layout.every(x => x == null)).toBeTruthy();
        expect(game.turn).toBe(2);
        expect(game.constraint).toEqual([]);
        describe("take", () => {
            expect(game.player[game.napoleon].obtained).toEqual([
                "ダイヤのK",
                "クラブのJ",
                "クラブのK",
                "スペードのJ",
            ]);
        });
        describe("reverse", () => {
            expect(game.rotation).toBe(4);
        });
    });
    describe("club 3", () => {
        game.play(2, 7);
        expect(game.constraint).toEqual(["ジョーカー", "クラブ"]);
        expect(game.availableCards(1)).toEqual([8]);
        expect(game.turn).toBe(1);
    });
    describe("history", () => {
        expect(game.history).toEqual({
            seeder, variation: [
                { func: "bet", args: [0, 0] },
                { func: "bet", args: [1, 0] },
                { func: "bet", args: [2, 15] },
                { func: "bet", args: [3, 0] },
                { func: "bet", args: [4, 0] },
                { func: "designate", args: ["ハート", "マイティ"] },
                { func: "discard", args: [[5, 8, 10, 11, 12]] },
                { func: "play", args: [2, 9, "ハート"] },
                { func: "play", args: [3, 3, undefined] },
                { func: "play", args: [4, 2, undefined] },
                { func: "play", args: [0, 4, undefined] },
                { func: "play", args: [1, 2, undefined] },
                { func: "play", args: [2, 7, undefined] },
            ]
        });
    });
});

describe("umpire", () => {
    describe("when the trump is not spade", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 1;
        game.designate("ハート", "マイティ");
        test("stagger", () => {
            game.constraint = ["スペード"];
            game.layout = [
                "ハートのQ",
                "スペードのA",
                "赤ジョーカー",
                "エクストラジョーカー",
                "黒ジョーカー",
            ];
            expect(game.umpire()).toBe(0);
        });
        test("mighty", () => {
            game.constraint = ["クラブ"];
            game.layout = [
                "クラブのA",
                "赤ジョーカー",
                "スペードのA",
                "エクストラジョーカー",
                "黒ジョーカー",
            ];
            expect(game.umpire()).toBe(2);
        });
        test("extra joker", () => {
            game.constraint = ["ハート"];
            game.layout = [
                "ダイヤのJ",
                "エクストラジョーカー",
                "赤ジョーカー",
                "ハートのJ",
                "黒ジョーカー",
            ];
            expect(game.umpire()).toBe(1);
        });
        test("two jokers", () => {
            game.constraint = ["ダイヤ"];
            game.layout = [
                "ダイヤのJ",
                "赤ジョーカー",
                "ハートのJ",
                "ハートのA",
                "黒ジョーカー",
            ];
            expect(game.umpire()).toBe(4);
        });
        test("two jokers (reversed)", () => {
            game.rotation = game.player.length - 1;
            game.constraint = ["ハート"];
            game.layout = [
                "黒ジョーカー",
                "ダイヤのJ",
                "赤ジョーカー",
                "ハートのJ",
                "ハートのA",
            ];
            expect(game.umpire()).toBe(2);
        });
        test("one joker", () => {
            game.constraint = ["スペード"];
            game.layout = [
                "ダイヤのJ",
                "赤ジョーカー",
                "ハートのJ",
                "ハートのA",
                "スペードのQ",
            ];
            expect(game.umpire()).toBe(1);
        });
        test("holy jack", () => {
            game.constraint = ["ジョーカー", "クラブ"];
            game.layout = [
                "ダイヤのJ",
                "クラブの3",
                "ハートのJ",
                "ハートのA",
                "スペードのQ",
            ];
            expect(game.umpire()).toBe(2);
        });
        test("evil jack", () => {
            game.constraint = ["ハート"];
            game.layout = [
                "クラブのA",
                "ハートの2",
                "ハートのA",
                "ダイヤのJ",
                "スペードのJ",
            ];
            expect(game.umpire()).toBe(3);
        });
        test("trump", () => {
            game.constraint = ["ジョーカー", "クラブ"];
            game.layout = [
                "ダイヤのA",
                "クラブの3",
                "ハートの10",
                "ハートのA",
                "スペードのQ",
            ];
            expect(game.umpire()).toBe(3);
        });
        test("deuce (trump)", () => {
            game.constraint = ["ハート"];
            game.layout = [
                "ハートのQ",
                "ハートの2",
                "ハートのA",
                "ハートの10",
                "ハートの6",
            ];
            game.history.variation = [
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
            ];
            expect(game.umpire()).toBe(1);
        });
        test("deuce (plain)", () => {
            game.constraint = ["ダイヤ"];
            game.layout = [
                "ダイヤの2",
                "ダイヤのQ",
                "ダイヤの10",
                "ダイヤのA",
                "ダイヤの6",
            ];
            game.history.variation = [
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
            ];
            expect(game.umpire()).toBe(0);
        });
        test("invalidated deuce (trump)", () => {
            game.constraint = ["ハート"];
            game.layout = [
                "ハートのQ",
                "ハートの2",
                "ハートのA",
                "ハートの10",
                "ハートの6",
            ];
            game.history.variation = [
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
            ];
            expect(game.umpire()).toBe(2);
        });
        test("invalidated deuce (plain)", () => {
            game.constraint = ["ダイヤ"];
            game.layout = [
                "ダイヤの2",
                "ダイヤのQ",
                "ダイヤの10",
                "ダイヤのA",
                "ダイヤの6",
            ];
            game.history.variation = [
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
                { func: "play", args: [] },
            ];
            expect(game.umpire()).toBe(3);
        });
        test("trump", () => {
            game.constraint = ["ハート"];
            game.layout = [
                "ダイヤのQ",
                "ハートの3",
                "ハートの10",
                "ダイヤのA",
                "スペードの2",
            ];
            expect(game.umpire()).toBe(2);
        });
        test("plain suit", () => {
            game.constraint = ["ダイヤ"];
            game.layout = [
                "クラブのQ",
                "ダイヤの3",
                "スペードのJ",
                "クラブのA",
                "ダイヤの2",
            ];
            expect(game.umpire()).toBe(1);
        });
    });
    describe("when the trump is spade", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 4;
        game.designate("スペード", "マイティ");
        test("stagger", () => {
            game.constraint = ["ハート"];
            game.layout = [
                "クラブのA",
                "赤ジョーカー",
                "エクストラジョーカー",
                "ハートのQ",
                "黒ジョーカー",
            ];
            expect(game.umpire()).toBe(3);
        });
        test("mighty", () => {
            game.constraint = ["スペード"];
            game.layout = [
                "クラブのA",
                "赤ジョーカー",
                "エクストラジョーカー",
                "スペードのA",
                "黒ジョーカー",
            ];
            expect(game.umpire()).toBe(0);
        });
    });
});

describe("winner", () => {
    test("normal", () => {
        const game = new NapoleonModel;
        game.contract = 14;
        game.turn = game.napoleon = 0;
        game.designate("ダイヤ", "マイティ");
        game.adjutant = 4;
        game.player = [
            {
                hand: [], obtained: [
                    "ハートのJ",
                    "ハートの10",
                    "ダイヤのJ",
                    "ダイヤのA",
                    "スペードのJ",
                    "クラブの10",
                    "ダイヤの10",
                    "ハートのA",
                    "ダイヤのQ",
                ]
            },
            {
                hand: [], obtained: [
                    "スペードの10",
                    "スペードのQ",
                    "ダイヤのK",
                    "ハートのK",
                ]
            },
            { hand: [], obtained: [] },
            {
                hand: [], obtained: [
                    "クラブのK",
                    "クラブのA",
                ]
            },
            {
                hand: [], obtained: [
                    "スペードのA",
                    "クラブのJ",
                    "スペードのK",
                    "クラブのQ",
                    "ハートのQ",
                ]
            },
        ];
        expect(game.winner).toBe("ナポレオン軍");
        game.contract = 15;
        expect(game.winner).toBe("連合軍");
    });
    test("perfect", () => {
        const game = new NapoleonModel;
        game.contract = 20;
        game.turn = game.napoleon = 3;
        game.designate("スペード", "マイティ");
        game.adjutant = 3;
        game.player = [
            { hand: [], obtained: [] },
            { hand: [], obtained: [] },
            { hand: [], obtained: [] },
            {
                hand: [], obtained: [
                    "ハートのJ",
                    "ハートの10",
                    "ダイヤのJ",
                    "ダイヤのA",
                    "スペードのJ",
                    "クラブの10",
                    "ダイヤの10",
                    "ハートのA",
                    "ダイヤのQ",
                    "スペードの10",
                    "スペードのQ",
                    "ダイヤのK",
                    "ハートのK",
                    "クラブのK",
                    "クラブのA",
                    "スペードのA",
                    "クラブのJ",
                    "スペードのK",
                    "クラブのQ",
                    "ハートのQ",
                ]
            },
            { hand: [], obtained: [] },
        ];
        expect(game.winner).toBe("ナポレオン軍");
        game.contract = 19;
        expect(game.winner).toBe("連合軍");
    });
});

describe("translate", () => {
    test("mighty (the ace of spades)", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 0;
        game.designate("クラブ", "スペードのA");
        expect(game.medal).toBe("マイティ");
        expect(game.translate("マイティ")).toBe("スペードのA");
    });
    test("mighty (the ace of clubs)", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 0;
        game.designate("スペード", "クラブのA");
        expect(game.medal).toBe("マイティ");
        expect(game.translate("マイティ")).toBe("クラブのA");
    });
    test("extra joker", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 0;
        game.designate("スペード", "エクストラジョーカー");
        expect(game.medal).toBe("エクストラジョーカー");
        expect(game.translate("エクストラジョーカー")).toBe("エクストラジョーカー");
    });
    test("holy jack", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 0;
        game.designate("ハート", "ハートのJ");
        expect(game.medal).toBe("正ジャック");
        expect(game.translate("正ジャック")).toBe("ハートのJ");
    });
    test("evil jack", () => {
        const game = new NapoleonModel;
        game.turn = game.napoleon = 0;
        game.designate("ダイヤ", "ハートのJ");
        expect(game.medal).toBe("裏ジャック");
        expect(game.translate("裏ジャック")).toBe("ハートのJ");
    });
});

test("card list", () => {
    const card_list = NapoleonModel.cardList();
    expect(card_list).toHaveLength(55);
    for (let i = 0; i < card_list.length; i++)expect(NapoleonModel.ord(card_list[i])).toBe(i);
});

test("inverse", () => {
    expect(NapoleonModel.inverse("スペード")).toBe("クラブ");
    expect(NapoleonModel.inverse("ハート")).toBe("ダイヤ");
    expect(NapoleonModel.inverse("ダイヤ")).toBe("ハート");
    expect(NapoleonModel.inverse("クラブ")).toBe("スペード");
});

test("card order", () => {
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 13; j++)
            expect(NapoleonModel.ord(["スペード", "ハート", "ダイヤ", "クラブ"][i] + "の"
                + ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][j])).toBe(13 * i + j);
    for (let j = 0; j < 3; j++)
        expect(NapoleonModel.ord(["黒", "赤", "エクストラ"][j] + "ジョーカー")).toBe(52 + j);
});
