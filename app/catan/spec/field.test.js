'use strict';

const Field = require("../field.js");

describe("initialization", () => {
    const field = new Field;
    const { valid_face, valid_vertex, valid_edge } = field;
    describe("land", () => {
        test("constants", () => {
            expect(field.fsize).toBe(7);
            expect(field.vsize).toBe(14);
            expect(valid_face).toHaveLength(19);
            expect(valid_vertex).toHaveLength(54);
            expect(valid_edge).toHaveLength(72);
        });
        test("properties", () => {
            for (const f of valid_face) {
                expect(field.face[f].resource).toMatch(/木|泥|羊|麦|鉄|荒/);
                expect(field.face[f].dice).toBeGreaterThanOrEqual(1);
                expect(field.face[f].dice).toBeLessThanOrEqual(12);
            }
            for (const v of valid_vertex) expect(field.vertex[v]).toBeNull();
            for (const e of valid_edge) expect(field.edge[e]).toBeNull();
        });
        test("breakdown", () => {
            const resources = { "木": 4, "泥": 3, "羊": 4, "麦": 4, "鉄": 3, "荒": 1 };
            const dice = [0, 1, 1, 2, 2, 2, 2, 0, 2, 2, 2, 2, 1];
            for (const f of field.valid_face) {
                --resources[field.face[f].resource];
                --dice[field.face[f].dice];
            }
            expect(Object.values(resources).every(x => x === 0)).toBeTruthy();
            expect(dice.every(x => x === 0)).toBeTruthy();
        });
        describe("resource condition", () => {
            test("the same resource should not appear at a vertex", () => {
                for (const v of valid_vertex) {
                    const vic = Field.vicnity(v).map(f => field.face[f].resource);
                    expect(vic.length == 3 && vic.every(r => r === vic[0])).toBeFalsy();
                }
            });
            test("the same resource should not appear in succession on the perimeter of the field", () => {
                const shore = [38, 37, 36, 29, 22, 16, 10, 11, 12, 19, 26, 32];
                for (let i = 0; i < shore.length; i++) {
                    const r = field.face[shore[i]].resource;
                    expect(field.face[shore[(i - 1 + shore.length) % shore.length]].resource === r
                        && field.face[shore[(i + 1) % shore.length]].resource === r).toBeFalsy();
                }
            });
        });
        describe("dice condition", () => {
            const neighbor = [-1, -field.fsize, -field.fsize + 1, 1, field.fsize, field.fsize - 1];
            test("the same pip should not adjoin", () => {
                for (const f of valid_face) {
                    const n = field.face[f].dice;
                    expect(neighbor.some(d =>
                        valid_face.includes(f + d)
                        && (field.face[f + d].dice === n
                            || Math.abs(n - 7) === 1 && Math.abs(field.face[f + d].dice - 7) === 1)
                    )).toBeFalsy();
                }
            });
            test("the productive power of a vertex should not exceed some extent", () => {
                for (const v of valid_vertex) {
                    const vic = Field.vicnity(v).map(f => field.face[f].dice);
                    expect(vic.reduce((s, n) => s + (6 - Math.abs(n - 7)), 0)).toBeLessThan(13);
                }
            });
        });
    });
    describe("sea", () => {
        test("breakdown", () => {
            const wharfs = { "木": 2, "泥": 2, "羊": 2, "麦": 2, "鉄": 2, "３": 8 };
            expect(field.coast).toHaveLength(6);
            expect(field.coast).toEqual(expect.arrayContaining(Object.keys(wharfs)));
            for (const r in wharfs) expect(field.wharf[r]).toHaveLength(wharfs[r]);
            expect(Object.values(field.wharf).flat().every(v => valid_vertex.includes(v))).toBeTruthy();
        });
        test("wharf computation", () => {
            expect(Field.computeWharf(["木", "泥", "羊", "麦", "鉄", "３"])).toEqual({
                "木": [23, 24],
                "泥": [41, 54],
                "羊": [79, 80],
                "麦": [89, 88],
                "鉄": [73, 72],
                "３": [27, 26, 55, 68, 91, 92, 33, 46]
            });
            expect(Field.computeWharf(["羊", "３", "木", "鉄", "泥", "麦"])).toEqual({
                "木": [67, 80],
                "泥": [59, 72],
                "羊": [25, 24],
                "麦": [33, 34],
                "鉄": [89, 90],
                "３": [21, 22, 41, 40, 87, 86, 45, 58]
            });
        });
    });
});

