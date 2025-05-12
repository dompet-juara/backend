'use strict';

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const AuthRoutes = require('./routes/auth');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register(AuthRoutes);

  await server.start();
  console.log('✅ Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
