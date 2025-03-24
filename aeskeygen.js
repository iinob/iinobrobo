const crypto = require('crypto');

const key = crypto.randomBytes(16);

const IV = crypto.randomBytes(8);

console.log(`key: ${key.toString('hex')}\nIV: ${IV.toString('hex')}`);
