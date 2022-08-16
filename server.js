'use strict';

const Random = require("./app/random.js");
const Field = require("./app/catan/field.js");

const DomainService = {
    "napoleon": require("./app/napoleon/service.js"),
    "catan": require("./app/catan/service.js"),
    "machikoro": require("./app/machikoro/service.js"),
    "dancing_criminal": null
};

const apartment = new Array(10000).fill(null);
apartment.createRoom = function (service) {
    const vacants = this.map((x, i) => i >= 1000 && x == null ? i : -1).filter(i => i >= 0);
    if (vacants.length === 0) return -1;
    const room_id = Random.extract(vacants);
    this[room_id] = {
        domain_service: new DomainService[service](`Room ${room_id}`, io.of(`/main/`).in(room_id)),
        cleaner: setTimeout(() => apartment[room_id] = null, 1000 * 60 * 60 * 12)
    };
    console.log(`[Room ${room_id}] created for ${service}.`);
    return room_id;
};
apartment.launch = function (room_id) {
    const room = this[room_id];
    if (room.domain_service.game == null) {
        Random.shuffle(room.domain_service.participant);
        room.domain_service.main();
        clearTimeout(room.cleaner);
        room.cleaner = setTimeout(() => apartment[room_id] = null, 1000 * 60 * 60 * 12);
    }
};

const express = require("express");
const express_session = require("express-session");
const MemoryStore = require("memorystore")(express_session);
const session = express_session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 12
    },
    store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60 * 12
    })
});
const compression = require("compression")();

const app = express();
const io = require("socket.io").listen(app.listen(process.env.PORT || 3000));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(session);
app.use(compression);
io.use(function (socket, next) {
    session(socket.request, socket.request.res, next);
});

app.get("/catan/arrangement", function (req, res) {
    return res.render("catan/arrangement.ejs", { field: new Field });
});

app.get("/:service(napoleon|catan|machikoro|dancing_criminal)/entry", function (req, res) {
    if (!(req.params.service in DomainService)) return res.sendStatus(404);
    return res.render("entry.ejs");
});

app.post("/:service(napoleon|catan|machikoro|dancing_criminal)/entry", function (req, res) {
    if (!(req.params.service in DomainService)) return res.sendStatus(404);
    let { room_id, user_name } = req.body;
    if (!user_name) return res.sendStatus(400);
    if (room_id == null) {
        room_id = apartment.createRoom(req.params.service);
        if (room_id === -1) return res.sendStatus(503);
    }
    Object.assign(req.session, { room_id, user_name });
    return res.redirect(`/${req.params.service}/`);
});

app.get("/:service(napoleon|catan|machikoro|dancing_criminal)/", function (req, res) {
    const { service } = req.params;
    if (!(service in DomainService)) return res.sendStatus(404);
    const { room_id, user_name } = req.session;
    const room = apartment[room_id];
    if (!user_name || room == null || !(room.domain_service instanceof DomainService[service]))
        return res.redirect(`/${service}/entry`);
    if (room.domain_service.game == null) return res.render("standby.ejs", {
        room_id,
        minimum: DomainService[service].minimum,
        maximum: DomainService[service].maximum,
    });
    if (!room.domain_service.participant.includes(user_name)) return res.sendStatus(403);
    return res.render(`${service}.ejs`, {
        participant: room.domain_service.participant,
        myself: room.domain_service.participant.indexOf(user_name),
        game: room.domain_service.game,
        supplement: room.domain_service.supplement,
    });
});

function validateSocket(socket, next) {
    const { room_id, user_name } = socket.request.session;
    const room = apartment[room_id];
    if (!user_name || room == null) {
        socket.request.session.destroy();
        socket.disconnect();
    }
    else next();
}

io.use(validateSocket);

io.of("/standby/").on("connection", function (socket) {
    socket.use(function (packet, next) {
        validateSocket(socket, next);
    });
    {
        const { room_id, user_name } = socket.request.session;
        const room = apartment[room_id];
        socket.join(room_id, () => socket.emit("update", room.domain_service.participant));
        if (room.domain_service.addPerson(user_name)) {
            socket.nsp.in(room_id).emit("update", room.domain_service.participant);
            console.log(`[Room ${room_id}] ${user_name} has entered.`);
        }
    }
    socket.on("leave", function () {
        const { room_id, user_name } = socket.request.session;
        const room = apartment[room_id];
        if (room.domain_service.removePerson(user_name)) {
            socket.nsp.in(room_id).emit("update", room.domain_service.participant);
            console.log(`[Room ${room_id}] ${user_name} has left.`);
        }
        socket.request.session.destroy();
        socket.disconnect();
    });
    socket.on("start", function () {
        const { room_id } = socket.request.session;
        apartment.launch(room_id);
        socket.nsp.in(room_id).emit("start");
    })
});

/** @todo query interface (use of EventEmitter instead of direct function call) */
io.of("/main/").on("connection", function (socket) {
    socket.use(function (packet, next) {
        validateSocket(socket, next);
    });
    {
        const { room_id, user_name } = socket.request.session;
        socket.join(room_id);
    }
    socket.on("input", function (pc, data) {
        const { room_id, user_name } = socket.request.session;
        const room = apartment[room_id];
        room.domain_service.emit("input", pc, user_name, data);
        clearTimeout(room.cleaner);
        room.cleaner = setTimeout(() => apartment[room_id] = null, 1000 * 60 * 60 * 12);
    });
    socket.on("query", function (func, ...args) {
        const { room_id } = socket.request.session;
        const room = apartment[room_id];
        socket.emit("answer", room.domain_service.game[func](...args));
    });
});

module.exports = app;
