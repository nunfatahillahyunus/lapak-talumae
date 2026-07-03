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
                        renderKatalog(dataKatalogGlobal);
                    }

                    // --- FITUR AUTO-OPEN POPUP DARI TOMBOL KATEGORI ---
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

// ==========================================
// 4. FUNGSI MERAKIT TAMPILAN LIST KATALOG BARU
// ==========================================
function renderKatalog(data) {
    const wadah = document.getElementById("wadah-katalog");
    if (!wadah) return;

    // Memaksa tata letak menjadi list memanjang (override grid)
    wadah.className = "flex flex-col gap-4";
    
    let elemenHTML = "";

    // MENGURUTKAN TOKO BERDASARKAN ABJAD (A-Z)
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
        
        // Cari urutan index asli dari database global untuk memicu Popup yang tepat
        const originalIndex = dataKatalogGlobal.findIndex(t => t === toko);
        
        // MENGOLAH KATEGORI MENJADI TOMBOL ROUNDED (Kanan)
        const stringKategori = toko["Kategori Produk"] || "";
        const arrayKategori = stringKategori.split(',').map(kat => kat.trim()).filter(kat => kat);
        
        let badgeKategoriHTML = "";
        if(arrayKategori.length > 0) {
            arrayKategori.forEach(kat => {
                // Tautan menuju Popup spesifik kategori tersebut
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

        // MENYUSUN TAMPILAN ROUNDED RECTANGLE KESELURUHAN
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
