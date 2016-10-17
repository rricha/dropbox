#!/usr/bin/env babel-node

require('./helper');

const path = require('path');
const fs = require('fs').promise;
const Hapi = require('hapi');
const asyncHandlerPlugin = require('hapi-async-handler');
const nssocket = require('nssocket');
const chokidar = require('chokidar');

const argv = require('yargs').argv;

const rootDir = argv.dir || path.resolve(process.cwd());

console.log('argv' + argv.dir);
console.log('rootdir' + rootDir);

// const cat = require('./cat');
const rm = require('./rm');
const readFile = require('./readFile');
const mkdir = require('./mkdir');
const touch = require('./touch');

const clientSockets = [];

function getLocalFilePathFromRequest(request) {
  return path.resolve(path.join(rootDir, request.params.file));
}

function sendEvent(event, data) {
  for (let i = 0; i < clientSockets.length; i++) {
    clientSockets[i].send(event, data);
  }
}

const watcher = chokidar.watch('.', {
  ignored: /node_modules|.git|client|[\/\\]\./,
  persistent: true
});

watcher
  .on('add', cpath => {
    sendEvent('event', {
      action: 'add',
      path: cpath,
      type: 'file',
      updated: new Date()
    });
    console.log(`File ${cpath} has been added`)
  })
  .on('change', cpath => {
    sendEvent('event', {
      action: 'change',
      path: cpath,
      type: 'file',
      updated: new Date()
    });
    console.log(`File ${cpath} has been changed`)
  })
  .on('unlink', cpath => {
    sendEvent('event', {
      action: 'unlink',
      path: cpath,
      type: 'file',
      updated: new Date()
    });
    console.log(`File ${cpath} has been removed`)
  })
  .on('addDir', cpath => {
    sendEvent('event', {
      action: 'addDir',
      path: cpath,
      type: 'dir',
      updated: new Date()
    });
    console.log(`Directory ${cpath} has been added`)
  })
  .on('unlinkDir', cpath => {
    sendEvent('event', {
      action: 'unlinkDir',
      path: cpath,
      type: 'dir',
      updated: new Date()
    });
    console.log(`Directory ${cpath} has been removed`)
  })
  .on('error', error => {
    console.log(`Watcher error: ${error}`)
  })
;

async function readHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request);

  console.log(`Reading ${filePath}`);
  const stat = await fs.stat(filePath);
  if (stat.isDirectory()) {
    const files = await fs.readdir(filePath);
    reply(JSON.stringify(files));
  } else {
    const data = await readFile(filePath);
    reply(data);
//  const data = await cat(filePath);
//  reply(data);
  }
}

async function createHandler(request, reply) {
  /* eslint no-unused-expressions: 0 */
  const filePath = getLocalFilePathFromRequest(request);

  console.log(`Creating ${filePath}`);
  if (request.params.file.charAt(request.params.file.length - 1) === '/') {
    try {
      await mkdir(filePath);
      reply()
    } catch (err) {
      console.log('method not allowed' + err);
      reply().code(405)
    }
  } else {
    try {
      await touch(filePath);
      reply()
    } catch (err) {
      console.log('method not allowed' + err);
      reply().code(405)
    }
  }
}

async function updateHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request);

  console.log(`Updating ${filePath}`);
  try {
    await fs.writeFile(filePath, request.payload);
    reply()
  } catch (err) {
    console.log('method not allowed' + err);
    reply().code(405)
  }
}

async function deleteHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request);

  console.log(`Deleting ${filePath}`);
  await rm(filePath);
  reply()
}

async function main() {
  const port = process.env.port || 8000;
  const server = new Hapi.Server({
    debug: {
      request: ['errors']
    }
  });

  const tcpServer = nssocket.createServer(socket => {
    console.log('recevived new socket');
    clientSockets.push(socket);
  });
  tcpServer.listen(8001);

  server.register(asyncHandlerPlugin);
  server.connection({ port });

  server.on('request-error', (request, err) => {
    console.log(err)
  });

  server.route([
    // READ
    {
      method: 'GET',
      path: '/{file*}',
      handler: {
        async: readHandler
      }
    },
    // CREATE
    {
      method: 'PUT',
      path: '/{file*}',
      handler: {
        async: createHandler
      }
    },
    // UPDATE
    {
      method: 'POST',
      path: '/{file*}',
      config: {
        payload: {
          parse: false
        }
      },
      handler: {
        async: updateHandler
      }
    },
    // DELETE
    {
      method: 'DELETE',
      path: '/{file*}',
      handler: {
        async: deleteHandler
      }
    }
  ]);

  try {
    await server.start();
  } catch (e) {
    console.log('Error is ' + e);
  }
  console.log(`LISTENING @ http://127.0.0.1:${port}`);
}

main();
