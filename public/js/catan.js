'use strict';

import socket from "./client.js"

const pc = parseInt(document.querySelector("input[name='pc']").value);

document.forms["initial_placement_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["initial_placement_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "buildSettlementAndRoad", args: [
                document.forms["initial_placement_navigation"].querySelector("input[name='initial_settlement']").value,
                document.forms["initial_placement_navigation"].querySelector("input[name='initial_road']").value,
            ]
        });
    }
};

document.forms["dice_navigation"].querySelector("input[value='サイコロを振る']").onclick = function (e) {
    socket.emit("input", pc, { func: "bless" });
};

document.forms["road_construction_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["road_construction_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "buildRoad", args: [
                document.forms["road_construction_navigation"].querySelector("input[name='road']").value,
            ]
        });
    }
};

document.forms["settlement_construction_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["settlement_construction_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "buildSettlement", args: [
                document.forms["settlement_construction_navigation"].querySelector("input[name='road']").value,
            ]
        });
    }
};

document.forms["city_construction_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["city_construction_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "buildCity", args: [
                document.forms["city_construction_navigation"].querySelector("input[name='city']").value,
            ]
        });
    }
};

document.forms["development_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    socket.emit("input", pc, { func: "develop" });
};

document.forms["trade_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["trade_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "trade", args: [
                document.forms["trade_navigation"].querySelector("input[name='export']").value,
                document.forms["trade_navigation"].querySelector("input[name='import']").value,
            ]
        });
    }
};

document.forms["deprivation_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["deprivation_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "rob", args: [
                document.forms["deprivation_navigation"].querySelector("input[name='robber']").value,
                document.forms["deprivation_navigation"].querySelector("input[name='target']").value,
            ]
        });
        /** @todo consider the case when knight was executed. */
    }
};

document.forms["roadbuilding_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["roadbuilding_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "executeChanceCard", args: [
                document.forms["roadbuilding_navigation"].querySelector("input[name='chance_index']").value,
                document.forms["roadbuilding_navigation"].querySelector("input[name='road1']").value,
                document.forms["roadbuilding_navigation"].querySelector("input[name='road2']").value,
            ]
        });
    }
};

document.forms["discovery_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["discovery_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "executeChanceCard", args: [
                document.forms["discovery_navigation"].querySelector("input[name='chance_index']").value,
                document.forms["discovery_navigation"].querySelector("input[name='discovery1']").value,
                document.forms["discovery_navigation"].querySelector("input[name='discovery2']").value,
            ]
        });
    }
};

document.forms["discovery_navigation"].querySelector("input[value='OK']").onclick = function (e) {
    if (document.forms["discovery_navigation"].reportValidity()) {
        socket.emit("input", pc, {
            func: "executeChanceCard", args: [
                document.forms["discovery_navigation"].querySelector("input[name='chance_index']").value,
                document.forms["discovery_navigation"].querySelector("input[name='monopoly']").value,
            ]
        });
    }
};
