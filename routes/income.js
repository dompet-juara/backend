const { getDummyIncome, dummyIncomeCategories } = require("../utils/dummyData");

module.exports = {
    name: "income-routes",
    register: async function (server, options) {
        const { supabase } = options;

        server.route({
            method: "GET",
            path: "/income",
            options: { auth: "jwt_guest_accessible" },
            handler: async (request, h) => {
                const {
                    startDate,
                    endDate,
                    page = 1,
                    limit = 10,
                } = request.query;
                const params = {
                    startDate,
                    endDate,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                };

                if (!request.auth.isAuthenticated) {
                    return h.response(getDummyIncome(params)).code(200);
                }

                const userId = request.auth.credentials.id;
                const pageNum = parseInt(page, 10);
                const limitNum = parseInt(limit, 10);
                const offset = (pageNum - 1) * limitNum;

                let countQuery = supabase
                    .from("pemasukan")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", userId);
                let dataQuery = supabase
                    .from("pemasukan")
                    .select("*, kategori_pemasukan(id, nama)")
                    .eq("user_id", userId);

                if (startDate) {
                    const startISODate = new Date(startDate).toISOString();
                    countQuery = countQuery.gte("tanggal", startISODate);
                    dataQuery = dataQuery.gte("tanggal", startISODate);
                }
                if (endDate) {
                    const endOfDay = new Date(endDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    const endISODate = endOfDay.toISOString();
                    countQuery = countQuery.lte("tanggal", endISODate);
                    dataQuery = dataQuery.lte("tanggal", endISODate);
                }

                const { count, error: countError } = await countQuery;
                if (countError) {
                    console.error("Error counting income:", countError);
                    return h
                        .response({
                            message: "Failed to count income",
                            error: countError.message,
                        })
                        .code(500);
                }

                dataQuery = dataQuery
                    .order("tanggal", { ascending: false })
                    .range(offset, offset + limitNum - 1);
                const { data, error: dataError } = await dataQuery;
                if (dataError) {
                    console.error("Error fetching income:", dataError);
                    return h
                        .response({
                            message: "Failed to fetch income",
                            error: dataError.message,
                        })
                        .code(500);
                }

                return h
                    .response({
                        data,
                        pagination: {
                            currentPage: pageNum,
                            totalPages: Math.ceil(count / limitNum),
                            totalItems: count,
                            limit: limitNum,
                        },
                    })
                    .code(200);
            },
        });

        server.route({
            method: "GET",
            path: "/income/categories",
            options: { auth: "jwt_guest_accessible" },
            handler: async (request, h) => {
                if (!request.auth.isAuthenticated) {
                    return h.response(dummyIncomeCategories).code(200);
                }
                const { data, error } = await supabase
                    .from("kategori_pemasukan")
                    .select("*")
                    .order("nama", { ascending: true });
                if (error) {
                    console.error("Error fetching income categories:", error);
                    return h
                        .response({
                            message: "Failed to fetch income categories",
                            error: error.message,
                        })
                        .code(500);
                }
                return h.response(data).code(200);
            },
        });

        server.route({
            method: "POST",
            path: "/income",
            options: {
                auth: "jwt_guest_accessible",
            },
            handler: async (request, h) => {
                if (!request.auth.isAuthenticated)
                    return h
                        .response({ message: "Authentication required" })
                        .code(401);
                const userId = request.auth.credentials.id;
                const { jumlah, keterangan, tanggal, kategori_id } =
                    request.payload;

                if (
                    jumlah === undefined ||
                    jumlah === null ||
                    isNaN(parseFloat(jumlah)) ||
                    parseFloat(jumlah) <= 0
                ) {
                    return h
                        .response({
                            message: "Jumlah must be a positive number",
                        })
                        .code(400);
                }

                const { data, error } = await supabase
                    .from("pemasukan")
                    .insert([
                        {
                            user_id: userId,
                            jumlah,
                            keterangan,
                            tanggal: tanggal || new Date().toISOString(),
                            kategori_id,
                        },
                    ])
                    .select("*, kategori_pemasukan(id, nama)");

                if (error) {
                    console.error("Error adding income:", error);
                    return h
                        .response({
                            message: "Failed to add income",
                            error: error.message,
                        })
                        .code(500);
                }
                return h.response(data[0]).code(201);
            },
        });
        server.route({
            method: "PUT",
            path: "/income/{id}",
            options: {
                auth: "jwt_guest_accessible",
            },
            handler: async (request, h) => {
                if (!request.auth.isAuthenticated)
                    return h
                        .response({ message: "Authentication required" })
                        .code(401);
                const userId = request.auth.credentials.id;
                const incomeId = request.params.id;
                const { jumlah, keterangan, tanggal, kategori_id } =
                    request.payload;

                if (
                    jumlah !== undefined &&
                    (isNaN(parseFloat(jumlah)) || parseFloat(jumlah) <= 0)
                ) {
                    return h
                        .response({
                            message:
                                "Jumlah must be a positive number if provided",
                        })
                        .code(400);
                }

                const updateData = {};
                if (jumlah !== undefined) updateData.jumlah = jumlah;
                if (keterangan !== undefined)
                    updateData.keterangan = keterangan;
                if (tanggal !== undefined) updateData.tanggal = tanggal;
                if (kategori_id !== undefined)
                    updateData.kategori_id = kategori_id;

                const { data, error } = await supabase
                    .from("pemasukan")
                    .update(updateData)
                    .eq("id", incomeId)
                    .eq("user_id", userId)
                    .select("*, kategori_pemasukan(id, nama)");

                if (error) {
                    console.error("Error updating income:", error);
                    return h
                        .response({
                            message: "Failed to update income",
                            error: error.message,
                        })
                        .code(500);
                }
                if (!data || data.length === 0) {
                    return h
                        .response({
                            message:
                                "Income not found or not authorized to update",
                        })
                        .code(404);
                }
                return h.response(data[0]).code(200);
            },
        });

        server.route({
            method: "DELETE",
            path: "/income/{id}",
            options: {
                auth: 'jwt_guest_accessible', 
            },
            handler: async (request, h) => {
                if (!request.auth.isAuthenticated)
                    return h
                        .response({ message: "Authentication required" })
                        .code(401);
                const userId = request.auth.credentials.id;
                const incomeId = request.params.id;

                const { data, error } = await supabase
                    .from("pemasukan")
                    .delete()
                    .eq("id", incomeId)
                    .eq("user_id", userId)
                    .select();

                if (error) {
                    console.error("Error deleting income:", error);
                    return h
                        .response({
                            message: "Failed to delete income",
                            error: error.message,
                        })
                        .code(500);
                }
                if (!data || data.length === 0) {
                    return h
                        .response({
                            message:
                                "Income not found or not authorized to delete",
                        })
                        .code(404);
                }
                return h.response().code(204);
            },
        });
        server.route({
            method: "POST",
            path: "/income/import",
            options: {
                auth: 'jwt_guest_accessible',
                payload: {
                    output: "stream",
                    parse: true,
                    allow: "multipart/form-data",
                    maxBytes: 10 * 1024 * 1024,
                    multipart: { output: "data" },
                },
            },
            handler: async (request, h) => {
                if (!request.auth.isAuthenticated)
                    return h
                        .response({ message: "Authentication required" })
                        .code(401);
                const userId = request.auth.credentials.id;
                const dataToImport = request.payload.records;

                if (!Array.isArray(dataToImport) || dataToImport.length === 0) {
                    return h
                        .response({
                            message: "No records to import or invalid format.",
                        })
                        .code(400);
                }

                let successfulImports = 0;
                let failedImports = 0;
                const errors = [];
                const { data: categoriesDB, error: catError } = await supabase
                    .from("kategori_pemasukan")
                    .select("id, nama");
                if (catError) {
                    return h
                        .response({
                            message:
                                "Could not fetch income categories for mapping.",
                            error: catError.message,
                        })
                        .code(500);
                }
                const categoryMap = categoriesDB.reduce((map, cat) => {
                    map[cat.nama.toLowerCase()] = cat.id;
                    return map;
                }, {});

                const recordsToInsert = [];
                for (const record of dataToImport) {
                    if (
                        !record.Tanggal ||
                        !record.Jumlah ||
                        isNaN(parseFloat(record.Jumlah))
                    ) {
                        failedImports++;
                        errors.push({
                            record,
                            error: "Missing Tanggal or Jumlah, or Jumlah is not a number.",
                        });
                        continue;
                    }

                    let kategori_id = null;
                    if (
                        record.Kategori &&
                        typeof record.Kategori === "string"
                    ) {
                        kategori_id =
                            categoryMap[record.Kategori.toLowerCase()] || null;
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
                        .from("pemasukan")
                        .insert(recordsToInsert)
                        .select({ count: "exact" });

                    if (insertError) {
                        failedImports += recordsToInsert.length - (count || 0);
                        errors.push({
                            error: `Supabase insert error: ${insertError.message}`,
                        });
                    }
                    successfulImports += count || 0;
                }

                if (recordsToInsert.length === 0 && dataToImport.length > 0) {
                    failedImports = dataToImport.length;
                }
                return h
                    .response({
                        message: `Import process finished. Successful: ${successfulImports}, Failed: ${failedImports}.`,
                        successfulImports,
                        failedImports,
                        errors: errors.slice(0, 10),
                    })
                    .code(200);
            },
        });
    },
};
