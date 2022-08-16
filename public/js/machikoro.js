'use strict';

import socket from "./client.js"

const pc = parseInt(document.querySelector("input[name='pc']").value);

if (document.forms["dice_roll"]?.elements["proceed"]) {
    document.forms["dice_roll"].elements["proceed"].onclick = function (e) {
        socket.emit("input", pc, { revoke: false });
    };
}

if (document.forms["dice_roll"]?.elements["revoke"]) {
    document.forms["dice_roll"].elements["revoke"].onclick = function (e) {
        socket.emit("input", pc, { revoke: true });
    };
}

if (document.forms["action"]?.elements["roll_one_dice"]) {
    document.forms["action"].elements["roll_one_dice"].onclick = function (e) {
        socket.emit("input", pc, { rolls: 1 });
    };
}

if (document.forms["action"]?.elements["roll_two_dice"]) {
    document.forms["action"].elements["roll_two_dice"].onclick = function (e) {
        socket.emit("input", pc, { rolls: 2 });
    };
}

if (document.forms["action"]?.elements["large_facility"]) {
    document.forms["action"].elements["large_facility"].onclick = function (e) {
        if (this.closest("form").reportValidity()) {
            socket.emit("input", pc, {
                tv_target: document.forms["action"].elements["tv_target"]?.value,
                bc_target: document.forms["action"].elements["bc_target"]?.value,
                give: document.forms["action"].elements["give"]?.value,
                take: document.forms["action"].elements["take"]?.value,
            });
        }
    };

    if (document.forms["action"].elements["bc_target"]) {
        window.onload = updateTakingFacilityList;
        document.forms["action"].elements["bc_target"].onclick = updateTakingFacilityList;
    }
}

if (document.forms["action"]?.elements["purchase"]) {
    document.forms["action"].elements["purchase"].onclick = function (e) {
        if (this.closest("form").reportValidity()) {
            socket.emit("input", pc, { card: document.forms["action"].elements["card"].value });
        }
    };
}

if (document.forms["action"]?.elements["pass"]) {
    document.forms["action"].elements["pass"].onclick = function (e) {
        socket.emit("input", pc, { card: null });
    };
}

if (document.forms["finish"]) {
    document.forms["finish"].querySelector("input[value='OK']").onclick = function (e) {
        socket.emit("input", pc, { action: "finish" });
        location.reload();
    };
}

function updateTakingFacilityList(e) {
    const bc_target_select = document.forms["action"].elements["bc_target"];
    const bc_target_name = bc_target_select.options[bc_target_select.selectedIndex].textContent;
    const bc_target_area = Array.from(document.querySelectorAll(".player_area")).find(x => x.querySelector(".name").textContent === bc_target_name);
    const bc_target_facilities = Array.from(bc_target_area.querySelectorAll(".facilities span"), x => x.textContent.split(":")[0]);
    document.forms["action"].elements["take"].replaceChildren();
    for (const bc_target_facilitiy of bc_target_facilities) {
        const bc_take_option = document.createElement("option");
        bc_take_option.append(bc_target_facilitiy);
        document.forms["action"].elements["take"].append(bc_take_option);
    }
}
