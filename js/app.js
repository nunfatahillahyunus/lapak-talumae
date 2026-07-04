// ==========================================
// 1. VARIABEL GLOBAL & DATABASE
// ==========================================
let dataKatalogGlobal = [];
let dataProdukGlobal = []; 

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=1489445987&single=true&output=csv";
const urlCSVProduk = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=263400492&single=true&output=csv";

// ==========================================
// 2. DETEKSI PARAMETER URL
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const kategoriAktif = urlParams.get('jenis'); 
const tokoBukaOtomatis = urlParams.get('toko');

document.addEventListener("DOMContentLoaded", () => {
    if (kategoriAktif) {
        const judulEl = document.getElementById("judul-kategori");
        const descEl = document.getElementById("deskripsi-kategori");
        if(judulEl) judulEl.innerText = "Kategori: " + kategoriAktif;
        if(descEl) descEl.innerText = "Menampilkan etalase warga yang menyediakan " + kategoriAktif + ".";
        document.title = kategoriAktif + " - Lapak Desa Talumae";
    }
});

function formatGambarDrive(urlDrive) {
    if (!urlDrive) return "https://via.placeholder.com/400x300?text=Tidak+Ada+Foto";
    const match = urlDrive.match(/([-\w]{25,})/);
    if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    return urlDrive;
}

// ==========================================
// 3. MESIN PENARIKAN DATA GANDA
// ==========================================
Papa.parse(urlCSV, {
    download: true,
    header: true,
    complete: function(resultsToko) {
        Papa.parse(urlCSVProduk, {
            download: true,
            header: true,
            complete: function(resultsProduk) {
                try {
                    let dataMentahToko = resultsToko.data;
                    dataProdukGlobal = resultsProduk.data;
                    
                    if (kategoriAktif) {
                        dataKatalogGlobal = dataMentahToko.filter(toko => {
                            const kategoriMentah = toko["Kategori Produk"];
                            if (!kategoriMentah) return false;
                            return kategoriMentah.toLowerCase().includes(kategoriAktif.trim().toLowerCase());
                        });
                    } else {
                        dataKatalogGlobal = dataMentahToko;
                    }
                    
                    const statusEl = document.getElementById("status-loading");
                    const wadahEl = document.getElementById("wadah-katalog");

                    if (!dataKatalogGlobal || dataKatalogGlobal.length === 0) {
                        if(statusEl) {
                            statusEl.innerText = "Belum ada lapak/toko untuk kategori ini.";
                            statusEl.classList.remove("animate-pulse");
                        }
                        return;
                    }
                    
                    if(statusEl) statusEl.classList.add("hidden");
                    if(wadahEl) {
                        wadahEl.classList.remove("hidden");
                        
                        // ===== LOGIKA SAKLAR TAMPILAN =====
                        // Jika masuk ke kategori spesifik, gunakan desain awal (Grid Gambar)
                        // Jika masuk ke Semua Katalog, gunakan desain baru (Daftar A-Z)
                        if (kategoriAktif) {
                            renderKatalogGrid(dataKatalogGlobal);
                        } else {
                            renderKatalogList(dataKatalogGlobal);
                        }
                        // ===================================
                    }

                    if (tokoBukaOtomatis) {
                        const targetToko = tokoBukaOtomatis.trim().toLowerCase(); 
                        const indexToko = dataKatalogGlobal.findIndex(t => {
                            const kode = (t["Kode Unik Toko"] || "").trim().toLowerCase();
                            const nama = (t["Nama Toko"] || "").trim().toLowerCase();
                            return kode === targetToko || nama === targetToko;
                        });
                        
                        if (indexToko !== -1) {
                            setTimeout(() => {
                                bukaPopup(indexToko);
                            }, 400); 
                        }
                    }

                } catch (error) {
                    if(document.getElementById("status-loading")) {
                        document.getElementById("status-loading").innerText = "Error memproses data.";
                    }
                }
            },
            error: function() { 
                if(document.getElementById("status-loading")) document.getElementById("status-loading").innerText = "Gagal mengunduh data Produk."; 
            }
        });
    },
    error: function() { 
        if(document.getElementById("status-loading")) document.getElementById("status-loading").innerText = "Gagal mengunduh data Toko."; 
    }
});


