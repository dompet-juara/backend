'use strict';

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const supabase = require('./supabase');

const AuthRoutes = require('./routes/auth');
const IncomeRoutes = require('./routes/income');
const OutcomeRoutes = require('./routes/outcome');
const DashboardRoutes = require('./routes/dashboard');
const AiRoutes = require('./routes/ai');
const UserRoutes = require('./routes/user');
const ChatRoutes = require('./routes/chat');

const validate = async (artifacts, request, h) => {
  try {
    if (!artifacts.decoded.payload || !artifacts.decoded.payload.user_id || artifacts.decoded.payload.type !== 'access') {
        return { isValid: false };
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, name, avatar_url')
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
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(','),
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'X-Refresh-Token'],
        credentials: true,
      },
    },
  });

  await server.register(Jwt);

  const accessTokenSecret = process.env.JWT_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!accessTokenSecret || accessTokenSecret === 'default_access_secret_please_change') {
    console.warn("Warning: JWT_SECRET is not set or is default. Please set a strong JWT_SECRET in your .env file for production.");
  }
  if (!refreshTokenSecret || refreshTokenSecret === 'default_refresh_secret_please_change') {
    console.warn("Warning: REFRESH_TOKEN_SECRET is not set or is default. Please set a strong REFRESH_TOKEN_SECRET in your .env file for production.");
  }

  server.auth.strategy('jwt_auth_required', 'jwt', {
    keys: accessTokenSecret,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 15 * 60,
      timeSkewSec: 15,
    },
    validate: validate,
  });

  server.auth.strategy('jwt_guest_accessible', 'jwt', {
    keys: accessTokenSecret,
    verify: {
        aud: false, iss: false, sub: false, nbf: true, exp: true,
        maxAgeSec: 15 * 60, timeSkewSec: 15,
    },
    validate: validate,
    mode: 'try'
  });



  await server.register([
    { plugin: AuthRoutes, options: { supabase, accessTokenSecret, refreshTokenSecret } },
    { plugin: UserRoutes, options: { supabase } },
    { plugin: IncomeRoutes, options: { supabase } },
    { plugin: OutcomeRoutes, options: { supabase } },
    { plugin: DashboardRoutes, options: { supabase } },
    { plugin: AiRoutes, options: { supabase } },
    { plugin: ChatRoutes, options: { supabase } }
  ]);

  await server.start();
  console.log('✅ Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

init();