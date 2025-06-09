const { getDummyOutcome, dummyExpenseCategories } = require('../utils/dummyData');

module.exports = {
  name: 'outcome-routes',
  register: async function (server, options) {
    const { supabase } = options;

    server.route({
      method: 'GET',
      path: '/outcome',
      options: { auth: 'jwt_guest_accessible' },
      handler: async (request, h) => {
        const { startDate, endDate, page = 1, limit = 10 } = request.query;
        const params = { startDate, endDate, page: parseInt(page,10), limit: parseInt(limit,10) };

        if (!request.auth.isAuthenticated) {
          return h.response(getDummyOutcome(params)).code(200);
        }
        
        const userId = request.auth.credentials.id;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let countQuery = supabase.from('pengeluaran').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        let dataQuery = supabase.from('pengeluaran').select('*, kategori_pengeluaran(id, nama)').eq('user_id', userId);

        if (startDate) { 
            const startISODate = new Date(startDate).toISOString();
            countQuery = countQuery.gte('tanggal', startISODate);
            dataQuery = dataQuery.gte('tanggal', startISODate);
        }
        if (endDate) { 
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            const endISODate = endOfDay.toISOString();
            countQuery = countQuery.lte('tanggal', endISODate);
            dataQuery = dataQuery.lte('tanggal', endISODate);
        }

        const { count, error: countError } = await countQuery;
        if (countError) { 
            console.error("Error counting outcome:", countError);
            return h.response({ message: 'Failed to count outcome', error: countError.message }).code(500);
        }
        
        dataQuery = dataQuery.order('tanggal', { ascending: false }).range(offset, offset + limitNum - 1);
        const { data, error: dataError } = await dataQuery;
        if (dataError) { 
            console.error("Error fetching outcome:", dataError);
            return h.response({ message: 'Failed to fetch outcome', error: dataError.message }).code(500);
        }
        
        return h.response({
          data,
          pagination: { currentPage: pageNum, totalPages: Math.ceil(count / limitNum), totalItems: count, limit: limitNum }
        }).code(200);
      },
    });
    
    server.route({
      method: 'GET',
      path: '/categories', 
      options: { auth: 'jwt_guest_accessible' },
      handler: async (request, h) => {
        if (!request.auth.isAuthenticated) {
            return h.response(dummyExpenseCategories).code(200);
        }
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
      method: 'POST',
      path: '/outcome',
      options: { auth: { strategy: 'jwt_auth_optional', mode: 'required' } },
      handler: async (request, h) => {
        if(!request.auth.isAuthenticated) return h.response({message: "Authentication required"}).code(401);
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
        options: { auth: { strategy: 'jwt_auth_optional', mode: 'required' } },
        handler: async (request, h) => {
            if(!request.auth.isAuthenticated) return h.response({message: "Authentication required"}).code(401);
            const userId = request.auth.credentials.id;
            const outcomeId = request.params.id;
            const { kategori_id, jumlah, keterangan, tanggal } = request.payload;

            if (jumlah !== undefined && (isNaN(parseFloat(jumlah)) || parseFloat(jumlah) <= 0)) {
                return h.response({ message: 'Jumlah must be a positive number if provided' }).code(400);
            }
            
            const updateData = {};
            if (jumlah !== undefined) updateData.jumlah = jumlah;
            if (keterangan !== undefined) updateData.keterangan = keterangan;
            if (tanggal !== undefined) updateData.tanggal = tanggal;
            if (kategori_id !== undefined) updateData.kategori_id = kategori_id;


            const { data, error } = await supabase
              .from('pengeluaran')
              .update(updateData)
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
        options: { auth: { strategy: 'jwt_auth_optional', mode: 'required' } },
        handler: async (request, h) => {
            if(!request.auth.isAuthenticated) return h.response({message: "Authentication required"}).code(401);
            const userId = request.auth.credentials.id;
            const outcomeId = request.params.id;

            const { data, error } = await supabase 
              .from('pengeluaran')
              .delete()
              .eq('id', outcomeId)
              .eq('user_id', userId)
              .select();

            if (error) {
              console.error("Error deleting outcome:", error);
              return h.response({ message: 'Failed to delete outcome', error: error.message }).code(500);
            }
            if (!data || data.length === 0) {
                return h.response({ message: 'Outcome not found or not authorized to delete' }).code(404);
            }
            return h.response().code(204);
        },
    });
    server.route({
        method: 'POST',
        path: '/outcome/import',
        options: {
            auth: { strategy: 'jwt_auth_optional', mode: 'required' },
            payload: { 
                output: 'stream', parse: true, allow: 'multipart/form-data',
                maxBytes: 10 * 1024 * 1024, multipart: { output: 'data' }
            }
        },
        handler: async (request, h) => {
            if(!request.auth.isAuthenticated) return h.response({message: "Authentication required"}).code(401);
            const userId = request.auth.credentials.id;
            const dataToImport = request.payload.records;

            if (!Array.isArray(dataToImport) || dataToImport.length === 0) {
                return h.response({ message: 'No records to import or invalid format.' }).code(400);
            }

            let successfulImports = 0;
            let failedImports = 0;
            const errors = [];
            const { data: categoriesDB, error: catError } = await supabase
                .from('kategori_pengeluaran')
                .select('id, nama');
            if (catError) {
                return h.response({ message: 'Could not fetch outcome categories for mapping.', error: catError.message }).code(500);
            }
            const categoryMap = categoriesDB.reduce((map, cat) => {
                map[cat.nama.toLowerCase()] = cat.id;
                return map;
            }, {});

            const recordsToInsert = [];
            for (const record of dataToImport) {
                if (!record.Tanggal || !record.Jumlah || isNaN(parseFloat(record.Jumlah)) || !record.Kategori) {
                    failedImports++;
                    errors.push({ record, error: 'Missing Tanggal, Jumlah, Kategori, or Jumlah is not a number.' });
                    continue;
                }

                const kategori_id = categoryMap[record.Kategori.toLowerCase()];
                if (!kategori_id) {
                    failedImports++;
                    errors.push({ record, error: `Category "${record.Kategori}" not found.` });
                    continue;
                }
                recordsToInsert.push({
                    user_id: userId,
                    tanggal: new Date(record.Tanggal).toISOString(),
                    jumlah: parseFloat(record.Jumlah),
                    keterangan: record.Keterangan || null,
                    kategori_id: kategori_id,
                });
            }

            if (recordsToInsert.length > 0) {
                const { error: insertError, count } = await supabase
                    .from('pengeluaran')
                    .insert(recordsToInsert)
                    .select({count: 'exact'});

                if (insertError) {
                    failedImports += recordsToInsert.length - (count || 0);
                    errors.push({ error: `Supabase insert error: ${insertError.message}` });
                }
                 successfulImports += (count || 0);
            }
            
            if (recordsToInsert.length === 0 && dataToImport.length > 0) {
                failedImports = dataToImport.length;
            }
            return h.response({
                message: `Import process finished. Successful: ${successfulImports}, Failed: ${failedImports}.`,
                successfulImports, failedImports, errors: errors.slice(0, 10)
            }).code(200);
        }
    });
  },
};