// ==============================================================
// 4A. FUNGSI DESAIN LAMA (GRID GAMBAR - UNTUK KATEGORI SPESIFIK)
// ==============================================================
function renderKatalogGrid(data) {
    const wadah = document.getElementById("wadah-katalog");
    if (!wadah) return;

    wadah.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    let elemenHTML = "";

    data.forEach((toko) => {
        if(!toko["Nama Toko"]) return; 
        
        // Cari urutan asli untuk pop-up
        const originalIndex = dataKatalogGlobal.findIndex(t => t === toko);

        const namaToko = toko["Nama Toko"];
        const kategori = toko["Kategori Produk"];
        const deskripsiSingkat = toko["Deskripsi Singkat Toko"];
        const fotoSiapRender = formatGambarDrive(toko["Perwakilan Foto Produk / Etalase"]);
        const kodeUnikToko = toko["Kode Unik Toko"];
        
        let produkTokoIni = dataProdukGlobal.filter(p => p["Kode Unik Toko"] === kodeUnikToko);
        
        if (kategoriAktif) {
            produkTokoIni = produkTokoIni.filter(p => {
                const katProd = p["Kategori Produk"];
                if (!katProd) return false;
                return katProd.toLowerCase().includes(kategoriAktif.trim().toLowerCase());
            });
        }

        let arrayHarga = [];
        produkTokoIni.forEach(p => {
            let nominal = parseFloat(p["Harga (Rp)"]);
            if (!isNaN(nominal) && nominal > 0) arrayHarga.push(nominal);
        });

        let teksHarga = "Belum ada produk";
        let labelHarga = "Harga";

        if (arrayHarga.length > 0) {
            let hargaMin = Math.min(...arrayHarga);
            let hargaMax = Math.max(...arrayHarga);
            
            if (hargaMin === hargaMax) {
                teksHarga = "Rp " + hargaMin.toLocaleString('id-ID');
            } else {
                teksHarga = "Rp " + hargaMin.toLocaleString('id-ID') + " - Rp " + hargaMax.toLocaleString('id-ID');
                labelHarga = "Rentang Harga";
            }
        }

        elemenHTML += `
            <div class="kartu-toko bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <img src="${fotoSiapRender}" alt="${namaToko}" class="gambar-etalase w-full h-48 object-cover">
                <div class="p-5 flex-grow flex flex-col bg-white relative z-10">
                    <span class="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">LAPAK / TOKO</span>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">${namaToko}</h3>
                    <p class="text-xs text-gray-500 mb-3 leading-relaxed">${kategori || ''}</p>
                    <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">${deskripsiSingkat}</p>
                    <div class="mb-4">
                        <span class="text-sm text-gray-500">${labelHarga}</span><br>
                        <span class="text-lg font-bold text-green-700">${teksHarga}</span>
                    </div>
                    <button onclick="bukaPopup(${originalIndex})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                        Lihat Menu & Detail
                    </button>
                </div>
            </div>
        `;
    });

    wadah.innerHTML = elemenHTML;
}


