// ==========================================
// 1. VARIABEL GLOBAL & DATABASE
// ==========================================
let dataKatalogGlobal = [];
let dataProdukGlobal = []; 

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=1489445987&single=true&output=csv";
const urlCSVProduk = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=263400492&single=true&output=csv";

// ==========================================
// 2. DETEKSI PARAMETER URL & ALAT BANTU
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

function bersihkanAngka(str) {
    if (!str) return 0;
    let bersih = str.toString().replace(/[^0-9]/g, '');
    let hasil = parseInt(bersih, 10);
    return isNaN(hasil) ? 0 : hasil;
}

function parseWaktuAppSheet(strTanggal) {
    if (!strTanggal) return NaN;
    let ms = new Date(strTanggal).getTime();
    if (!isNaN(ms)) return ms;

    const parts = strTanggal.split(/[\s/:-]+/);
    if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const hours = parts[3] ? parseInt(parts[3], 10) : 0;
        const minutes = parts[4] ? parseInt(parts[4], 10) : 0;
        const seconds = parts[5] ? parseInt(parts[5], 10) : 0;

        const manualDate = new Date(year, month, day, hours, minutes, seconds);
        return manualDate.getTime();
    }
    return NaN;
}

function ekstrakJam(strWaktu) {
    if (!strWaktu) return null;
    const match = strWaktu.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return {
            jam: parseInt(match[1], 10),
            menit: parseInt(match[2], 10),
            teksBersih: `${match[1].padStart(2, '0')}:${match[2]}`
        };
    }
    return null;
}

function cekStatusToko(stringHari, stringJamBuka, stringJamTutup) {
    if (!stringHari || !stringJamBuka || !stringJamTutup) return null; 

    const waktuBuka = ekstrakJam(stringJamBuka);
    const waktuTutup = ekstrakJam(stringJamTutup);
    
    if (!waktuBuka || !waktuTutup) return null;

    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const waktuSekarang = new Date();
    const hariIni = namaHari[waktuSekarang.getDay()]; 
    
    const hariBuka = stringHari.split(',').map(h => h.trim().toLowerCase());
    const isHariIniBuka = hariBuka.includes(hariIni.toLowerCase());

    const menitTotalSekarang = (waktuSekarang.getHours() * 60) + waktuSekarang.getMinutes();
    const menitTotalBuka = (waktuBuka.jam * 60) + waktuBuka.menit;
    const menitTotalTutup = (waktuTutup.jam * 60) + waktuTutup.menit;

    if (isHariIniBuka && menitTotalSekarang >= menitTotalBuka && menitTotalSekarang <= menitTotalTutup) {
        return { buka: true, pesan: "Buka Sekarang", bukaTeks: waktuBuka.teksBersih, tutupTeks: waktuTutup.teksBersih };
    } else {
        return { buka: false, pesan: "Sedang Tutup", bukaTeks: waktuBuka.teksBersih, tutupTeks: waktuTutup.teksBersih };
    }
}

// ==========================================
// 3. MESIN PENARIKAN DATA GANDA
// ==========================================
if (document.getElementById("wadah-katalog")) {
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
                                const arrayKat = kategoriMentah.split(',').map(k => k.trim().toLowerCase());
                                return arrayKat.includes(kategoriAktif.trim().toLowerCase());
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
                            if (kategoriAktif) renderKatalogGrid(dataKatalogGlobal);
                            else renderKatalogList(dataKatalogGlobal);
                        }

                        // [DIUBAH] Mengecek produk sebelum melakukan auto-popup
                        if (tokoBukaOtomatis) {
                            const targetToko = tokoBukaOtomatis.trim().toLowerCase(); 
                            const indexToko = dataKatalogGlobal.findIndex(t => {
                                const kode = (t["Kode Unik Toko"] || "").trim().toLowerCase();
                                const nama = (t["Nama Toko"] || "").trim().toLowerCase();
                                return kode === targetToko || nama === targetToko;
                            });
                            
                            if (indexToko !== -1) {
                                // Hitung produk untuk toko spesifik ini
                                const tokoTarget = dataKatalogGlobal[indexToko];
                                const kodeUnikTarget = tokoTarget["Kode Unik Toko"];
                                const produkTokoTarget = dataProdukGlobal.filter(p => p["Kode Unik Toko"] === kodeUnikTarget);
                                
                                // Hanya buka popup otomatis JIKA produk > 0
                                if (produkTokoTarget.length > 0) {
                                    setTimeout(() => { bukaPopup(indexToko); }, 400); 
                                }
                            }
                        }
                    } catch (error) {
                        if(document.getElementById("status-loading")) document.getElementById("status-loading").innerText = "Error memproses data.";
                    }
                },
                error: function() { if(document.getElementById("status-loading")) document.getElementById("status-loading").innerText = "Gagal mengunduh data Produk."; }
            });
        },
        error: function() { if(document.getElementById("status-loading")) document.getElementById("status-loading").innerText = "Gagal mengunduh data Toko."; }
    });
}

