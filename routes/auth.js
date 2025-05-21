const argon2 = require('argon2');
const Jwt = require('jsonwebtoken');

module.exports = {
  name: 'auth-routes',
  register: async function (server, options) {
    const { supabase, jwtSecret } = options;

    server.route({
      method: 'POST',
      path: '/register',
      options: { auth: false },
      handler: async (request, h) => {
        const { email, password, name, username } = request.payload;

        if (!username) {
          return h.response({ message: 'Username is required' }).code(400);
        }
        if (!email) {
          return h.response({ message: 'Email is required' }).code(400);
        }
        if (!name) {
          return h.response({ message: 'Name is required' }).code(400);
        }
        if (!password) {
          return h.response({ message: 'Password is required' }).code(400);
        }


        try {
          const hash = await argon2.hash(password);

          const { data, error } = await supabase.from('users').insert([
            {
              email,
              password: hash,
              name,
              username,
            },
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
          return h.response({ error: 'Invalid username or email' }).code(401);
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
          return h.response({ error: 'Invalid password' }).code(401);
        }

        const tokenPayload = {
          user_id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        };
        
        const token = Jwt.sign(tokenPayload, jwtSecret, {
          expiresIn: '1h',
        });


        return h.response({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
          }
        }).code(200);
      },
    });
  },
};