describe("field query", () => {
    const field = new Field;
    field.vertex[50] = { owner: 0, type: "開拓地" }, field.vertex[66] = { owner: 1, type: "都市" };
    field.edge[52] = field.edge[56]
        = field.edge[73] = field.edge[75] = field.edge[76] = field.edge[77]
        = field.edge[93] = field.edge[94] = field.edge[96] = field.edge[97] = field.edge[99] = 0;
    describe("distance computation", () => {
        it("throws exception when the designated edge is possessed by someone", () => {
            expect(() => field.measure(0, 52)).toThrow();
        });
        test("sane inputs", () => {
            expect(field.measure(0, 54)).toBe(7);
            expect(field.measure(0, 74)).toBe(8);
            expect(field.measure(1, 78)).toBe(1);
        });
    });
    test("predicate", () => {
        expect(field.admissible(0, 74)).toBeTruthy();
        expect(field.admissible(0, 75)).toBeFalsy();
        expect(field.admissible(0, 80)).toBeFalsy();
        expect(field.admissible(1, 80)).toBeTruthy();
        expect(field.stable(50)).toBeFalsy();
        expect(field.stable(51)).toBeFalsy();
        expect(field.stable(64)).toBeTruthy();
        expect(field.connected(0, 53)).toBeFalsy();
        expect(field.connected(0, 64)).toBeTruthy();
        expect(field.connected(1, 64)).toBeFalsy();
        expect(field.urbanizable(0, 64)).toBeFalsy();
        expect(field.urbanizable(0, 50)).toBeTruthy();
        expect(field.urbanizable(1, 66)).toBeFalsy();
    });
});

describe("index calculation", () => {
    it("throws exception when indexes are out of bounds", () => {
        expect(() => Field.periphery(9)).toThrow();
        expect(() => Field.periphery(13)).toThrow();
        expect(() => Field.periphery(15)).toThrow();
        expect(() => Field.periphery(20)).toThrow();
        expect(() => Field.periphery(21)).toThrow();
        expect(() => Field.periphery(27)).toThrow();
        expect(() => Field.periphery(28)).toThrow();
        expect(() => Field.periphery(33)).toThrow();
        expect(() => Field.periphery(35)).toThrow();
        expect(() => Field.periphery(39)).toThrow();
        expect(() => Field.vicnity(20)).toThrow();
        expect(() => Field.vicnity(28)).toThrow();
        expect(() => Field.vicnity(32)).toThrow();
        expect(() => Field.vicnity(42)).toThrow();
        expect(() => Field.adjacent(44)).toThrow();
        expect(() => Field.adjacent(56)).toThrow();
        expect(() => Field.adjacent(57)).toThrow();
        expect(() => Field.adjacent(69)).toThrow();
        expect(() => Field.incident(71)).toThrow();
        expect(() => Field.incident(81)).toThrow();
        expect(() => Field.incident(85)).toThrow();
        expect(() => Field.incident(93)).toThrow();
        expect(() => Field.endpoints(30)).toThrow();
        expect(() => Field.endpoints(42)).toThrow();
        expect(() => Field.endpoints(48)).toThrow();
        expect(() => Field.endpoints(63)).toThrow();
        expect(() => Field.endpoints(66)).toThrow();
        expect(() => Field.endpoints(84)).toThrow();
        expect(() => Field.endpoints(86)).toThrow();
        expect(() => Field.endpoints(102)).toThrow();
        expect(() => Field.endpoints(107)).toThrow();
        expect(() => Field.endpoints(120)).toThrow();
        expect(() => Field.endpoints(128)).toThrow();
        expect(() => Field.endpoints(137)).toThrow();
    });
    test("within the range", () => {
        expect(Field.periphery(24)).toEqual([49, 50, 51, 62, 63, 64]);
        expect(Field.vicnity(21)).toEqual([10]);
        expect(Field.vicnity(23)).toEqual([10, 11]);
        expect(Field.vicnity(36)).toEqual([10, 11, 17]);
        expect(Field.adjacent(21)).toEqual([22, 34]);
        expect(Field.adjacent(36)).toEqual([35, 37, 23]);
        expect(Field.incident(21)).toEqual([31, 32]);
        expect(Field.incident(36)).toEqual([52, 54, 35]);
        expect(Field.endpoints(31)).toEqual([21, 22]);
        expect(Field.endpoints(32)).toEqual([21, 34]);
        expect(Field.endpoints(33)).toEqual([23, 22]);
    });
});
