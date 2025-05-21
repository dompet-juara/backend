'use strict';

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const supabase = require('./supabase');

const AuthRoutes = require('./routes/auth');
const IncomeRoutes = require('./routes/income');
const OutcomeRoutes = require('./routes/outcome');
const DashboardRoutes = require('./routes/dashboard');

const validate = async (artifacts, request, h) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, name')
      .eq('id', artifacts.decoded.payload.user_id)
      .single();

    if (error || !user) {
      return { isValid: false };
    }
    return { isValid: true, credentials: user };
  } catch (err) {
    console.error("Validation error:", err);
    return { isValid: false };
  }
};

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:5174'],
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        credentials: true,
      },
    },
  });

  await server.register(Jwt);

  server.auth.strategy('jwt_auth', 'jwt', {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 3600,
      timeSkewSec: 15,
    },
    validate: validate,
  });

  server.auth.default('jwt_auth');

  await server.register([
    { plugin: AuthRoutes, options: { supabase, jwtSecret: process.env.JWT_SECRET } },
    { plugin: IncomeRoutes, options: { supabase } },
    { plugin: OutcomeRoutes, options: { supabase } },
    { plugin: DashboardRoutes, options: { supabase } },
  ]);
  

  await server.start();
  console.log('✅ Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();