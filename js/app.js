// ==========================================
// 1. KONFIGURASI DATABASE (Link CSV)
// ==========================================
const URL_CSV_TOKO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=1489445987&single=true&output=csv";
const URL_CSV_PETANI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=282611667&single=true&output=csv";
const URL_CSV_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=843653380&single=true&output=csv";

// ==========================================
// 2. FUNGSI UMUM & HELPER
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
}

// Fungsi Download Paralel Cepat
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, { download: true, header: true, fastMode: true, complete: resolve, error: reject });
    });
}

// ==========================================
// 3. RUTING OTOMATIS (Deteksi Halaman Aktif)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const isHalamanKatalog = document.getElementById('wadah-katalog') !== null;
    const isHalamanPeta = document.getElementById('map') !== null;
    const isHalamanTani = document.getElementById('wadah-tani') !== null;

    if (isHalamanKatalog) initKatalog();
    if (isHalamanPeta) initPeta();
    if (isHalamanTani) initTani();
});


// ==========================================
// 4. LOGIKA KHUSUS HALAMAN KATALOG
// ==========================================
function initKatalog() {
    const urlParams = new URLSearchParams(window.location.search);
    const kategoriDicari = urlParams.get('jenis');
    const tokoDicari = urlParams.get('toko');

    if (kategoriDicari) {
        const elJudul = document.getElementById('judul-kategori');
        const elSub = document.getElementById('sub-judul-kategori');
        if (elJudul) elJudul.innerText = `Kategori: ${kategoriDicari}`;
        if (elSub) elSub.innerText = `Menampilkan etalase warga yang menyediakan ${kategoriDicari}.`;
    }

    fetchCSV(URL_CSV_TOKO).then(results => {
        const dataToko = results.data;
        let dataTersaring = [];

        dataToko.forEach(toko => {
            const namaToko = toko["Nama Toko"];
            if (!namaToko || namaToko.trim() === "") return;

            const stringKategori = toko["Kategori Produk"] || "";
            const idToko = toko["Kode Unik Toko"] || namaToko;

            let masukKriteria = false;
            if (tokoDicari) {
                if (idToko.toLowerCase() === tokoDicari.toLowerCase() || namaToko.toLowerCase() === tokoDicari.toLowerCase()) masukKriteria = true;
            } else if (kategoriDicari) {
                if (stringKategori.toLowerCase().includes(kategoriDicari.toLowerCase())) masukKriteria = true;
            } else {
                masukKriteria = true;
            }

            if (masukKriteria) dataTersaring.push(toko);
        });

        renderKatalog(dataTersaring);
    }).catch(err => {
        const elLoading = document.getElementById('status-loading');
        if (elLoading) elLoading.innerHTML = `<span class="text-red-500 font-bold">Gagal memuat data. Periksa koneksi Anda.</span>`;
    });
}

