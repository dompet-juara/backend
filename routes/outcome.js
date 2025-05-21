module.exports = {
  name: 'outcome-routes',
  register: async function (server, options) {
    const { supabase } = options;

    server.route({
      method: 'GET',
      path: '/categories',
      handler: async (request, h) => {
        const { data, error } = await supabase
          .from('kategori_pengeluaran')
          .select('*')
          .order('nama', { ascending: true });

        if (error) {
          console.error("Error fetching categories:", error);
          return h.response({ message: 'Failed to fetch categories', error: error.message }).code(500);
        }
        return h.response(data).code(200);
      },
    });

    server.route({
      method: 'GET',
      path: '/outcome',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const { data, error } = await supabase
          .from('pengeluaran')
          .select('*, kategori_pengeluaran(id, nama)')
          .eq('user_id', userId)
          .order('tanggal', { ascending: false });

        if (error) {
          console.error("Error fetching outcome:", error);
          return h.response({ message: 'Failed to fetch outcome', error: error.message }).code(500);
        }
        return h.response(data).code(200);
      },
    });

    server.route({
      method: 'POST',
      path: '/outcome',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const { kategori_id, jumlah, keterangan, tanggal } = request.payload;

        if (jumlah === undefined || jumlah === null || isNaN(parseFloat(jumlah)) || parseFloat(jumlah) <= 0) {
            return h.response({ message: 'Jumlah must be a positive number' }).code(400);
        }
        if (kategori_id === undefined || kategori_id === null) {
            return h.response({ message: 'Kategori ID is required' }).code(400);
        }

        const { data, error } = await supabase
          .from('pengeluaran')
          .insert([{ user_id: userId, kategori_id, jumlah, keterangan, tanggal: tanggal || new Date().toISOString() }])
          .select('*, kategori_pengeluaran(id, nama)');

        if (error) {
          console.error("Error adding outcome:", error);
          return h.response({ message: 'Failed to add outcome', error: error.message }).code(500);
        }
        return h.response(data[0]).code(201);
      },
    });

    server.route({
      method: 'PUT',
      path: '/outcome/{id}',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const outcomeId = request.params.id;
        const { kategori_id, jumlah, keterangan, tanggal } = request.payload;

        if (jumlah !== undefined && (isNaN(parseFloat(jumlah)) || parseFloat(jumlah) <= 0)) {
            return h.response({ message: 'Jumlah must be a positive number if provided' }).code(400);
        }

        const { data, error } = await supabase
          .from('pengeluaran')
          .update({ kategori_id, jumlah, keterangan, tanggal })
          .eq('id', outcomeId)
          .eq('user_id', userId)
          .select('*, kategori_pengeluaran(id, nama)');

        if (error) {
          console.error("Error updating outcome:", error);
          return h.response({ message: 'Failed to update outcome', error: error.message }).code(500);
        }
         if (!data || data.length === 0) {
            return h.response({ message: 'Outcome not found or not authorized to update' }).code(404);
        }
        return h.response(data[0]).code(200);
      },
    });

    server.route({
      method: 'DELETE',
      path: '/outcome/{id}',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        const outcomeId = request.params.id;

        const { error } = await supabase
          .from('pengeluaran')
          .delete()
          .eq('id', outcomeId)
          .eq('user_id', userId);

        if (error) {
          console.error("Error deleting outcome:", error);
          return h.response({ message: 'Failed to delete outcome', error: error.message }).code(500);
        }
        return h.response().code(204);
      },
    });
  },
};