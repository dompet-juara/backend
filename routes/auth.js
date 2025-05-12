const argon2 = require('argon2');
const Jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  name: 'auth-routes',
  register: async function (server) {
    server.route({
      method: 'POST',
      path: '/register',
      handler: async (request, h) => {
        const { email, password, name, username } = request.payload;

        if (!username) {
          return h.response({ error: 'Username is required' }).code(400);
        }

        const hash = await argon2.hash(password);

        const { data, error } = await supabase.from('users').insert([
          {
            email,
            password: hash,
            name,
            username,
          },
        ]);

        if (error) {
          return h.response({ error: error.message }).code(400);
        }

        return { message: 'User registered successfully' };
      },
    });

    server.route({
      method: 'POST',
      path: '/login',
      handler: async (request, h) => {
        const { identifier, password } = request.payload;

        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, username, password')
          .or(`email.eq.${identifier},username.eq.${identifier}`)
          .maybeSingle();

        if (error || !user) {
          return h.response({ error: 'Invalid credentials' }).code(401);
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
          return h.response({ error: 'Invalid password' }).code(401);
        }

        const token = Jwt.sign({ user_id: user.id }, JWT_SECRET, {
          expiresIn: '1h',
        });

        return { token };
      },
    });
  },
};
