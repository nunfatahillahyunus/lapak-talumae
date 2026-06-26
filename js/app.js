let dataKatalogGlobal = [];
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_Sh6mxIZFs_BdXP7zXCuEiU_FiuVcjrchMm5X8cPq8HXn2DZ2X2OQA_ObHxdVLer3dWwGdi5WVmq/pub?gid=989510176&single=true&output=csv";

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
        const idGambar = match[1];
        return `https://drive.google.com/thumbnail?id=${idGambar}&sz=w800`;
    }
    return urlDrive;
}

Papa.parse(urlCSV, {
    download: true,
    header: true,
    complete: function(results) {
        try {
            let dataMentah = results.data;
            
            if (kategoriAktif) {
                // Menggunakan .includes() karena data dari Checkboxes bisa berupa "Olahan Makanan, Olahan Minuman"
                dataKatalogGlobal = dataMentah.filter(produk => 
                    produk["Kategori Produk"] && produk["Kategori Produk"].includes(kategoriAktif)
                );
            } else {
                dataKatalogGlobal = dataMentah;
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
            document.getElementById("status-loading").innerText = "Error membaca data: Pastikan nama kolom di Google Sheets persis sama. Error: " + error.message;
            document.getElementById("status-loading").classList.remove("animate-pulse");
        }
    }
});

function renderKatalog(data) {
    const wadah = document.getElementById("wadah-katalog");
    let elemenHTML = "";

    data.forEach((produk, index) => {
        // Abaikan baris kosong
        if(!produk["Nama Toko"]) return; 

        // Pemetaan variabel sesuai kolom form baru
        const namaToko = produk["Nama Toko"];
        const kategori = produk["Kategori Produk"];
        const deskripsiSingkat = produk["Deskripsi Singkat Toko"];
        const fotoAsli = produk["Perwakilan Foto Produk / Etalase"];
        
        let hargaMentah = produk["Harga Terendah Produk (Rp)"];
        let harga = hargaMentah ? parseFloat(hargaMentah).toLocaleString('id-ID') : "0";
        
        const fotoSiapRender = formatGambarDrive(fotoAsli);

        elemenHTML += `
            <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <img src="${fotoSiapRender}" alt="${namaToko}" class="w-full h-48 object-cover">
                
                <div class="p-5 flex-grow flex flex-col">
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

function bukaPopup(index) {
    const produk = dataKatalogGlobal[index];
    if (!produk) return;

    // Memasukkan data ke Modal
    document.getElementById('modal-nama').innerText = produk["Nama Toko"];
    document.getElementById('modal-kategori').innerText = produk["Kategori Produk"] || '';
    document.getElementById('modal-deskripsi').innerText = produk["Deskripsi Singkat Toko"];
    document.getElementById('modal-list-barang').innerText = produk["List Barang yang terjual"] || "Tidak ada daftar barang detail.";
    
    let hargaMentah = produk["Harga Terendah Produk (Rp)"];
    document.getElementById('modal-harga').innerText = "Rp " + (hargaMentah ? parseFloat(hargaMentah).toLocaleString('id-ID') : "0");
    
    document.getElementById('modal-foto').src = formatGambarDrive(produk["Perwakilan Foto Produk / Etalase"]);

    const namaAman = produk["Nama Toko"].replace(/'/g, "\\'"); 
    const nomorWA = produk["Nomor Whatsapp (62)"];
    document.getElementById('btn-modal-wa').setAttribute('onclick', `prosesBeli('${nomorWA}', '${namaAman}')`);

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
    const nomorBersih = nomorWA.replace(/[^0-9]/g, ''); 
    const pesan = `Halo, saya melihat informasi dari website Lapak Desa Lainungan. Saya tertarik dengan barang yang dijual di etalase *${namaToko}*. Apakah bisa dibantu informasi pemesanannya?`;
    const urlWA = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}`;
    
    window.open(urlWA, "_blank");
}
