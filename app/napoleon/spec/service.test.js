'use strict';

const EventEmitter = require("events");
const NapoleonModel = require("../model.js");
const NapoleonService = require("../service.js");

test("progress", async () => {
    const tester = new EventEmitter;
    const service = new NapoleonService("test room", tester);
    service.participant = ["player0", "player1", "player2", "player3", "player4"];
    service.interval = 1;
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game));
        service.main();
    }) instanceof NapoleonModel).toBeTruthy();
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.player[0].bid));
        service.emit("input", service.game.history.variation.length, service.participant[0], { declaration: 0 });
    })).toBe(0);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.player[1].bid));
        service.emit("input", service.game.history.variation.length, service.participant[1], { declaration: 14 });
    })).toBe(14);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.player[2].bid));
        service.emit("input", service.game.history.variation.length, service.participant[2], { declaration: 14 });
    })).toBe(14);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.player[3].bid));
        service.emit("input", service.game.history.variation.length, service.participant[3], { declaration: 0 });
    })).toBe(0);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.player[4].bid));
        service.emit("input", service.game.history.variation.length, service.participant[4], { declaration: 0 });
    })).toBe(0);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.contract));
        service.emit("input", service.game.history.variation.length, service.participant[0], { declaration: 15 });
    })).toBe(15);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.contract));
        service.emit("input", service.game.history.variation.length, service.participant[1], { declaration: 0 });
    })).toBe(15);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.contract));
        service.emit("input", service.game.history.variation.length, service.participant[2], { declaration: 16 });
    })).toBe(16);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.contract));
        service.emit("input", service.game.history.variation.length, service.participant[3], { declaration: 0 });
    })).toBe(16);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.contract));
        service.emit("input", service.game.history.variation.length, service.participant[4], { declaration: 0 });
    })).toBe(16);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.turn));
        service.emit("input", service.game.history.variation.length, service.participant[0], { declaration: 0 });
    })).toBe(1);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.turn));
        service.emit("input", service.game.history.variation.length, service.participant[1], { declaration: 0 });
    })).toBe(2);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.turn));
        service.emit("input", service.game.history.variation.length, service.participant[2], { declaration: 16 });
    })).toBe(3);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.turn));
        service.emit("input", service.game.history.variation.length, service.participant[3], { declaration: 0 });
    })).toBe(4);
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.turn));
        service.emit("input", service.game.history.variation.length, service.participant[4], { declaration: 0 });
    })).toBe(0);
    expect(await new Promise(resolve => {
        const callback = () => {
            if (service.game.napoleon != null) {
                resolve(service.game.napoleon);
                tester.off("update", callback);
            }
        };
        tester.on("update", callback);
        service.emit("input", service.game.history.variation.length, service.participant[0], { declaration: 0 });
    })).toBe(2);
    expect(await new Promise(resolve => {
        const callback = () => {
            if (service.game.adjutant != null) {
                resolve(service.game.medal);
                tester.off("update", callback);
            }
        };
        tester.on("update", callback);
        service.emit("input", service.game.history.variation.length, service.participant[2], { trump: "スペード", medal: "マイティ" });
    })).toBe("マイティ");
    expect(await new Promise(resolve => {
        tester.once("update", () => resolve(service.game.turn));
        service.emit("input", service.game.history.variation.length, service.participant[2], { trash: [0, 1, 2, 3, 4] });
    })).toBe(2);
    while (service.game.winner === "") {
        await new Promise(resolve => {
            const callback = () => {
                if (service.game.layout.includes(null)) {
                    resolve();
                    tester.off("update", callback);
                }
            };
            tester.on("update", callback);
            let action = { index: service.game.availableCards().reverse()[0] };
            if (!service.game.constraint && service.game.player[service.game.turn].hand[action.index].endsWith("ジョーカー"))
                action.request = service.game.trump;
            service.emit("input", service.game.history.variation.length, service.participant[service.game.turn], action);
        });
    }
    service.emit("input", 0, service.participant[service.game.turn], { action: "finish" });
    await new Promise(resolve => setTimeout(resolve, service.interval));
    expect("game" in service).toBeTruthy();
    service.emit("input", service.game.history.variation.length, service.participant[service.game.turn], { action: "finish" });
    await new Promise(resolve => setTimeout(resolve, service.interval));
    expect("game" in service).toBeFalsy();
});
