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

    if (error) {
      return { isValid: false };
    }
    if (!user) {
      return { isValid: false };
    }
    return { isValid: true, credentials: user };
  } catch (err) {
    console.error("JWT Validation: Unhandled error during validation:", err.message);
    return { isValid: false };
  }
};


const init = async () => {
  const serverHost = process.env.NODE_ENV === 'production' 
    ? '0.0.0.0'
    : (process.env.HOST || '0.0.0.0');

  let corsOrigins;
  if (process.env.CORS_ORIGIN) {
    corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  } else if (process.env.NODE_ENV === 'production') {
    console.error(
        "PRODUCTION SECURITY WARNING: CORS_ORIGIN environment variable is NOT SET. "+
        "Cross-origin requests will likely be blocked or insecure. "+
        "Please set CORS_ORIGIN to your specific frontend domain(s) in your production environment."
    );
    corsOrigins = [];
  } else {
    console.warn(
        "DEVELOPMENT MODE: CORS_ORIGIN environment variable is not set. "+
        "Defaulting to '*' (allow all origins) for local testing convenience. "+
        "Ensure CORS_ORIGIN is correctly set for production."
    );
    corsOrigins = ['*'];
  }

  console.log(`Server will attempt to listen on host: ${serverHost}`);
  console.log("Configuring Hapi server with CORS for origins:", corsOrigins);

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: serverHost,
    routes: {
      cors: {
        origin: corsOrigins,
        headers: [
            'Accept', 'Authorization', 'Content-Type', 'If-None-Match', 
            'X-Refresh-Token', 'X-Requested-With', 'Origin', 
        ],
        additionalHeaders: ['cache-control', 'x-requested-with'],
        credentials: true,
        maxAge: 3600
      },
      validate: {
          failAction: async (request, h, err) => {
            if (process.env.NODE_ENV === 'production') {
              console.error('API Validation Error (payload/params/query):', err.message);
              return h.response({ statusCode: 400, error: "Bad Request", message: err.message }).code(400).takeover();
            } else {
              console.error('API Validation Error (payload/params/query) - DEV Full Error:', err.output.payload);
              throw err;
            }
          }
      }
    },
  });

  await server.register(Jwt);

  const accessTokenSecret = process.env.JWT_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!accessTokenSecret || accessTokenSecret === 'IniAdalahProjekCapstoneDBSCodIngCaMpDompETJuara' || (accessTokenSecret && accessTokenSecret.length < 32) ) {
    console.warn("SECURITY WARNING: JWT_SECRET is not set, is default, or is too short (min 32 chars recommended). Please set a strong JWT_SECRET in your .env file for production.");
  }
  if (!refreshTokenSecret || refreshTokenSecret === 'IniAdalahProjekCapstoneDBSCodIngCaMpDompETJuara' || (refreshTokenSecret && refreshTokenSecret.length < 32)) {
    console.warn("SECURITY WARNING: REFRESH_TOKEN_SECRET is not set, is default, or is too short (min 32 chars recommended). Please set a strong REFRESH_TOKEN_SECRET in your .env file for production.");
  }

  server.auth.strategy('jwt_auth_required', 'jwt', {
    keys: accessTokenSecret,
    verify: { aud: false, iss: false, sub: false, nbf: true, exp: true, maxAgeSec: 15 * 60, timeSkewSec: 15 },
    validate: validate,
  });

  server.auth.strategy('jwt_guest_accessible', 'jwt', {
    keys: accessTokenSecret,
    verify: { aud: false, iss: false, sub: false, nbf: true, exp: true, maxAgeSec: 15 * 60, timeSkewSec: 15 },
    validate: validate,
  });

  console.log("Registering application route plugins...");
  await server.register([
    { plugin: AuthRoutes, options: { supabase, accessTokenSecret, refreshTokenSecret } },
    { plugin: UserRoutes, options: { supabase } },
    { plugin: IncomeRoutes, options: { supabase } },
    { plugin: OutcomeRoutes, options: { supabase } },
    { plugin: DashboardRoutes, options: { supabase } },
    { plugin: AiRoutes, options: { supabase } },
    { plugin: ChatRoutes, options: { supabase } }
  ]);
  console.log("All application route plugins registered.");

  await server.start();
  console.log('✅ Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error("Unhandled Rejection:", err.message, err.stack ? `\nStack: ${err.stack}` : '');
});

process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception:", err.message, err.stack ? `\nStack: ${err.stack}` : '');
  process.exit(1);
});

let serverInstance;






init().catch(err => {
    console.error("Failed to initialize or start server:", err);
    process.exit(1);
});