function renderKatalogGrid(data) {
    const wadah = document.getElementById("wadah-katalog");
    if (!wadah) return;

    wadah.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    let elemenHTML = "";

    data.forEach((toko) => {
        if(!toko["Nama Toko"]) return; 
        const originalIndex = dataKatalogGlobal.findIndex(t => t === toko);

        const namaToko = toko["Nama Toko"];
        const kategori = toko["Kategori Produk"];
        const deskripsiSingkat = toko["Deskripsi Singkat Toko"];
        const fotoSiapRender = formatGambarDrive(toko["Perwakilan Foto Produk / Etalase"]);
        const kodeUnikToko = toko["Kode Unik Toko"];
        
        const statusToko = cekStatusToko(toko["Hari Operasional"], toko["Jam Buka"], toko["Jam Tutup"]);
        let lencanaStatusHTML = "";
        
        if (statusToko) {
            if (statusToko.buka) {
                lencanaStatusHTML = `<div class="absolute top-3 right-3 bg-green-500 bg-opacity-90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-green-400"><span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> BUKA</div>`;
            } else {
                lencanaStatusHTML = `<div class="absolute top-3 right-3 bg-red-500 bg-opacity-90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-red-400"> TUTUP</div>`;
            }
        }
        
        let arrayHarga = [];
        let produkTokoIni = dataProdukGlobal.filter(p => p["Kode Unik Toko"] === kodeUnikToko);

        produkTokoIni.forEach(p => {
            let hargaNormal = bersihkanAngka(p["Harga (Rp)"] || p["Harga"]);
            let hargaPromo = bersihkanAngka(p["Harga Promo (Rp)"] || p["Harga Promo"]);
            let statusPromo = (p["Ada Promo?"] || p["Ada Promo"] || p["Promo"] || "").toString().trim().toUpperCase();
            
            let isPromoAktif = (statusPromo === "TRUE" || statusPromo === "Y" || statusPromo === "YES" || statusPromo === "YA" || statusPromo === "BENAR" || statusPromo === "1" || statusPromo === "ON");
            let hargaAkhir = hargaNormal;

            if (isPromoAktif && hargaPromo > 0) {
                let waktuMulai = parseWaktuAppSheet(p["Waktu Mulai Promo"] || p["Waktu Mulai"]);
                let waktuAkhir = parseWaktuAppSheet(p["Waktu Berakhir Promo"] || p["Waktu Berakhir"]);
                let waktuSekarang = new Date().getTime();
                
                let isMulaiValid = isNaN(waktuMulai) || waktuSekarang >= waktuMulai;
                let isAkhirValid = isNaN(waktuAkhir) || waktuSekarang <= waktuAkhir;

                if (isMulaiValid && isAkhirValid) hargaAkhir = hargaPromo; 
            }
            if (hargaAkhir > 0) arrayHarga.push(hargaAkhir);
        });

        let blokHargaHTML = "";
        let tombolAksiHTML = "";

        if (produkTokoIni.length > 0) {
            let teksHarga = "Informasi Harga Belum Tersedia";
            let labelHarga = "Harga Produk";

            if (arrayHarga.length > 0) {
                let hargaMin = Math.min(...arrayHarga);
                let hargaMax = Math.max(...arrayHarga);
                if (hargaMin === hargaMax) teksHarga = "Rp " + hargaMin.toLocaleString('id-ID');
                else {
                    teksHarga = "Rp " + hargaMin.toLocaleString('id-ID') + " - Rp " + hargaMax.toLocaleString('id-ID');
                    labelHarga = "Rentang Harga";
                }
            }
            
            blokHargaHTML = `
                <div class="mb-4">
                    <span class="text-sm text-gray-500">${labelHarga}</span><br>
                    <span class="text-lg font-bold text-green-700">${teksHarga}</span>
                </div>
            `;

            tombolAksiHTML = `
                <button onclick="bukaPopup(${originalIndex})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-sm mt-auto">
                    Lihat Detail Lapak
                </button>
            `;
        } else {
            let parameterFilter = kategoriAktif ? kategoriAktif : "Semua";
            if (!kategoriAktif && kategori) {
                const arrKat = kategori.split(',').map(k => k.trim()).filter(k => k);
                if (arrKat.length > 0) parameterFilter = arrKat[0];
            }
            let parameterToko = kodeUnikToko || namaToko;
            
            tombolAksiHTML = `
                <a href="peta.html?filter=${encodeURIComponent(parameterFilter)}&toko=${encodeURIComponent(parameterToko)}" class="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex justify-center items-center gap-2 shadow-sm block text-center">
                    📍 Lihat di Peta
                </a>
            `;
        }

        elemenHTML += `
            <div class="kartu-toko bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
                <div class="relative w-full h-48 overflow-hidden">
                    <img src="${fotoSiapRender}" alt="${namaToko}" class="gambar-etalase w-full h-full object-cover">
                    ${lencanaStatusHTML}
                </div>
                <div class="p-5 flex-grow flex flex-col bg-white relative z-10">
                    <span class="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">LAPAK / TOKO</span>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">${namaToko}</h3>
                    <p class="text-xs text-gray-500 mb-3 leading-relaxed">${kategori || ''}</p>
                    <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">${deskripsiSingkat || 'Belum ada deskripsi.'}</p>
                    
                    ${blokHargaHTML}
                    ${tombolAksiHTML}
                    
                </div>
            </div>
        `;
    });
    wadah.innerHTML = elemenHTML;
}

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
        const originalIndex = dataKatalogGlobal.findIndex(t => t === toko);
        const namaToko = toko["Nama Toko"];
        const deskripsiSingkat = toko["Deskripsi Singkat Toko"] || "Lapak warga Desa Talumae";
        const kodeUnikToko = toko["Kode Unik Toko"];
        const stringKategori = toko["Kategori Produk"] || "";
        
        const statusToko = cekStatusToko(toko["Hari Operasional"], toko["Jam Buka"], toko["Jam Tutup"]);
        let lencanaMiniHTML = "";
        if (statusToko) {
            if (statusToko.buka) lencanaMiniHTML = `<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-green-200">Buka</span>`;
            else lencanaMiniHTML = `<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-red-200">Tutup</span>`;
        }

        const arrayKategori = stringKategori.split(',').map(kat => kat.trim()).filter(kat => kat);
        let badgeKategoriHTML = "";
        if(arrayKategori.length > 0) {
            arrayKategori.forEach(kat => {
                badgeKategoriHTML += `<span class="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">${kat}</span>`;
            });
        }

        let produkTokoIni = dataProdukGlobal.filter(p => p["Kode Unik Toko"] === kodeUnikToko);
        
        let aksiKlikBaris = `onclick="bukaPopup(${originalIndex})"`;
        if (produkTokoIni.length === 0) {
            let parameterFilter = kategoriAktif ? kategoriAktif : "Semua";
            if (!kategoriAktif && stringKategori) {
                const arrKat = stringKategori.split(',').map(k => k.trim()).filter(k => k);
                if (arrKat.length > 0) parameterFilter = arrKat[0];
            }
            let parameterToko = kodeUnikToko || namaToko;
            aksiKlikBaris = `onclick="window.location.href='peta.html?filter=${encodeURIComponent(parameterFilter)}&toko=${encodeURIComponent(parameterToko)}'" title="Menuju Peta Lokasi"`;
        }

        elemenHTML += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group" ${aksiKlikBaris}>
                <div class="flex-grow">
                    <div class="flex items-center gap-3 mb-1">
                        <h3 class="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">${namaToko}</h3>
                        ${lencanaMiniHTML}
                        ${produkTokoIni.length === 0 ? '<span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">📍 Lihat Peta</span>' : ''}
                    </div>
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
// 5. FUNGSI BUKA POPUP & DETAIL TOKO
// ==========================================
function bukaPopup(index) {
    const toko = dataKatalogGlobal[index];
    if (!toko) return;

    document.getElementById('modal-nama').innerText = toko["Nama Toko"];
    document.getElementById('modal-kategori').innerText = toko["Kategori Produk"] || '';
    document.getElementById('modal-deskripsi').innerText = toko["Deskripsi Singkat Toko"];
    document.getElementById('modal-foto').src = formatGambarDrive(toko["Perwakilan Foto Produk / Etalase"]);

    const stringPembayaran = toko["Metode Pembayaran"] || "Tunai";
    const arrayPembayaran = stringPembayaran.split(',').map(p => p.trim()).filter(p => p);
    let htmlPembayaran = "";
    arrayPembayaran.forEach(metode => {
        let ikon = "💵"; 
        const metodeKecil = metode.toLowerCase();
        if (metodeKecil.includes("qris")) ikon = "📱";
        else if (metodeKecil.includes("transfer") || metodeKecil.includes("bank") || metodeKecil.includes("bca") || metodeKecil.includes("bri")) ikon = "🏦";
        else if (metodeKecil.includes("ewallet") || metodeKecil.includes("dana") || metodeKecil.includes("ovo") || metodeKecil.includes("gopay") || metodeKecil.includes("shopeepay")) ikon = "📲";

        htmlPembayaran += `<span class="bg-white text-blue-700 border border-blue-200 shadow-sm text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><span class="text-sm">${ikon}</span> ${metode}</span>`;
    });
    const wadahPembayaran = document.getElementById('modal-pembayaran');
    if (wadahPembayaran) wadahPembayaran.innerHTML = htmlPembayaran;

    const wadahJadwal = document.getElementById('modal-jadwal');
    const statusToko = cekStatusToko(toko["Hari Operasional"], toko["Jam Buka"], toko["Jam Tutup"]);
    
    if (statusToko && wadahJadwal) {
        let warnaTeks = statusToko.buka ? "text-green-600" : "text-red-500";
        let ikonStatus = statusToko.buka ? "🟢" : "🔴";

        wadahJadwal.innerHTML = `
            <div class="mb-5 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">🕒 Info Operasional Lapak</p>
                <p class="text-base font-bold ${warnaTeks} mb-1">${ikonStatus} ${statusToko.pesan}</p>
                <p class="text-sm text-gray-700"><strong>Hari:</strong> ${toko["Hari Operasional"]}</p>
                <p class="text-sm text-gray-700"><strong>Jam:</strong> ${statusToko.bukaTeks} WITA - ${statusToko.tutupTeks} WITA</p>
            </div>
        `;
        wadahJadwal.classList.remove("hidden");
    } else if (wadahJadwal) {
        wadahJadwal.classList.add("hidden"); 
    }

    const kodeUnikToko = toko["Kode Unik Toko"];
    const produkTokoIni = dataProdukGlobal.filter(p => p["Kode Unik Toko"] === kodeUnikToko);

    let htmlTabel = "";
    let arrayHarga = [];
    const wadahTabelProduk = document.getElementById('modal-list-barang');

    if (produkTokoIni.length > 0) {
        wadahTabelProduk.parentElement.classList.remove('hidden');
        htmlTabel = `
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

        produkTokoIni.forEach((p, i) => {
            const bgColor = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            let hargaNormal = bersihkanAngka(p["Harga (Rp)"] || p["Harga"]);
            let hargaPromo = bersihkanAngka(p["Harga Promo (Rp)"] || p["Harga Promo"]);
            let statusPromo = (p["Ada Promo?"] || p["Ada Promo"] || p["Promo"] || "").toString().trim().toUpperCase();
            let isPromoAktif = (statusPromo === "TRUE" || statusPromo === "Y" || statusPromo === "YES" || statusPromo === "YA" || statusPromo === "BENAR" || statusPromo === "1" || statusPromo === "ON");
            
            let isPromoBerlaku = false;
            let hargaAkhir = hargaNormal;

            if (isPromoAktif && hargaPromo > 0) {
                let waktuMulai = parseWaktuAppSheet(p["Waktu Mulai Promo"] || p["Waktu Mulai"]);
                let waktuAkhir = parseWaktuAppSheet(p["Waktu Berakhir Promo"] || p["Waktu Berakhir"]);
                let waktuSekarang = new Date().getTime();

                let isMulaiValid = isNaN(waktuMulai) || waktuSekarang >= waktuMulai;
                let isAkhirValid = isNaN(waktuAkhir) || waktuSekarang <= waktuAkhir;

                if (isMulaiValid && isAkhirValid) {
                    isPromoBerlaku = true;
                    hargaAkhir = hargaPromo;
                }
            }

            if (hargaAkhir > 0) arrayHarga.push(hargaAkhir);

            let tampilanHarga = "";
            if (isPromoBerlaku) {
                tampilanHarga = `
                    <div class="flex flex-col items-end">
                        <span class="text-[10px] text-red-400 line-through leading-tight">Rp ${hargaNormal.toLocaleString('id-ID')}</span>
                        <span class="text-green-700 font-bold text-base leading-tight">Rp ${hargaPromo.toLocaleString('id-ID')}</span>
                        <span class="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 shadow-sm uppercase tracking-wider animate-pulse">Promo!</span>
                    </div>
                `;
            } else {
                tampilanHarga = `<span class="text-green-700 font-semibold">Rp ${hargaNormal ? hargaNormal.toLocaleString('id-ID') : "0"}</span>`;
            }

            htmlTabel += `
                <tr class="${bgColor} border-b hover:bg-green-50 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-900 align-middle">${p["Nama Produk"] || '-'}</td>
                    <td class="px-4 py-3 text-right align-middle">${tampilanHarga}</td>
                </tr>
            `;
        });
        htmlTabel += `</tbody></table></div>`;
        wadahTabelProduk.innerHTML = htmlTabel;
    } else {
        wadahTabelProduk.parentElement.classList.add('hidden');
        wadahTabelProduk.innerHTML = "";
    }
    
    let teksHargaModal = "Harga Tersedia";
    let teksLabelModal = "Informasi Harga:";
    if (arrayHarga.length > 0) {
        let hargaMin = Math.min(...arrayHarga);
        let hargaMax = Math.max(...arrayHarga);
        if (hargaMin === hargaMax) teksHargaModal = "Rp " + hargaMin.toLocaleString('id-ID');
        else {
            teksHargaModal = "Rp " + hargaMin.toLocaleString('id-ID') + " - Rp " + hargaMax.toLocaleString('id-ID');
            teksLabelModal = "Rentang Harga:";
        }
    }
    document.getElementById('modal-harga').innerText = teksHargaModal;
    if (document.getElementById('modal-label-harga')) document.getElementById('modal-label-harga').innerText = teksLabelModal;

    const tombolAksi = document.getElementById('btn-modal-wa');
    const nomorWA = toko["Nomor Whatsapp (62)"];
    const lokasiToko = toko["Lokasi Toko"];
    const namaAman = toko["Nama Toko"].replace(/'/g, "\\'"); 

    if (nomorWA && nomorWA.toString().trim() !== '' && nomorWA !== 'undefined') {
        tombolAksi.innerHTML = `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> Hubungi Penjual`;
        tombolAksi.className = "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors flex items-center shadow-md shadow-green-200";
        tombolAksi.setAttribute('onclick', `prosesBeli('${nomorWA}', '${namaAman}')`);
        tombolAksi.style.display = 'flex';
    } else if (lokasiToko && lokasiToko.includes(',')) {
        const kordinat = lokasiToko.split(',');
        const lat = kordinat[0].trim();
        const lng = kordinat[1].trim();
        tombolAksi.innerHTML = `📍 Lihat Lokasi Lapak`;
        tombolAksi.className = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors flex items-center shadow-md shadow-blue-200";
        tombolAksi.setAttribute('onclick', `window.open('https://www.google.com/maps?q=${lat},${lng}', '_blank')`);
        tombolAksi.style.display = 'flex';
    } else {
        tombolAksi.style.display = 'none';
    }

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

function prosesBeli(nomorWA, namaToko) {
    if (!nomorWA || nomorWA === 'undefined') return;
    const nomorBersih = nomorWA.replace(/[^0-9]/g, ''); 
    const pesan = `Halo, saya melihat informasi dari website Lapak Desa Talumae. Saya tertarik dengan barang yang dijual di etalase *${namaToko}*. Apakah bisa dibantu informasi pemesanannya?`;
    const urlWA = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}`;
    window.open(urlWA, "_blank");
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        if (sidebar.classList.contains('-translate-x-full')) sidebar.classList.remove('-translate-x-full');
        else sidebar.classList.add('-translate-x-full');
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
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.children[0].classList.remove('scale-95'); }, 10);
}

function tutupModalKodeUnik() {
    const modal = document.getElementById('modalKodeUnik');
    if(!modal) return;
    modal.classList.add('opacity-0');
    modal.children[0].classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
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
        error: function(err) {
            pesanError.innerText = "Gagal memuat data dari server.";
            pesanError.classList.remove('hidden');
            btnValidasi.innerText = "Validasi & Masuk";
            btnValidasi.disabled = false;
        }
    });
}
