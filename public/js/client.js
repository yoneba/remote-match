'use strict';

const socket = io("/main/");

socket.on("connect", function () {
    console.info("connected");
});

socket.on("connect_error", function (error) {
    console.error(error);
});

socket.on("update", function () {
    location.reload();
});

socket.on("disconnect", function (reason) {
    console.info(reason);
    if (reason === "io server disconnect")
        location.pathname = location.pathname.replace(/\/?$/, "/entry");
});

/**
 * @param {Socket} socket socket.io client socket.
 * @param {string} func the function to call.
 * @param {...any} args arguments.
 * @fires Socket#query
 * @returns {Promise<any>} a promise to return the value computed on the server.
 * @listens Socket#answer
 */
export function inquire(socket, func, ...args) {
    return new Promise((resolve, reject) => {
        socket.emit("query", func, ...args);
        socket.once("answer", data => resolve(data));
        setTimeout(reject, 5000, "cannot connect to the server.");
    });
}

export default socket;
