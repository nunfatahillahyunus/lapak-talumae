function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
        } else {
            sidebar.classList.add('-translate-x-full');
        }
    }
}

function bukaModalKodeUnik() {
    const sidebar = document.getElementById('sidebarMenu');
    if(sidebar) sidebar.classList.add('-translate-x-full'); 
    
    const modal = document.getElementById('modalKodeUnik');
    if(!modal) return; 
    
    document.getElementById('inputKodeUnik').value = "";
    const pesanError = document.getElementById('pesanErrorKode');
    if (pesanError) pesanError.classList.add('hidden');
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 10);
}

function tutupModalKodeUnik() {
    const modal = document.getElementById('modalKodeUnik');
    if(!modal) return;
    
    modal.classList.add('opacity-0');
    modal.children[0].classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function validasiDanBukaAppSheet() {
    const inputKode = document.getElementById('inputKodeUnik').value.trim();
    const pesanError = document.getElementById('pesanErrorKode');
    const btnValidasi = document.getElementById('btnValidasi');

    if (!inputKode) {
        pesanError.innerText = "Kode unik tidak boleh kosong!";
        pesanError.classList.remove('hidden');
        return;
    }

    btnValidasi.innerText = "Mengecek...";
    btnValidasi.disabled = true;

    // Tarik langsung dari CSV utama
    const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=1489445987&single=true&output=csv";
    const URL_APPSHEET = "https://www.appsheet.com/start/8dcd40af-1089-4094-8890-7e286c51921a";

    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: function(results) {
            const isValid = results.data.some(toko => {
                const kode = toko["Kode Unik Toko"];
                return kode && (kode.trim().toLowerCase() === inputKode.toLowerCase());
            });

            if (isValid) {
                pesanError.classList.add('hidden');
                const urlTujuan = `${URL_APPSHEET}&defaults=%7B%22Kode%20Unik%22%3A%22${inputKode.toUpperCase()}%22%7D`;
                window.open(urlTujuan, "_blank");
                tutupModalKodeUnik();
            } else {
                pesanError.innerText = "Maaf, Kode Unik Anda tidak terdaftar!";
                pesanError.classList.remove('hidden');
            }
            btnValidasi.innerText = "Validasi & Masuk";
            btnValidasi.disabled = false;
        },
        error: function(error) {
            pesanError.innerText = "Terjadi kesalahan membaca data.";
            pesanError.classList.remove('hidden');
            btnValidasi.innerText = "Validasi & Masuk";
            btnValidasi.disabled = false;
        }
    });
}
