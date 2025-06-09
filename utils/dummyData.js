
const GUEST_USER_ID_PLACEHOLDER = 0;

const dummyIncomeCategories = [
    { id: 101, nama: 'Gaji Proyek Fiktif' },
    { id: 102, nama: 'Bonus Imajinatif' },
    { id: 103, nama: 'Pendapatan Pasif Virtual' },
];

const dummyExpenseCategories = [
    { id: 201, nama: 'Kebutuhan Fantasi' },
    { id: 202, nama: 'Hiburan Khayalan' },
    { id: 203, nama: 'Transportasi Impian' },
    { id: 204, nama: 'Investasi Fiktif' },
];

const getDummyIncome = (params = {}) => {
    const { startDate, endDate, page = 1, limit = 10 } = params;
    const allDummyIncomes = [
        { id: 1, user_id: GUEST_USER_ID_PLACEHOLDER, jumlah: 5000000, keterangan: 'Gaji bulanan (dummy)', tanggal: new Date(new Date().setDate(1)).toISOString(), kategori_id: 101, kategori_pemasukan: dummyIncomeCategories[0] },
        { id: 2, user_id: GUEST_USER_ID_PLACEHOLDER, jumlah: 1500000, keterangan: 'Bonus project A (dummy)', tanggal: new Date(new Date().setDate(5)).toISOString(), kategori_id: 102, kategori_pemasukan: dummyIncomeCategories[1] },
        { id: 3, user_id: GUEST_USER_ID_PLACEHOLDER, jumlah: 750000, keterangan: 'Dividen saham (dummy)', tanggal: new Date(new Date().setDate(10)).toISOString(), kategori_id: 103, kategori_pemasukan: dummyIncomeCategories[2] },
        { id: 4, user_id: GUEST_USER_ID_PLACEHOLDER, jumlah: 250000, keterangan: 'Freelance kecil (dummy)', tanggal: new Date(new Date().setDate(15)).toISOString(), kategori_id: 101, kategori_pemasukan: dummyIncomeCategories[0] },
        { id: 5, user_id: GUEST_USER_ID_PLACEHOLDER, jumlah: 1200000, keterangan: 'Penjualan barang bekas (dummy)', tanggal: new Date(new Date().setDate(20)).toISOString(), kategori_id: 103, kategori_pemasukan: dummyIncomeCategories[2] },
    ];
    let filtered = allDummyIncomes;
    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).setHours(23,59,59,999);
        filtered = allDummyIncomes.filter(item => {
            const itemDate = new Date(item.tanggal).getTime();
            return itemDate >= start && itemDate <= end;
        });
    }
    
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedData = filtered.slice(offset, offset + limit);

    return {
        data: paginatedData,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            limit: limit,
        }
    };
};

const getDummyOutcome = (params = {}) => {
    const { startDate, endDate, page = 1, limit = 10 } = params;
    const allDummyOutcomes = [
        { id: 11, user_id: GUEST_USER_ID_PLACEHOLDER, kategori_id: 201, jumlah: 1200000, keterangan: 'Belanja bulanan (dummy)', tanggal: new Date(new Date().setDate(2)).toISOString(), kategori_pengeluaran: dummyExpenseCategories[0] },
        { id: 12, user_id: GUEST_USER_ID_PLACEHOLDER, kategori_id: 202, jumlah: 300000, keterangan: 'Tiket bioskop (dummy)', tanggal: new Date(new Date().setDate(7)).toISOString(), kategori_pengeluaran: dummyExpenseCategories[1] },
        { id: 13, user_id: GUEST_USER_ID_PLACEHOLDER, kategori_id: 203, jumlah: 150000, keterangan: 'Bensin (dummy)', tanggal: new Date(new Date().setDate(12)).toISOString(), kategori_pengeluaran: dummyExpenseCategories[2] },
        { id: 14, user_id: GUEST_USER_ID_PLACEHOLDER, kategori_id: 204, jumlah: 1000000, keterangan: 'Investasi reksadana (dummy)', tanggal: new Date(new Date().setDate(18)).toISOString(), kategori_pengeluaran: dummyExpenseCategories[3] },
        { id: 15, user_id: GUEST_USER_ID_PLACEHOLDER, kategori_id: 201, jumlah: 50000, keterangan: 'Jajan kopi (dummy)', tanggal: new Date(new Date().setDate(22)).toISOString(), kategori_pengeluaran: dummyExpenseCategories[0] },
    ];
     let filtered = allDummyOutcomes;
    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).setHours(23,59,59,999);
        filtered = allDummyOutcomes.filter(item => {
            const itemDate = new Date(item.tanggal).getTime();
            return itemDate >= start && itemDate <= end;
        });
    }
    
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedData = filtered.slice(offset, offset + limit);

    return {
        data: paginatedData,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            limit: limit,
        }
    };
};

const getDummyDashboardSummary = (params = {}) => {
    const { startDate, endDate } = params;
    let monthName = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    
    const incomeResult = getDummyIncome(params);
    const outcomeResult = getDummyOutcome(params);

    const totalIncome = incomeResult.data.reduce((sum, item) => sum + item.jumlah, 0);
    const totalOutcome = outcomeResult.data.reduce((sum, item) => sum + item.jumlah, 0);

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) {
            monthName = start.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});
        } else if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
            monthName = start.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        } else {
            monthName = `${start.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} - ${end.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}`;
        }
    }

    const recentTransactions = [
        ...incomeResult.data.map(i => ({ ...i, type: 'income' })),
        ...outcomeResult.data.map(o => ({ ...o, type: 'outcome' }))
    ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 10);

    return {
        totalIncome,
        totalOutcome,
        balance: totalIncome - totalOutcome,
        month: monthName,
        recentTransactions,
    };
};

const getDummyAIRecommendations = () => {
    return {
        message: "Ini adalah mode Tamu! Rekomendasi AI ini adalah contoh berdasarkan data fiktif.",
        tips: [
            "Jelajahi fitur-fitur aplikasi untuk melihat bagaimana Anda dapat mengelola keuangan.",
            "Data yang Anda lihat adalah contoh, data asli Anda akan aman setelah login/registrasi.",
            "Mode tamu ini bagus untuk memahami alur kerja sebelum membuat akun.",
            "Coba filter tanggal untuk melihat bagaimana data dapat dianalisis."
        ],
    };
};

module.exports = {
    getDummyIncome,
    getDummyOutcome,
    getDummyDashboardSummary,
    getDummyAIRecommendations,
    dummyIncomeCategories,
    dummyExpenseCategories,
};