#!/usr/bin/env babel-node

require('./helper');
const fs = require('fs').promise;
const rimraf = require('rimraf');

module.exports = function rm(filePath) {
  return rimraf(filePath, err => {
    if (err) throw err;
  })
  // return await fs.unlink(filePath);
}
