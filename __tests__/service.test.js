'use strict';

const EventEmitter = require("events");
const DomainService = require("../app/service.js");

test("add/remove person", () => {
    const domain_service = new DomainService("add/remove person test instance", new EventEmitter);
    expect(domain_service.addPerson("a")).toBeTruthy();
    expect(domain_service.addPerson("b")).toBeTruthy();
    expect(domain_service.addPerson("c")).toBeTruthy();
    expect(domain_service.participant).toEqual(["a", "b", "c"]);
    expect(domain_service.addPerson("c")).toBeFalsy();
    expect(domain_service.participant).toEqual(["a", "b", "c"]);
    expect(domain_service.removePerson("d")).toBeFalsy();
    expect(domain_service.participant).toEqual(["a", "b", "c"]);
    expect(domain_service.removePerson("b")).toBeTruthy();
    expect(domain_service.participant).toEqual(["a", "c"]);
});
