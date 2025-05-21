module.exports = {
  name: 'dashboard-routes',
  register: async function (server, options) {
    const { supabase } = options;

    server.route({
      method: 'GET',
      path: '/dashboard/summary',
      handler: async (request, h) => {
        const userId = request.auth.credentials.id;
        
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        try {
          const { data: incomeData, error: incomeError } = await supabase
            .from('pemasukan')
            .select('jumlah')
            .eq('user_id', userId)
            .gte('tanggal', firstDayOfMonth)
            .lte('tanggal', lastDayOfMonth);

          if (incomeError) throw incomeError;

          const { data: outcomeData, error: outcomeError } = await supabase
            .from('pengeluaran')
            .select('jumlah')
            .eq('user_id', userId)
            .gte('tanggal', firstDayOfMonth)
            .lte('tanggal', lastDayOfMonth);
          
          if (outcomeError) throw outcomeError;

          const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
          const totalOutcome = outcomeData.reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
          
          const { data: recentIncomes, error: recentIncomesError } = await supabase
            .from('pemasukan')
            .select('id, jumlah, keterangan, tanggal, \'income\' as type')
            .eq('user_id', userId)
            .order('tanggal', { ascending: false })
            .limit(5);
          if (recentIncomesError) throw recentIncomesError;

          const { data: recentOutcomes, error: recentOutcomesError } = await supabase
            .from('pengeluaran')
            .select('id, jumlah, keterangan, tanggal, kategori_id, \'outcome\' as type, kategori_pengeluaran(nama)')
            .eq('user_id', userId)
            .order('tanggal', { ascending: false })
            .limit(5);
          if (recentOutcomesError) throw recentOutcomesError;
          
          const recentTransactions = [...recentIncomes, ...recentOutcomes]
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
            .slice(0, 5);


          return h.response({
            totalIncome,
            totalOutcome,
            balance: totalIncome - totalOutcome,
            month: today.toLocaleString('default', { month: 'long', year: 'numeric' }),
            recentTransactions
          }).code(200);

        } catch (error) {
          console.error("Error fetching dashboard summary:", error);
          return h.response({ message: 'Failed to fetch dashboard summary', error: error.message }).code(500);
        }
      },
    });
  },
};