function renderKatalog(data) {
    const elLoading = document.getElementById('status-loading');
    if (elLoading) elLoading.classList.add('hidden');
    
    const wadah = document.getElementById('wadah-katalog');
    const pesanKosong = document.getElementById('pesan-kosong');

    if (!wadah || !pesanKosong) return;

    if (data.length === 0) {
        pesanKosong.classList.remove('hidden');
        return;
    }

    wadah.classList.remove('hidden');
    let elemenHTML = "";

    data.forEach(toko => {
        const nama = toko["Nama Toko"];
        const pemilik = toko["Nama Pemilik"] || "Warga Talumae";
        const lokasi = toko["Lokasi Toko"];
        const wa = toko["Nomor Whatsapp (62)"];
        const kategori = toko["Kategori Produk"] || "Umum";
        const deskripsi = toko["Deskripsi Singkat"] || "Toko kelontong dan usaha warga desa.";

        let tombolWA = "";
        if (wa) {
            const nomorBersih = wa.toString().replace(/[^0-9]/g, '');
            const pesan = `Halo ${nama}, saya melihat toko Anda di website Lapak Desa Talumae. Saya ingin bertanya tentang produk Anda.`;
            tombolWA = `<a href="https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}" target="_blank" class="flex-1 bg-green-600 hover:bg-green-700 text-white text-center font-bold py-2 px-4 rounded-lg transition-colors shadow-sm text-sm flex items-center justify-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> Hubungi</a>`;
        }

        let tombolPeta = "";
        if (lokasi && lokasi.includes(',')) {
            tombolPeta = `<a href="peta.html?toko=${encodeURIComponent(nama)}" class="flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-center font-bold py-2 px-3 rounded-lg transition-colors shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></a>`;
        }

        const labelKategori = kategori.split(',')[0].trim();

        // Desain Kartu Tanpa Foto
        elemenHTML += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col group">
                <div class="bg-yellow-50 px-5 py-4 border-b border-yellow-100 flex justify-between items-center">
                    <span class="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-md uppercase shadow-sm">${labelKategori}</span>
                    <span class="text-2xl opacity-70 group-hover:scale-110 transition-transform">🏪</span>
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold text-gray-900 leading-tight mb-1 group-hover:text-green-700 transition-colors">${nama}</h3>
                    <p class="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">👤 Bpk/Ibu ${pemilik}</p>
                    <p class="text-sm text-gray-600 mb-5 line-clamp-3 flex-grow leading-relaxed">${deskripsi}</p>
                    <div class="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                        ${tombolWA}
                        ${tombolPeta}
                    </div>
                </div>
            </div>
        `;
    });

    wadah.innerHTML = elemenHTML;
}


// ==========================================
// 5. LOGIKA KHUSUS HALAMAN PETA
// ==========================================
let petaLeaflet, layerGrupMarker;
let dataTokoPeta = [], dataTaniPeta = [];
let kategoriAktif = [], markerLokasiSaya = null, circleLokasiSaya = null;
let targetTokoBukaPopup = null;

const KATEGORI_WARNA = {
    "Makanan": "#ef4444", "Minuman": "#3b82f6", "Bengkel": "#4b5563",
    "Kelontong": "#eab308", "Konter Pulsa": "#8b5cf6", "Laundry": "#0ea5e9",
    "ATK": "#d946ef", "Makanan Hewan": "#f97316", "Kosmetik": "#ec4899",
    "Alat & Bahan Pertanian": "#14b8a6", "Pakaian": "#f43f5e", "Hasil Tani": "#22c55e"
};
const WARNA_DEFAULT = "#6b7280";

function initPeta() {
    const urlParamsPeta = new URLSearchParams(window.location.search);
    targetTokoBukaPopup = urlParamsPeta.get('toko'); 
    const filterDariURL = urlParamsPeta.get('filter');

    petaLeaflet = L.map('map').setView([-3.925302, 119.891833], 14);
    L.tileLayer('http://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '© Google Maps'
    }).addTo(petaLeaflet);
    layerGrupMarker = L.layerGroup().addTo(petaLeaflet);

    petaLeaflet.on('locationfound', function(e) {
        const radius = e.accuracy / 2;
        if (markerLokasiSaya) petaLeaflet.removeLayer(markerLokasiSaya);
        if (circleLokasiSaya) petaLeaflet.removeLayer(circleLokasiSaya);
        const ikonLokasi = L.divIcon({ className: "bg-transparent", html: `<div class="w-4 h-4 bg-blue-600 border-[3px] border-white rounded-full shadow-md animate-pulse"></div>`, iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10] });
        markerLokasiSaya = L.marker(e.latlng, {icon: ikonLokasi}).addTo(petaLeaflet).bindPopup(`<strong>Lokasi Anda</strong>`).openPopup();
        circleLokasiSaya = L.circle(e.latlng, radius, { color: '#3b82f6', fillOpacity: 0.15, weight: 1 }).addTo(petaLeaflet);
    });

    fetch('data/Batas_Dusun_Talumae.geojson').then(r => r.json()).then(geo => {
        const pol = L.geoJSON(geo, { style: { color: '#4ade80', weight: 4, dashArray: '6, 6', fillColor: '#ffffff', fillOpacity: 0.1 } }).addTo(petaLeaflet);
        petaLeaflet.fitBounds(pol.getBounds());
    }).catch(e => console.log("GeoJSON opsional tidak ditemukan."));

    Promise.all([fetchCSV(URL_CSV_TOKO), fetchCSV(URL_CSV_PETANI), fetchCSV(URL_CSV_PRODUK)])
        .then(([resToko, resProfilPetani, resProdukTani]) => {
            dataTokoPeta = resToko.data;
            const profilPetani = resProfilPetani.data;
            const produkMentah = resProdukTani.data.filter(p => p["Nama Komoditas"] && p["Nama Komoditas"].trim() !== "");
            
            dataTaniPeta = [];
            produkMentah.forEach(produk => {
                const profilCocok = profilPetani.find(pt => pt["Kode Unik Toko"] === produk["Kode Unik Toko"]);
                if (profilCocok) dataTaniPeta.push({ ...profilCocok, ...produk });
            });

            if (filterDariURL) {
                if (Object.keys(KATEGORI_WARNA).includes(filterDariURL)) kategoriAktif.push(filterDariURL);
                else document.getElementById('input-cari-peta').value = filterDariURL;
            }
            renderTombolKategoriPeta();
            terapkanFilterPeta();

            const overlay = document.getElementById("data-loading-overlay");
            if (overlay) {
                overlay.classList.add("opacity-0");
                setTimeout(() => overlay.remove(), 500);
            }
        })
        .catch(err => {
            const overlay = document.getElementById("data-loading-overlay");
            if (overlay) overlay.innerHTML = `<span class="text-red-600 font-bold bg-white p-2 rounded">Gagal menyinkronkan data. Silakan muat ulang halaman.</span>`;
        });

    const inputCari = document.getElementById('input-cari-peta');
    if (inputCari) inputCari.addEventListener('input', terapkanFilterPeta);
}

function buatMarkerSVG(warnaHex) {
    return L.divIcon({
        className: "bg-transparent",
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.4));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${warnaHex}" stroke="#ffffff" stroke-width="1.5"/></svg>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36], popupAnchor: [0, -32] 
    });
}

function renderTombolKategoriPeta() {
    const wadah = document.getElementById('wadah-kategori-peta');
    if (!wadah) return;
    let html = "";
    Object.keys(KATEGORI_WARNA).forEach(kat => {
        const warnaPin = KATEGORI_WARNA[kat];
        const isAktif = kategoriAktif.includes(kat);
        const styleNormal = `border-color: ${warnaPin}; color: ${warnaPin}; background-color: transparent;`;
        const styleAktif = `border-color: ${warnaPin}; background-color: ${warnaPin}; color: white;`;
        html += `
            <button onclick="pilihKategoriPeta('${kat}')" class="border-2 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 focus:outline-none" style="${isAktif ? styleAktif : styleNormal}">
                <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: ${isAktif ? 'white' : warnaPin};"></span>${kat}
            </button>`;
    });
    wadah.innerHTML = html;
}

function pilihKategoriPeta(katDipilih) {
    const index = kategoriAktif.indexOf(katDipilih);
    if (index > -1) kategoriAktif.splice(index, 1);
    else kategoriAktif.push(katDipilih);
    renderTombolKategoriPeta();
    terapkanFilterPeta();
}

function cariLokasiSaya() {
    if (navigator.geolocation && petaLeaflet) petaLeaflet.locate({setView: true, maxZoom: 16});
    else alert("Browser Anda tidak mendukung GPS.");
}

function terapkanFilterPeta() {
    if (!layerGrupMarker) return;
    layerGrupMarker.clearLayers();
    
    const elInput = document.getElementById('input-cari-peta');
    const teksCari = elInput ? elInput.value.toLowerCase().trim() : "";

    const filterTeksAda = teksCari !== "";
    const filterKategoriAda = kategoriAktif.length > 0;

    if (!filterTeksAda && !filterKategoriAda) return;

    dataTokoPeta.forEach(toko => {
        const namaToko = toko["Nama Toko"] || "Toko Warga";
        const stringKategori = toko["Kategori Produk"] || "";
        const cocokTeks = (namaToko.toLowerCase().includes(teksCari) || stringKategori.toLowerCase().includes(teksCari));
        const cocokKategori = !filterKategoriAda ? true : kategoriAktif.some(kat => stringKategori.toLowerCase().includes(kat.toLowerCase()));

        let tampilkan = false;
        if (filterTeksAda && filterKategoriAda) tampilkan = cocokTeks && cocokKategori;
        else if (filterTeksAda) tampilkan = cocokTeks;
        else if (filterKategoriAda) tampilkan = cocokKategori;

        if (tampilkan) {
            const lokasi = toko["Lokasi Toko"];
            if (lokasi && lokasi.includes(',')) {
                const lat = parseFloat(lokasi.split(',')[0].trim());
                const lng = parseFloat(lokasi.split(',')[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    const idToko = toko["Kode Unik Toko"] || namaToko; 
                    const arrKat = stringKategori.split(',').map(k => k.trim()).filter(k => k);
                    
                    let warnaMarker = WARNA_DEFAULT;
                    const keyWarna = Object.keys(KATEGORI_WARNA).find(k => k.toLowerCase() === (arrKat[0] || "").toLowerCase());
                    if (keyWarna) warnaMarker = KATEGORI_WARNA[keyWarna];
                    
                    let tombolHTML = `<div class="flex flex-col gap-2 w-full mt-1">`;
                    if(arrKat.length > 0) arrKat.forEach(kat => tombolHTML += `<a href="katalog.html?jenis=${encodeURIComponent(kat)}&toko=${encodeURIComponent(idToko)}" class="inline-block w-full text-center bg-gray-50 hover:bg-green-600 text-gray-700 hover:text-white border border-gray-300 hover:border-green-600 font-bold py-1.5 px-3 rounded transition-colors text-xs shadow-sm">Buka Katalog ${kat}</a>`);
                    else tombolHTML += `<span class="text-xs text-gray-500 italic">Kategori belum ditentukan</span>`;
                    tombolHTML += `</div>`;

                    // Popup Peta Tanpa Foto
                    const popup = `
                        <div class="flex flex-col bg-white rounded-lg overflow-hidden min-w-[200px]">
                            <div class="p-4 border-b-4" style="border-color: ${warnaMarker}; background-color: #f9fafb;">
                                <h3 class="font-bold text-gray-900 text-lg leading-tight text-center">${namaToko}</h3>
                            </div>
                            <div class="p-4 text-center bg-white flex flex-col gap-2">
                                ${tombolHTML}
                                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="inline-block w-full bg-blue-600 hover:bg-blue-700 !text-white font-bold py-1.5 px-3 rounded transition-colors text-xs shadow-sm mt-1">📍 Buka Google Maps</a>
                            </div>
                        </div>`;
                    const marker = L.marker([lat, lng], { icon: buatMarkerSVG(warnaMarker) }).bindPopup(popup);
                    layerGrupMarker.addLayer(marker);
                    
                    if (targetTokoBukaPopup && (idToko.toLowerCase() === targetTokoBukaPopup.toLowerCase() || namaToko.toLowerCase() === targetTokoBukaPopup.toLowerCase())) {
                        setTimeout(() => { petaLeaflet.setView([lat, lng], 18); marker.openPopup(); targetTokoBukaPopup=null; }, 600); 
                    }
                }
            }
        }
    });

    const warnaTani = KATEGORI_WARNA["Hasil Tani"];
    dataTaniPeta.forEach(tani => {
        const kom = tani["Nama Komoditas"] || "Hasil Bumi";
        const pet = tani["Nama Petani"] || "Petani Lokal";
        const cocokTeks = (kom.toLowerCase().includes(teksCari) || pet.toLowerCase().includes(teksCari));
        const cocokKategori = !filterKategoriAda ? true : kategoriAktif.some(k => k.toLowerCase() === "hasil tani");

        let tampilkan = false;
        if (filterTeksAda && filterKategoriAda) tampilkan = cocokTeks && cocokKategori;
        else if (filterTeksAda) tampilkan = cocokTeks;
        else if (filterKategoriAda) tampilkan = cocokKategori;

        if (tampilkan) {
            const lokasi = tani["Lokasi Lahan"];
            if (lokasi && lokasi.includes(',')) {
                const lat = parseFloat(lokasi.split(',')[0].trim());
                const lng = parseFloat(lokasi.split(',')[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    // Popup Tani Tanpa Foto
                    const popup = `
                        <div class="flex flex-col bg-white rounded-lg overflow-hidden min-w-[200px]">
                            <div class="p-4 border-b-4 flex flex-col items-center" style="border-color: ${warnaTani}; background-color: #f0fdf4;">
                                <span class="text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm mb-2 inline-block" style="background-color: ${warnaTani};">Lahan Tani</span>
                                <h3 class="font-bold text-gray-900 text-lg leading-tight text-center">${kom}</h3>
                            </div>
                            <div class="p-4 text-center bg-white flex flex-col gap-2">
                                <p class="text-xs text-gray-500 mb-1">👤 ${pet}</p>
                                <div class="bg-green-50 border border-green-200 rounded p-2 mb-1">
                                    <p class="text-xs font-bold text-green-700">Stok: ${tani["Sisa Pangan Tersedia"]||"0"} ${tani["Satuan"]||""}</p>
                                </div>
                                <div class="flex flex-col gap-2 mt-1">
                                    <a href="tani.html" class="inline-block w-full bg-green-600 hover:bg-green-700 !text-white font-bold py-1.5 px-3 rounded transition-colors text-xs shadow-sm">🌾 Buka Bursa Tani</a>
                                </div>
                            </div>
                        </div>`;
                    layerGrupMarker.addLayer(L.marker([lat, lng], { icon: buatMarkerSVG(warnaTani) }).bindPopup(popup));
                }
            }
        }
    });
}

// ==========================================
// 6. LOGIKA KHUSUS HALAMAN HASIL TANI
// ==========================================
let dataTaniList = [];
let indexTaniAktif = null;

function initTani() {
    Promise.all([fetchCSV(URL_CSV_PETANI), fetchCSV(URL_CSV_PRODUK)])
        .then(([resPetani, resProduk]) => {
            const dataProfilPetani = resPetani.data;
            const dataProdukMentah = resProduk.data.filter(p => p["Nama Komoditas"] && p["Nama Komoditas"].trim() !== "");

            dataTaniList = [];
            dataProdukMentah.forEach(produk => {
                const profilCocok = dataProfilPetani.find(pt => pt["Kode Unik Toko"] === produk["Kode Unik Toko"]);
                if (profilCocok) dataTaniList.push({ ...profilCocok, ...produk });
            });

            const elLoading = document.getElementById("status-loading");
            if (elLoading) elLoading.classList.add("hidden");
            saringDataTani();
        })
        .catch(err => {
            const elLoading = document.getElementById("status-loading");
            if(elLoading) {
                elLoading.innerHTML = `<span class="text-red-500 font-bold">Gagal memuat data hasil tani.</span><br><span class="text-sm text-gray-500">Silakan periksa koneksi internet.</span>`;
                elLoading.classList.remove("animate-pulse");
            }
        });

    const inputCari = document.getElementById('input-cari');
    const filterJenis = document.getElementById('filter-jenis');
    if (inputCari) inputCari.addEventListener('input', saringDataTani);
    if (filterJenis) filterJenis.addEventListener('change', saringDataTani);
}

function saringDataTani() {
    const elInput = document.getElementById('input-cari');
    const elFilter = document.getElementById('filter-jenis');
    if (!elInput || !elFilter) return;

    const teksCari = elInput.value.toLowerCase().trim();
    const jenisPilih = elFilter.value.toLowerCase();

    const dataTersaring = dataTaniList.filter(tani => {
        const komoditas = (tani["Nama Komoditas"] || "").toLowerCase();
        const petani = (tani["Nama Petani"] || "").toLowerCase();
        const jenisMentah = (tani["Jenis Hasil Tani"] || "").toLowerCase();

        const cocokTeks = komoditas.includes(teksCari) || petani.includes(teksCari);
        let cocokJenis = true;
        if (jenisPilih !== "semua") cocokJenis = jenisMentah.includes(jenisPilih);

        return cocokTeks && cocokJenis;
    });

    renderTaniGrid(dataTersaring);
}

function renderTaniGrid(data) {
    const wadah = document.getElementById('wadah-tani');
    const pesanKosong = document.getElementById('pesan-kosong');
    if (!wadah || !pesanKosong) return;

    wadah.innerHTML = "";
    if (data.length === 0) {
        wadah.classList.add('hidden');
        pesanKosong.classList.remove('hidden');
        return;
    }

    wadah.classList.remove('hidden');
    pesanKosong.classList.add('hidden');

    let elemenHTML = "";
    data.forEach((tani) => {
        const originalIndex = dataTaniList.findIndex(t => t === tani);
        const komoditas = tani["Nama Komoditas"];
        const petani = tani["Nama Petani"] || "Petani Lokal";
        const jenis = tani["Jenis Hasil Tani"] || "Pangan";
        const sisaTersedia = tani["Sisa Pangan Tersedia"] || "0";
        const satuan = tani["Satuan"] || "Kg";

        // Desain Kartu Tani Tanpa Foto
        elemenHTML += `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer flex flex-col group" onclick="bukaPopupTani(${originalIndex})">
                <div class="bg-green-50 px-5 py-4 border-b border-green-100 flex justify-between items-center">
                    <span class="bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase shadow-sm opacity-90">${jenis}</span>
                    <span class="text-2xl opacity-70 group-hover:scale-110 transition-transform">🌾</span>
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold text-gray-900 leading-tight mb-1 group-hover:text-green-700 transition-colors">${komoditas}</h3>
                    <p class="text-sm text-gray-500 mb-5">👤 ${petani}</p>
                    <div class="mt-auto bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                        <span class="text-xs text-gray-500 font-semibold uppercase">Stok Tersedia</span>
                        <span class="text-lg font-bold text-green-700">${sisaTersedia} <span class="text-xs font-normal text-gray-600">${satuan}</span></span>
                    </div>
                </div>
            </div>`;
    });
    wadah.innerHTML = elemenHTML;
}

function bukaPopupTani(index) {
    const tani = dataTaniList[index];
    if (!tani) return;
    indexTaniAktif = index; 

    document.getElementById('modal-komoditas').innerText = tani["Nama Komoditas"];
    document.getElementById('modal-jenis').innerText = tani["Jenis Hasil Tani"] || "Pangan";
    document.getElementById('modal-petani').innerText = tani["Nama Petani"] || "Petani Lokal";
    
    const stringBulan = tani["Bulan Panen"] || "Belum ditentukan";
    const wadahBulan = document.getElementById('modal-bulan');
    if (stringBulan === "Belum ditentukan" || stringBulan.trim() === "") {
        wadahBulan.innerHTML = "Belum ditentukan";
    } else {
        const arrayBulan = stringBulan.split(',').map(b => b.trim()).filter(b => b);
        let htmlBulan = `<div class="flex flex-wrap gap-1 mt-0.5">`;
        arrayBulan.forEach(b => htmlBulan += `<span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-blue-200 shadow-sm">${b}</span>`);
        htmlBulan += `</div>`;
        wadahBulan.innerHTML = htmlBulan;
    }

    document.getElementById('modal-rata').innerText = tani["Rata-rata Panen"] || "-";
    document.getElementById('modal-saatini').innerText = tani["Panen Saat Ini"] || "-";
    document.getElementById('modal-sisa').innerText = tani["Sisa Pangan Tersedia"] || "0";

    const satuan = tani["Satuan"] || "";
    document.querySelectorAll('.satuan-teks').forEach(el => el.innerText = satuan);

    const btnPeta = document.getElementById('btn-modal-peta');
    const lokasi = tani["Lokasi Lahan"];
    if (lokasi && lokasi.includes(',')) {
        const kordinat = lokasi.split(',');
        btnPeta.setAttribute('onclick', `window.open('https://www.google.com/maps?q=${kordinat[0].trim()},${kordinat[1].trim()}', '_blank')`);
        btnPeta.style.display = 'flex';
    } else {
        btnPeta.style.display = 'none';
    }

    const btnWA = document.getElementById('btn-modal-wa');
    const nomorWA = tani["Nomor Whatsapp (62)"];
    if (nomorWA) {
        const nomorBersih = nomorWA.toString().replace(/[^0-9]/g, '');
        const pesan = `Halo Bapak/Ibu ${tani["Nama Petani"]}, saya melihat informasi di website Lapak Desa Talumae. Saya tertarik dengan ketersediaan ${tani["Nama Komoditas"]} Anda. Apakah bisa dibantu informasinya?`;
        btnWA.setAttribute('onclick', `window.open('https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}', '_blank')`);
        btnWA.style.display = 'flex';
        document.getElementById('btn-modal-penawaran').style.display = 'flex';
    } else {
        btnWA.style.display = 'none';
        document.getElementById('btn-modal-penawaran').style.display = 'none';
    }

    const modal = document.getElementById('modal-tani');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
        modal.children[0].classList.add('scale-100');
    }, 10);
}

