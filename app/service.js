'use strict';

/** @todo consider use of participant (extensibility for intelligence routine) */

const EventEmitter = require("events");

/**
 * @public
 * @member {string} name the name of the service.
 * @member {string[]} participant names of participating players.
 * @member {EventEmitter} target the default event target to notify the current status.
 * @member {number} interval milliseconds to pause until next painting occurs.
 * @member {Object<string,Object>} supplement additional information.
 */
class DomainService extends EventEmitter {
    /**
     * @public
     * @constructor
     * @param {string} name the name of the service output to the log.
     * @param {EventEmitter} target the target EventEmitter object to send notification to.
     */
    constructor(name, target) {
        super();
        this.name = name;
        this.participant = [];
        this.target = target;
        this.interval = 1000;
        this.supplement = {};
    }

    /**
     * @public
     * @mutable
     * @param {string} user_name the name of the player to add.
     * @returns {boolean} true if addition succeeds, false otherwise.
     */
    addPerson(user_name) {
        if (this.participant.includes(user_name)) return false;
        this.participant.push(user_name);
        return true;
    }

    /**
     * @public
     * @mutable
     * @param {string} user_name the name of the player to remove.
     * @returns {boolean} true if removal succeeds, false otherwise.
     */
    removePerson(user_name) {
        const p = this.participant.indexOf(user_name);
        if (p === -1) return false;
        this.participant.splice(p, 1);
        return true;
    }

    /**
     * @protected
     * @listens EventEmitter#input
     * @returns {Promise} a promise to get data.
     */
    listen() {
        return new Promise(resolve => {
            const control = (pc, user_name, data) => {
                if (pc === this.game.history.variation.length) {
                    this.off("input", control);
                    resolve({ subject: this.participant.indexOf(user_name), data });
                }
            };
            this.on("input", control);
        });
    }

    /**
     * @protected
     * @param {EventEmitter} handler the event target to notify the current status.
     * @fires EventEmitter#update
     * @returns {Promise} a promise to wait for ${this.interval} milliseconds.
     */
    notify(handler = this.target) {
        handler.emit("update");
        return new Promise(resolve => setTimeout(resolve, this.interval));
    }
}

module.exports = DomainService;
