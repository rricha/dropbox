const nssocket = require('nssocket');
const path = require('path');
const mkdir = require('../mkdir');
const touch = require('../touch');
const rm = require('../rm');

const argv = require('yargs').argv;

const rootDir = argv.dir || path.resolve(process.cwd());

const outbound = new nssocket.NsSocket({
  reconnect: true,
  type: 'tcp4',
});

outbound.data('event', (data) => {
  console.log(data);
  switch (data.action) {
    case 'addDir':
      mkdir(path.resolve(path.join(rootDir, data.path)));
      break;
    case 'add':
      touch(path.resolve(path.join(rootDir, data.path)));
      break;
    case 'unlink':
    case 'unlinkDir':
      rm(path.resolve(path.join(rootDir, data.path)));
      break;
    default:
      break;
  }
});

outbound.connect(8001);
