// ==========================================
// 1. VARIABEL GLOBAL & DATABASE
// ==========================================
let dataKatalogGlobal = [];
let dataProdukGlobal = []; // Variabel baru untuk menampung seluruh produk

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=1489445987&single=true&output=csv";
// LINK CSV TABEL PRODUK BARU
const urlCSVProduk = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=263400492&single=true&output=csv";
const URL_APPSHEET = "https://www.appsheet.com/start/8dcd40af-1089-4094-8890-7e286c51921a";

// ==========================================
// 2. DETEKSI PARAMETER URL & JUDUL
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const kategoriAktif = urlParams.get('jenis'); 

document.addEventListener("DOMContentLoaded", () => {
    if (kategoriAktif) {
        document.getElementById("judul-kategori").innerText = "Kategori: " + kategoriAktif;
        document.getElementById("deskripsi-kategori").innerText = "Menampilkan etalase warga yang menyediakan " + kategoriAktif + ".";
        document.title = kategoriAktif + " - Lapak Desa Lainungan";
    }
});

function formatGambarDrive(urlDrive) {
    if (!urlDrive) return "https://via.placeholder.com/400x300?text=Tidak+Ada+Foto";
    const match = urlDrive.match(/([-\w]{25,})/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
    return urlDrive;
}

// ==========================================
// 3. MESIN PENARIKAN DATA GANDA (TOKO & PRODUK)
// ==========================================
// Kita mengunduh data Toko terlebih dahulu...
Papa.parse(urlCSV, {
    download: true,
    header: true,
    complete: function(resultsToko) {
        // ...Setelah Toko sukses, langsung unduh data Produk
        Papa.parse(urlCSVProduk, {
            download: true,
            header: true,
            complete: function(resultsProduk) {
                try {
                    let dataMentahToko = resultsToko.data;
                    
                    // Simpan seluruh data produk ke memori global
                    dataProdukGlobal = resultsProduk.data;
                    
                    // Filter Toko seperti biasa
                    if (kategoriAktif) {
                        dataKatalogGlobal = dataMentahToko.filter(toko => {
                            const kategoriMentah = toko["Kategori Produk"];
                            if (!kategoriMentah) return false;
                            return kategoriMentah.toLowerCase().includes(kategoriAktif.trim().toLowerCase());
                        });
                    } else {
                        dataKatalogGlobal = dataMentahToko;
                    }
                    
                    if (!dataKatalogGlobal || dataKatalogGlobal.length === 0) {
                        document.getElementById("status-loading").innerText = "Belum ada lapak/toko untuk kategori " + (kategoriAktif || "ini") + " saat ini.";
                        document.getElementById("status-loading").classList.remove("animate-pulse");
                        return;
                    }
                    
                    document.getElementById("status-loading").classList.add("hidden");
                    document.getElementById("wadah-katalog").classList.remove("hidden");
                    
                    renderKatalog(dataKatalogGlobal);
                } catch (error) {
                    munculkanError("Error memproses data: " + error.message);
                }
            },
            error: function(err) { munculkanError("Gagal mengunduh data Produk."); }
        });
    },
    error: function(err) { munculkanError("Gagal mengunduh data Toko."); }
});

function munculkanError(pesan) {
    document.getElementById("status-loading").innerText = pesan;
    document.getElementById("status-loading").classList.remove("animate-pulse");
}

// ==========================================
// 4. FUNGSI MERAKIT KARTU KATALOG (BERANDA ETALASE)
// ==========================================
function renderKatalog(data) {
    const wadah = document.getElementById("wadah-katalog");
    let elemenHTML = "";

    data.forEach((toko, index) => {
        if(!toko["Nama Toko"]) return; 

        const namaToko = toko["Nama Toko"];
        const kategori = toko["Kategori Produk"];
        const deskripsiSingkat = toko["Deskripsi Singkat Toko"];
        const fotoSiapRender = formatGambarDrive(toko["Perwakilan Foto Produk / Etalase"]);
        
        // Pengecekan harga terendah statis dari tabel toko untuk tampilan kartu depan
        let hargaMentah = toko["Harga Terendah Produk (Rp)"];
        let harga = hargaMentah ? parseFloat(hargaMentah).toLocaleString('id-ID') : "0";

        elemenHTML += `
            <div class="kartu-toko bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <img src="${fotoSiapRender}" alt="${namaToko}" class="gambar-etalase w-full h-48 object-cover">
                <div class="p-5 flex-grow flex flex-col bg-white relative z-10">
                    <span class="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">LAPAK / TOKO</span>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">${namaToko}</h3>
                    <p class="text-xs text-gray-500 mb-3 leading-relaxed">${kategori || ''}</p>
                    <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">${deskripsiSingkat}</p>
                    <div class="mb-4">
                        <span class="text-sm text-gray-500">Mulai dari</span><br>
                        <span class="text-xl font-bold text-green-700">Rp ${harga}</span>
                    </div>
                    <button onclick="bukaPopup(${index})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                        Lihat Menu & Detail
                    </button>
                </div>
            </div>
        `;
    });

    wadah.innerHTML = elemenHTML;
}

// ==========================================
// 5. FUNGSI POPUP (MODAL) & PERAKITAN TABEL RELASIONAL
// ==========================================
function bukaPopup(index) {
    const toko = dataKatalogGlobal[index];
    if (!toko) return;

    document.getElementById('modal-nama').innerText = toko["Nama Toko"];
    document.getElementById('modal-kategori').innerText = toko["Kategori Produk"] || '';
    document.getElementById('modal-deskripsi').innerText = toko["Deskripsi Singkat Toko"];
    document.getElementById('modal-foto').src = formatGambarDrive(toko["Perwakilan Foto Produk / Etalase"]);

    const kodeUnikToko = toko["Kode Unik Toko"];
    
    // ----------------------------------------------------
    // INTI LOGIKA PENYARINGAN PRODUK & PEMBUATAN TABEL
    // ----------------------------------------------------
    const produkTokoIni = dataProdukGlobal.filter(p => {
        // Syarat 1: Kode Uniknya harus cocok dengan Toko yang sedang diklik
        const matchKode = p["Kode Unik Toko"] === kodeUnikToko;
        if (!matchKode) return false;

        // Syarat 2: Jika warga membuka kategori spesifik (misal: "Olahan Makanan"), 
        // pastikan produk ini juga berkategori sama!
        if (kategoriAktif) {
            const katProd = p["Kategori Produk"];
            if (!katProd) return false;
            return katProd.toLowerCase().includes(kategoriAktif.trim().toLowerCase());
        }
        return true; // Jika di halaman "Semua Etalase", loloskan semua produknya
    });

    // Merakit struktur dasar tabel menggunakan Tailwind
    let htmlTabel = `
        <div class="overflow-x-auto rounded-lg">
            <table class="w-full text-sm text-left text-gray-600">
                <thead class="text-xs text-gray-700 uppercase bg-green-50 border-b-2 border-green-200">
                    <tr>
                        <th scope="col" class="px-4 py-3 font-bold rounded-tl-lg">Nama Produk</th>
                        <th scope="col" class="px-4 py-3 font-bold text-right rounded-tr-lg">Harga (Rp)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let hargaTerendahDinamis = 0;

    if (produkTokoIni.length > 0) {
        let arrayHarga = [];
        
        // Looping untuk memasukkan setiap barang ke dalam baris tabel (<tr>)
        produkTokoIni.forEach((p, i) => {
            // Efek warna belang-belang (Zebra Cross) untuk baris ganjil/genap
            const bgColor = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            let nominalAngka = parseFloat(p["Harga (Rp)"]);
            let hargaTampil = nominalAngka ? nominalAngka.toLocaleString('id-ID') : "0";
            
            if (nominalAngka > 0) arrayHarga.push(nominalAngka);

            htmlTabel += `
                <tr class="${bgColor} border-b hover:bg-green-50 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-900">${p["Nama Produk"] || '-'}</td>
                    <td class="px-4 py-3 text-right text-green-700 font-semibold">${hargaTampil}</td>
                </tr>
            `;
        });
        
        // Kalkulasi Harga Terendah secara otomatis dari barang yang tampil
        if (arrayHarga.length > 0) {
            hargaTerendahDinamis = Math.min(...arrayHarga);
        }
    } else {
        // Jika tidak ada barang yang sesuai di kategori ini
        htmlTabel += `
            <tr class="bg-white">
                <td colspan="2" class="px-4 py-6 text-center text-gray-500 italic">Belum ada produk yang diunggah untuk kategori ini.</td>
            </tr>
        `;
    }

    htmlTabel += `</tbody></table></div>`;
    
    // Suntikkan tabel ke dalam HTML
    document.getElementById('modal-list-barang').innerHTML = htmlTabel;
    
    // Update teks Harga di modal secara dinamis
    document.getElementById('modal-harga').innerText = "Rp " + (hargaTerendahDinamis > 0 ? hargaTerendahDinamis.toLocaleString('id-ID') : "0");

    // ----------------------------------------------------
    // PERSIAPAN TOMBOL WHATSAPP
    // ----------------------------------------------------
    const namaAman = toko["Nama Toko"].replace(/'/g, "\\'"); 
    const nomorWA = toko["Nomor Whatsapp (62)"];
    document.getElementById('btn-modal-wa').setAttribute('onclick', `prosesBeli('${nomorWA}', '${namaAman}')`);

    // Munculkan Modal dengan Animasi
    const modal = document.getElementById('modal-detail');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
        modal.children[0].classList.add('scale-100');
    }, 10);
}

function tutupPopup() {
    const modal = document.getElementById('modal-detail');
    modal.classList.add('opacity-0');
    modal.children[0].classList.remove('scale-100');
    modal.children[0].classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('modal-foto').src = ""; 
    }, 300); 
}

// ==========================================
// 6. TRANSAKSI WHATSAPP
// ==========================================
function prosesBeli(nomorWA, namaToko) {
    const nomorBersih = nomorWA.replace(/[^0-9]/g, ''); 
    const pesan = `Halo, saya melihat informasi dari website Lapak Desa Lainungan. Saya tertarik dengan barang yang dijual di etalase *${namaToko}*. Apakah bisa dibantu informasi pemesanannya?`;
    const urlWA = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}`;
    window.open(urlWA, "_blank");
}

// ==========================================
// 7. SISTEM SLIDER MENU & LOGIN APPSHEET
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
    } else {
        sidebar.classList.add('-translate-x-full');
    }
}

function bukaModalKodeUnik() {
    document.getElementById('sidebarMenu').classList.add('-translate-x-full'); 
    const modal = document.getElementById('modalKodeUnik');
    if(!modal) return; // Mencegah error jika fungsi dipanggil di halaman yang tidak punya modal login
    
    document.getElementById('inputKodeUnik').value = "";
    document.getElementById('pesanErrorKode').classList.add('hidden');
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

    // Membaca ulang CSV Toko untuk Login (Bisa dibuat lebih efisien di masa depan)
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
