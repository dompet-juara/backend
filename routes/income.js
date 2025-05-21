module.exports = {
  name: 'income-routes',
  register: async function (server, options) {
    const { supabase } = options;

    server.route({
      method: 'GET',
      path: '/income',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const { data, error } = await supabase
          .from('pemasukan')
          .select('*')
          .eq('user_id', userId)
          .order('tanggal', { ascending: false });

        if (error) {
          console.error("Error fetching income:", error);
          return h.response({ message: 'Failed to fetch income', error: error.message }).code(500);
        }
        return h.response(data).code(200);
      },
    });

    server.route({
      method: 'POST',
      path: '/income',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const { jumlah, keterangan, tanggal } = request.payload;

        if (jumlah === undefined || jumlah === null || isNaN(parseFloat(jumlah)) || parseFloat(jumlah) <= 0) {
            return h.response({ message: 'Jumlah must be a positive number' }).code(400);
        }

        const { data, error } = await supabase
          .from('pemasukan')
          .insert([{ user_id: userId, jumlah, keterangan, tanggal: tanggal || new Date().toISOString() }])
          .select();

        if (error) {
          console.error("Error adding income:", error);
          return h.response({ message: 'Failed to add income', error: error.message }).code(500);
        }
        return h.response(data[0]).code(201);
      },
    });

    server.route({
      method: 'PUT',
      path: '/income/{id}',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const incomeId = request.params.id;
        const { jumlah, keterangan, tanggal } = request.payload;
        
        if (jumlah !== undefined && (isNaN(parseFloat(jumlah)) || parseFloat(jumlah) <= 0)) {
            return h.response({ message: 'Jumlah must be a positive number if provided' }).code(400);
        }

        const { data, error } = await supabase
          .from('pemasukan')
          .update({ jumlah, keterangan, tanggal })
          .eq('id', incomeId)
          .eq('user_id', userId)
          .select();

        if (error) {
          console.error("Error updating income:", error);
          return h.response({ message: 'Failed to update income', error: error.message }).code(500);
        }
        if (!data || data.length === 0) {
            return h.response({ message: 'Income not found or not authorized to update' }).code(404);
        }
        return h.response(data[0]).code(200);
      },
    });

    server.route({
      method: 'DELETE',
      path: '/income/{id}',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const incomeId = request.params.id;

        const { error } = await supabase
          .from('pemasukan')
          .delete()
          .eq('id', incomeId)
          .eq('user_id', userId);

        if (error) {
          console.error("Error deleting income:", error);
          return h.response({ message: 'Failed to delete income', error: error.message }).code(500);
        }
        return h.response().code(204);
      },
    });
  },
};