function tutupPopupTani() {
    const modal = document.getElementById('modal-tani');
    modal.classList.add('opacity-0');
    modal.children[0].classList.remove('scale-100');
    modal.children[0].classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        indexTaniAktif = null;
    }, 300); 
}

function bukaModalPenawaran() {
    if (indexTaniAktif === null) return;
    const tani = dataTaniList[indexTaniAktif];
    document.getElementById('penawaran-target-petani').innerText = tani["Nama Petani"] || "Petani";
    document.getElementById('penawaran-target-komoditas').innerText = tani["Nama Komoditas"] || "Komoditas";
    document.getElementById('label-satuan-penawaran').innerText = tani["Satuan"] || "Unit";
    document.getElementById('error-penawaran').classList.add('hidden');
    
    const modal = document.getElementById('modal-penawaran');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
        modal.children[0].classList.add('scale-100');
    }, 10);
}

function tutupModalPenawaran() {
    const modal = document.getElementById('modal-penawaran');
    modal.classList.add('opacity-0');
    modal.children[0].classList.remove('scale-100');
    modal.children[0].classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300); 
}

function formatRupiah(angka) {
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function kirimPenawaranWA() {
    if (indexTaniAktif === null) return;
    const tani = dataTaniList[indexTaniAktif];
    const nomorWA = tani["Nomor Whatsapp (62)"];
    if (!nomorWA) return;

    const qty = document.getElementById('form-kuantitas').value.trim();
    const hrg = document.getElementById('form-harga').value.trim();
    const prsh = document.getElementById('form-perusahaan').value.trim();
    const eml = document.getElementById('form-email').value.trim();
    const telp = document.getElementById('form-telepon').value.trim();
    const prov = document.getElementById('form-provinsi').value.trim();
    const kab = document.getElementById('form-kabupaten').value.trim();
    const kec = document.getElementById('form-kecamatan').value.trim();
    const pos = document.getElementById('form-kodepos').value.trim();

    if (!qty || !hrg || !prsh || !eml || !telp || !prov || !kab || !kec) {
        document.getElementById('error-penawaran').classList.remove('hidden');
        return;
    }

    const nomorBersih = nomorWA.toString().replace(/[^0-9]/g, '');
    const hrgFormat = formatRupiah(hrg);
    const teksPesan = `Halo Bapak/Ibu *${tani["Nama Petani"]}*,\n\nPerkenalkan, saya dari *${prsh}*. Saya melihat informasi hasil tani Anda di Lapak Desa Talumae dan bermaksud mengajukan penawaran untuk komoditas *${tani["Nama Komoditas"]}*.\n\nBerikut rincian penawaran kami:\n- *Kuantitas Diminta:* ${qty} ${tani["Satuan"] || ""}\n- *Harga Penawaran:* Rp ${hrgFormat}\n\n📍 *Informasi Pengiriman / Kontak Kami:*\n- Email: ${eml}\n- Telepon: ${telp}\n- Alamat: Kec. ${kec}, Kab. ${kab}, Prov. ${prov} ${pos ? `(Kode Pos: ${pos})` : ''}\n\nApakah penawaran ini bisa didiskusikan lebih lanjut? Terima kasih.`;
    window.open(`https://wa.me/${nomorBersih}?text=${encodeURIComponent(teksPesan)}`, '_blank');
    tutupModalPenawaran();
}

// ==========================================
// 7. MODAL APPSHEET PENJUAL (Semua Halaman)
// ==========================================
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

    Promise.all([fetchCSV(URL_CSV_TOKO), fetchCSV(URL_CSV_PETANI)])
        .then(([resToko, resPetani]) => {
            const isValidToko = resToko.data.some(t => t["Kode Unik Toko"] && t["Kode Unik Toko"].trim().toLowerCase() === inputKode.toLowerCase());
            const isValidTani = resPetani.data.some(t => t["Kode Unik Toko"] && t["Kode Unik Toko"].trim().toLowerCase() === inputKode.toLowerCase());

            if (isValidToko || isValidTani) {
                pesanError.classList.add('hidden');
                window.open(`${URL_APPSHEET}&defaults=%7B%22Kode%20Unik%22%3A%22${inputKode.toUpperCase()}%22%7D`, "_blank");
                tutupModalKodeUnik();
            } else {
                pesanError.innerText = "Maaf, Kode Unik Anda tidak terdaftar!";
                pesanError.classList.remove('hidden');
            }
        })
        .catch(err => {
            pesanError.innerText = "Gagal menghubungi server validasi.";
            pesanError.classList.remove('hidden');
        })
        .finally(() => {
            btnValidasi.innerText = "Validasi & Masuk";
            btnValidasi.disabled = false;
        });
}
