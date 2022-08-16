'use strict';

/**
 * @param {number} n positive integer.
 * @returns {number} a random integer from 0 to n-1.
 */
module.exports.rand = function (n) {
    return Math.floor(Math.random() * n);
};

/**
 * 
 * @mutable
 * @param {Array<*>} arr an element will be extracted randomly.
 * @returns {*} the extracted element.
 */
module.exports.extract = function (arr) {
    return arr.splice(this.rand(arr.length), 1)[0];
};

/**
 * 
 * @param {Object<string,number>} obj a probability distribution.
 * @returns {?string} a randomly extracted key according to the probability distribution.
 */
module.exports.pick = function (obj) {
    let r = this.rand(Object.values(obj).reduce((s, n) => s + n));
    for (const key in obj) if ((r -= obj[key]) < 0) return key;
    return null;
};

/**
 * 
 * @mutable
 * @param {Array<*>} arr an array.
 * @returns {Array<*>} the randomly shuffled array, which is identical to arr.
 */
module.exports.shuffle = function (arr) {
    for (let i = arr.length; i > 1; i--)arr.push(...arr.splice(this.rand(i), 1));
    return arr;
};
