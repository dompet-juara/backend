const argon2 = require('argon2');
const Jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID_BACKEND || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

module.exports = {
  name: 'auth-routes',
  register: async function (server, options) {
    const { supabase, accessTokenSecret, refreshTokenSecret } = options;

    const generateTokens = (user) => {
      const accessTokenPayload = {
        user_id: user.id,
        username: user.username,
        type: 'access',
      };
      const accessToken = Jwt.sign(accessTokenPayload, accessTokenSecret, {
        expiresIn: '15m',
      });

      const refreshTokenPayload = {
        user_id: user.id,
        type: 'refresh',
      };
      const refreshToken = Jwt.sign(refreshTokenPayload, refreshTokenSecret, {
        expiresIn: '7d',
      });
      
      return { accessToken, refreshToken };
    };

    server.route({
      method: 'POST',
      path: '/auth/google-signin-data',
      options: { auth: false },
      handler: async (request, h) => {
        const { idToken } = request.payload;

        if (!idToken) {
          return h.response({ message: 'Google ID Token is required.' }).code(400);
        }

        try {
          const ticket = await googleClient.verifyIdToken({
              idToken: idToken,
              audience: GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          
          if (!payload) {
            return h.response({ message: 'Invalid Google ID Token.' }).code(401);
          }

          const { email, name, picture, email_verified } = payload;

          if (!email_verified) {
            console.warn(`Google email ${email} is not verified.`);
          }
          
          return h.response({
            email: email,
            name: name,
            picture: picture,
          }).code(200);

        } catch (error) {
          console.error("Google ID Token verification error:", error);
          return h.response({ message: 'Failed to verify Google ID Token or token expired.' }).code(401);
        }
      },
    });


    server.route({
      method: 'POST',
      path: '/register',
      options: { auth: false },
      handler: async (request, h) => {
        const { email, password, name, username } = request.payload;

        if (!username) return h.response({ message: 'Username is required' }).code(400);
        if (!email) return h.response({ message: 'Email is required' }).code(400);
        if (!name) return h.response({ message: 'Name is required' }).code(400);
        if (!password) return h.response({ message: 'Password is required' }).code(400);
        if (password.length < 6) return h.response({ message: 'Password must be at least 6 characters long' }).code(400);


        try {
          const hash = await argon2.hash(password);
          const { data, error } = await supabase.from('users').insert([
            { email, password: hash, name, username },
          ]).select('id, email, username, name');

          if (error) {
            console.error("Registration error:", error);
            if (error.code === '23505') { 
                 if (error.message.includes('users_username_key')) {
                    return h.response({ message: 'Username already exists.' }).code(409);
                }
                if (error.message.includes('users_email_key')) {
                    return h.response({ message: 'Email already exists.' }).code(409);
                }
            }
            return h.response({ message: error.message || 'Registration failed.' }).code(400);
          }
          
          if (!data || data.length === 0) {
            return h.response({ message: 'User registration failed, user data not returned.' }).code(500);
          }

          return h.response({ message: 'User registered successfully', user: data[0] }).code(201);
        } catch (err) {
            console.error("Server error during registration:", err);
            return h.response({ message: 'Internal server error during registration.' }).code(500);
        }
      },
    });

    server.route({
      method: 'POST',
      path: '/login',
      options: { auth: false },
      handler: async (request, h) => {
        const { identifier, password } = request.payload;
        if (!identifier || !password) {
            return h.response({ error: 'Username/email and password are required' }).code(400);
        }

        const { data: user, error: dbError } = await supabase
          .from('users')
          .select('id, email, username, password, name')
          .or(`email.eq.${identifier},username.eq.${identifier}`)
          .maybeSingle();

        if (dbError) {
          console.error("Login DB error:", dbError);
          return h.response({ error: 'Server error during login' }).code(500);
        }
        
        if (!user) {
          return h.response({ error: 'Invalid username/email or password' }).code(401);
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
          return h.response({ error: 'Invalid username/email or password' }).code(401);
        }

        const { accessToken, refreshToken } = generateTokens(user);
        
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

        const { error: tokenError } = await supabase
            .from('refresh_tokens')
            .insert({
                user_id: user.id,
                token: refreshToken, 
                expires_at: refreshTokenExpiresAt.toISOString(),
                ip_address: request.info.remoteAddress,
                user_agent: request.headers['user-agent']
            });

        if (tokenError) {
            console.error("Error saving refresh token:", tokenError);
            return h.response({ error: 'Login failed, could not save session.' }).code(500);
        }

        return h.response({
          message: 'Login successful',
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
          }
        }).code(200);
      },
    });

    server.route({
        method: 'POST',
        path: '/refresh-token',
        options: { auth: false }, 
        handler: async (request, h) => {
            const { refreshToken } = request.payload || {};

            if (!refreshToken) {
                return h.response({ error: 'Refresh token is required' }).code(400);
            }

            try {
                const decoded = Jwt.verify(refreshToken, refreshTokenSecret);
                if (decoded.type !== 'refresh') {
                    return h.response({ error: 'Invalid token type' }).code(401);
                }

                const { data: storedToken, error: dbError } = await supabase
                    .from('refresh_tokens')
                    .select('*')
                    .eq('token', refreshToken)
                    .eq('user_id', decoded.user_id)
                    .single();
                
                if (dbError || !storedToken) {
                    console.error("Refresh token lookup error or not found:", dbError);
                    return h.response({ error: 'Invalid or expired refresh token' }).code(401);
                }

                if (storedToken.is_revoked || new Date(storedToken.expires_at) < new Date()) {
                    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', decoded.user_id);
                    return h.response({ error: 'Refresh token revoked or expired' }).code(401);
                }
                const { data: user, error: userError } = await supabase
                    .from('users')
                    .select('id, username, email, name')
                    .eq('id', decoded.user_id)
                    .single();

                if (userError || !user) {
                    return h.response({ error: 'User not found for refresh token' }).code(401);
                }
                
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
                await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('id', storedToken.id);
                
                const newRefreshTokenExpiresAt = new Date();
                newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + 7);

                await supabase.from('refresh_tokens').insert({
                    user_id: user.id,
                    token: newRefreshToken,
                    expires_at: newRefreshTokenExpiresAt.toISOString(),
                    ip_address: request.info.remoteAddress,
                    user_agent: request.headers['user-agent']
                });

                return h.response({ accessToken: newAccessToken, refreshToken: newRefreshToken }).code(200);

            } catch (err) {
                console.error("Refresh token error:", err.message);
                if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
                    return h.response({ error: 'Invalid or expired refresh token' }).code(401);
                }
                return h.response({ error: 'Internal server error during token refresh' }).code(500);
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/logout',
        options: { auth: false }, 
        handler: async (request, h) => {
            const { refreshToken } = request.payload || {};
            if (!refreshToken) {
                return h.response({ message: 'Refresh token is required for logout' }).code(400);
            }

            try {
                const decoded = Jwt.verify(refreshToken, refreshTokenSecret);
                if (decoded.type !== 'refresh') {
                     return h.response({ message: 'Invalid token type for logout' }).code(400);
                }

                const { error } = await supabase
                    .from('refresh_tokens')
                    .update({ is_revoked: true })
                    .eq('token', refreshToken)
                    .eq('user_id', decoded.user_id); 

                if (error) {
                    console.error("Logout error, failed to revoke token:", error);
                }
                return h.response({ message: 'Logout successful' }).code(200);
            } catch (err) {
                console.error("Error during logout token verification:", err.message);
                if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
                    return h.response({ message: 'Logout processed, but token was invalid/expired.' }).code(200);
                }
                return h.response({ message: 'An error occurred during logout.' }).code(500);
            }
        }
    });

  },
};