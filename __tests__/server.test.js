'use strict';

const request = require("supertest");
const app = require("../server.js");

test("GET /catan/arrangement", done => {
    request(app)
        .get(`/catan/arrangement`)
        .expect(200)
        .end(done);
});

test("GET /:service/entry", done => {
    for (const service of ["napoleon", "catan", "dancing_criminal"]) {
        request(app)
            .get(`/${service}/entry`)
            .expect(200)
            .end(done);
    }
});
