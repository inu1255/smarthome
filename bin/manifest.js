const fs = require("fs");
const path = require("path");

let text = fs.readFileSync(path.join(__dirname, "../src/manifest.json"), "utf8");
/** @type {import('../src/manifest.json')} */
const manifest = eval("(" + text + ")");

module.exports = manifest;
