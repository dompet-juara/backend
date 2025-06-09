
module.exports = {
  name: 'dashboard-routes',
  register: async function (server, options) {
    const { supabase } = options;

    server.route({
      method: 'GET',
      path: '/dashboard/summary',
      options: { auth: 'jwt_guest_accessible' },
      handler: async (request, h) => {
        let { startDate, endDate } = request.query;

        if (!request.auth.isAuthenticated) {
          return h.response({ message: 'Authentication required to view dashboard summary.' }).code(401);
        }
        
        const userId = request.auth.credentials.id;
        let filterStartDate, filterEndDate, monthName;

        if (startDate && endDate) { 
            filterStartDate = new Date(startDate).toISOString();
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            filterEndDate = endOfDay.toISOString();
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
                monthName = start.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            } else {
                monthName = `${start.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} - ${end.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}`;
            }
        } else { 
            const today = new Date();
            filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            filterEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            monthName = today.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        }

        try {
          const { data: incomeData, error: incomeError } = await supabase.from('pemasukan').select('jumlah').eq('user_id', userId).gte('tanggal', filterStartDate).lte('tanggal', filterEndDate);
          if (incomeError) throw incomeError;
          const { data: outcomeData, error: outcomeError } = await supabase.from('pengeluaran').select('jumlah').eq('user_id', userId).gte('tanggal', filterStartDate).lte('tanggal', filterEndDate);
          if (outcomeError) throw outcomeError;

          const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
          const totalOutcome = outcomeData.reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
          
          const { data: recentIncomes, error: recentIncomesError } = await supabase
            .from('pemasukan')
            .select('id, jumlah, keterangan, tanggal, kategori_id, kategori_pemasukan(nama)')
            .eq('user_id', userId)
            .gte('tanggal', filterStartDate)
            .lte('tanggal', filterEndDate)
            .order('tanggal', { ascending: false })
            .limit(10);
          if (recentIncomesError) throw recentIncomesError;

          const { data: recentOutcomes, error: recentOutcomesError } = await supabase
            .from('pengeluaran')
            .select('id, jumlah, keterangan, tanggal, kategori_id, kategori_pengeluaran(nama)')
            .eq('user_id', userId)
            .gte('tanggal', filterStartDate)
            .lte('tanggal', filterEndDate)
            .order('tanggal', { ascending: false })
            .limit(10);
          if (recentOutcomesError) throw recentOutcomesError;
          
          const recentTransactions = [...recentIncomes.map(i => ({...i, type: 'income'})), ...recentOutcomes.map(o => ({...o, type: 'outcome'}))]
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
            .slice(0, 10);

          return h.response({ totalIncome, totalOutcome, balance: totalIncome - totalOutcome, month: monthName, recentTransactions }).code(200);
        } catch (error) { 
            console.error("Error fetching dashboard summary:", error);
            const errorResponse = { message: 'Failed to fetch dashboard summary', error: error.message };
            if (error.details) errorResponse.details = error.details;
            if (error.hint) errorResponse.hint = error.hint;
            return h.response(errorResponse).code(500);
        }
      },
    });
  },
};