// ==============================================================
// 4B. FUNGSI DESAIN BARU (DAFTAR A-Z - KHUSUS SEMUA KATALOG)
// ==============================================================
function renderKatalogList(data) {
    const wadah = document.getElementById("wadah-katalog");
    if (!wadah) return;

    wadah.className = "flex flex-col gap-4";
    let elemenHTML = "";

    const dataUrut = data.slice().sort((a, b) => {
        const namaA = (a["Nama Toko"] || "").toLowerCase();
        const namaB = (b["Nama Toko"] || "").toLowerCase();
        return namaA.localeCompare(namaB);
    });

    dataUrut.forEach((toko) => {
        if(!toko["Nama Toko"]) return; 

        const namaToko = toko["Nama Toko"];
        const deskripsiSingkat = toko["Deskripsi Singkat Toko"] || "Lapak warga Desa Talumae";
        const idToko = toko["Kode Unik Toko"] || namaToko;
        
        const originalIndex = dataKatalogGlobal.findIndex(t => t === toko);
        
        const stringKategori = toko["Kategori Produk"] || "";
        const arrayKategori = stringKategori.split(',').map(kat => kat.trim()).filter(kat => kat);
        
        let badgeKategoriHTML = "";
        if(arrayKategori.length > 0) {
            arrayKategori.forEach(kat => {
                const urlTujuan = `katalog.html?jenis=${encodeURIComponent(kat)}&toko=${encodeURIComponent(idToko)}`;
                badgeKategoriHTML += `
                    <a href="${urlTujuan}" class="inline-block bg-green-100 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 shadow-sm transition-colors whitespace-nowrap">
                        ${kat}
                    </a>
                `;
            });
        } else {
            badgeKategoriHTML = `<span class="text-xs text-gray-400 italic px-2 py-2">Tanpa kategori</span>`;
        }

        elemenHTML += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex-grow cursor-pointer group" onclick="bukaPopup(${originalIndex})">
                    <h3 class="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors flex items-center gap-2">
                        ${namaToko}
                        <svg class="w-5 h-5 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </h3>
                    <p class="text-sm text-gray-500 mt-1 line-clamp-1">${deskripsiSingkat}</p>
                </div>
                <div class="flex flex-wrap md:justify-end gap-2 shrink-0">
                    ${badgeKategoriHTML}
                </div>
            </div>
        `;
    });

    wadah.innerHTML = elemenHTML;
}


// ==========================================
// 5. FUNGSI BUKA POPUP (MODAL)
// ==========================================
function bukaPopup(index) {
    const toko = dataKatalogGlobal[index];
    if (!toko) return;

    document.getElementById('modal-nama').innerText = toko["Nama Toko"];
    document.getElementById('modal-kategori').innerText = toko["Kategori Produk"] || '';
    document.getElementById('modal-deskripsi').innerText = toko["Deskripsi Singkat Toko"];
    document.getElementById('modal-foto').src = formatGambarDrive(toko["Perwakilan Foto Produk / Etalase"]);

    const kodeUnikToko = toko["Kode Unik Toko"];
    
    const produkTokoIni = dataProdukGlobal.filter(p => {
        const matchKode = p["Kode Unik Toko"] === kodeUnikToko;
        if (!matchKode) return false;

        if (kategoriAktif) {
            const katProd = p["Kategori Produk"];
            if (!katProd) return false;
            return katProd.toLowerCase().includes(kategoriAktif.trim().toLowerCase());
        }
        return true; 
    });

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

    let arrayHarga = [];

    if (produkTokoIni.length > 0) {
        produkTokoIni.forEach((p, i) => {
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
    } else {
        htmlTabel += `
            <tr class="bg-white">
                <td colspan="2" class="px-4 py-6 text-center text-gray-500 italic">Belum ada produk yang diunggah untuk kategori ini.</td>
            </tr>
        `;
    }

    htmlTabel += `</tbody></table></div>`;
    document.getElementById('modal-list-barang').innerHTML = htmlTabel;
    
    let teksHargaModal = "Rp 0";
    let teksLabelModal = "Harga";
    
    if (arrayHarga.length > 0) {
        let hargaMin = Math.min(...arrayHarga);
        let hargaMax = Math.max(...arrayHarga);
        
        if (hargaMin === hargaMax) {
            teksHargaModal = "Rp " + hargaMin.toLocaleString('id-ID');
        } else {
            teksHargaModal = "Rp " + hargaMin.toLocaleString('id-ID') + " - Rp " + hargaMax.toLocaleString('id-ID');
            teksLabelModal = "Rentang Harga:";
        }
    }
    
    document.getElementById('modal-harga').innerText = teksHargaModal;
    if (document.getElementById('modal-label-harga')) {
        document.getElementById('modal-label-harga').innerText = teksLabelModal;
    }

    const namaAman = toko["Nama Toko"].replace(/'/g, "\\'"); 
    const nomorWA = toko["Nomor Whatsapp (62)"];
    document.getElementById('btn-modal-wa').setAttribute('onclick', `prosesBeli('${nomorWA}', '${namaAman}')`);

    const modal = document.getElementById('modal-detail');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
        modal.children[0].classList.add('scale-100');
    }, 10);
}

// ==========================================
// 6. FUNGSI TUTUP POPUP
// ==========================================
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
// 7. TRANSAKSI WHATSAPP
// ==========================================
function prosesBeli(nomorWA, namaToko) {
    if (!nomorWA || nomorWA === 'undefined') {
        alert("Maaf, penjual ini belum mencantumkan nomor WhatsApp.");
        return;
    }
    const nomorBersih = nomorWA.replace(/[^0-9]/g, ''); 
    const pesan = `Halo, saya melihat informasi dari website Lapak Desa Talumae. Saya tertarik dengan barang yang dijual di etalase *${namaToko}*. Apakah bisa dibantu informasi pemesanannya?`;
    const urlWA = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}`;
    window.open(urlWA, "_blank");
}
