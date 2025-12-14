// // util/ajandaDatabase.js

// // database.js dosyasında initDatabase fonksiyonuyla oluşturduğumuz db bağlantısını kullanacağız
// import { initDatabase } from "./database";

// /**
//  * Not: 
//  * Bu dosyada sadece ajanda tablosuna ait CRUD işlemleri olacak.
//  * Tablo oluşturma işini database.js üstleniyor.
//  * Burada yapılan her işlemde önce initDatabase çağrılır -> var olan db bağlantısı döner.
//  */

// /**
//  * 1) Ajanda kaydı ekleme
//  * @param {object} kayit - Eklenecek ajanda kaydı
//  * kayit = { ogrenciId: number | null, isim: string, tarih: string, saat: string }
//  */
// export async function ajandaKayitEkle(kayit) {
//     const db = await initDatabase();
//     await db.runAsync(
//         `INSERT INTO ajanda (ogrenciId, isim, tarih, saat) VALUES (?, ?, ?, ?)`,
//         [kayit.ogrenciId, kayit.isim, kayit.tarih, kayit.saat]
//     );
//     const tumkay = await tumAjandaKayitlariniGetir();
//     console.log("ajandaDatabase_tüm ajanda kayıtları:", tumkay);
// }

// /**
//  * 2) Tüm ajanda kayıtlarını listeleme
//  * @returns {Array} Ajanda kayıtları
//  */
// export async function tumAjandaKayitlariniGetir() {
//     const db = await initDatabase();
//     const rows = await db.getAllAsync(`SELECT * FROM ajanda ORDER BY tarih, saat`);
//     return rows;
// }

// /**
//  * 3) Belirli bir günün kayıtlarını listeleme
//  * @param {string} tarih - YYYY-MM-DD formatında tarih
//  * @returns {Array} Ajanda kayıtları
//  */
// export async function gunlukAjandaGetir(tarih) {
//     const db = await initDatabase();
//     const rows = await db.getAllAsync(
//         `SELECT * FROM ajanda WHERE tarih = ? ORDER BY saat`,
//         [tarih]
//     );
//     return rows;
// }

// /**
//  * 4) Ajanda kaydı güncelleme
//  * @param {number} id - Güncellenecek kaydın Id’si
//  * @param {object} kayit - Güncellenmiş veriler
//  * kayit = { ogrenciId: number | null, isim: string, tarih: string, saat: string }
//  */
// export async function ajandaGuncelle(id, kayit) {
//     const db = await initDatabase();
//     await db.runAsync(
//         `UPDATE ajanda SET ogrenciId = ?, isim = ?, tarih = ?, saat = ? WHERE id = ?`,
//         [kayit.ogrenciId, kayit.isim, kayit.tarih, kayit.saat, id]
//     );
// }

// /**
//  * 5) Ajanda kaydı silme
//  * @param {number} id - Silinecek kaydın Id’si
//  */
// export async function ajandaSil(id) {
//     const db = await initDatabase();
//     await db.runAsync(
//         `DELETE FROM ajanda WHERE id = ?`,
//         [id]
//     );
// }

// /**
//  * 6) Belirli bir öğrenciye ait tüm kayıtları getirme
//  * @param {number} ogrenciId - Öğrencinin Id’si
//  */
// export async function ogrenciAjandaGetir(ogrenciId) {
//     const db = await initDatabase();
//     const rows = await db.getAllAsync(
//         `SELECT * FROM ajanda WHERE ogrenciId = ? ORDER BY tarih, saat`,
//         [ogrenciId]
//     );
//     const ajandaKayitlari = await db.getAllAsync(`select * from ajanda`)
//     console.log(ajandaKayitlari);
//     return rows;
// }


// utils/ajandaDatabase.js
// -----------------------------------------------------------------------------
// Ajanda tablosu CRUD işlemleri
// database.js'deki initDatabase fonksiyonuyla oluşturulmuş db bağlantısını kullanır
// -----------------------------------------------------------------------------

import { initDatabase } from "./database";

/**
 * Veritabanının hazır olduğundan emin olmak için yardımcı fonksiyon
 */
async function ensureDatabaseReady() {
    const db = await initDatabase();
    if (!db) {
        throw new Error('Veritabanı başlatılamadı');
    }
    return db;
}

/**
 * 1) Ajanda kaydı ekleme - Periyodik sistem
 * @param {object} kayit - Eklenecek ajanda kaydı
 * kayit = { 
 *   ogrenciId: number | null, 
 *   ogrAdsoyad: string, 
 *   tarih: string (YYYY-MM-DD), 
 *   saat: string (HH:MM),
 *   tekrarsayisi: number,
 *   kalanTekrarSayisi: number,
 *   olusmaAni: string
 * }
 */
export async function ajandaKayitEkle(kayit) {
    try {
        const db = await ensureDatabaseReady();

        const result = await db.runAsync(
            `INSERT INTO ajanda (ogrenciId, ogrAdsoyad, tarih, saat, tekrarsayisi, kalanTekrarSayisi, olusmaAni, tamamlanma, sutun1, sutun2) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                kayit.ogrenciId,
                kayit.ogrAdsoyad,
                kayit.tarih,
                kayit.saat,
                kayit.tekrarsayisi,
                kayit.kalanTekrarSayisi,
                kayit.olusmaAni,
                '', // tamamlanma durumu başlangıçta boş
                kayit.sutun1 || '',
                kayit.sutun2 || ''
            ]
        );

        console.log("Ajanda kaydı eklendi:", result.lastInsertRowId);
        return { success: true, insertId: result.lastInsertRowId };
    } catch (error) {
        console.error("ajandaDatabase_Ajanda kaydı eklenemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 2) Tüm ajanda kayıtlarını listeleme
 * @returns {Array} Ajanda kayıtları
 */
export async function tumAjandaKayitlariniGetir() {
    try {
        const db = await ensureDatabaseReady();
        const rows = await db.getAllAsync(
            `SELECT 
                a.*,
                o.ogrenciAd,
                o.ogrenciSoyad,
                o.ogrenciTel,
                o.aktifmi
             FROM ajanda a 
             LEFT JOIN ogrenciler o ON a.ogrenciId = o.ogrenciId 
             ORDER BY a.tarih, a.saat`
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Ajanda kayıtları getirilemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 3) Belirli bir günün kayıtlarını listeleme
 * @param {string} tarih - YYYY-MM-DD formatında tarih
 * @returns {Array} Ajanda kayıtları
 */
export async function gunlukAjandaGetir(tarih) {
    try {
        const db = await ensureDatabaseReady();
        const rows = await db.getAllAsync(
            `SELECT 
                a.*,
                o.ogrenciAd,
                o.ogrenciSoyad,
                o.ogrenciTel,
                o.aktifmi
             FROM ajanda a 
             LEFT JOIN ogrenciler o ON a.ogrenciId = o.ogrenciId 
             WHERE a.tarih = ? 
             ORDER BY a.saat`,
            [tarih]
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Günlük ajanda getirilemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 4) Ajanda kaydı güncelleme
 * @param {number} ajandaId - Güncellenecek kaydın Id'si
 * @param {object} kayit - Güncellenmiş veriler
 */
export async function ajandaGuncelle(ajandaId, kayit) {
    try {
        const db = await ensureDatabaseReady();
        const result = await db.runAsync(
            `UPDATE ajanda 
             SET ogrenciId = ?, ogrAdsoyad = ?, tarih = ?, saat = ?, 
                 tekrarsayisi = ?, kalanTekrarSayisi = ?, tamamlanma = ?
             WHERE ajandaId = ?`,
            [
                kayit.ogrenciId,
                kayit.ogrAdsoyad,
                kayit.tarih,
                kayit.saat,
                kayit.tekrarsayisi,
                kayit.kalanTekrarSayisi,
                kayit.tamamlanma || '',
                ajandaId
            ]
        );
        return { success: result.changes > 0 };
    } catch (error) {
        console.error("Ajanda güncellenemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 5) Tek ajanda kaydı silme
 * @param {number} ajandaId - Silinecek kaydın Id'si
 */
export async function ajandaSil(ajandaId) {
    try {
        const db = await ensureDatabaseReady();
        const result = await db.runAsync(
            `DELETE FROM ajanda WHERE ajandaId = ?`,
            [ajandaId]
        );
        return { success: result.changes > 0 };
    } catch (error) {
        console.error("Ajanda kaydı silinemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 6) Grup halinde kayıt silme (olusmaAni'ye göre)
 * @param {string} olusmaAni - Silinecek grubun oluşma anı
 */
export async function ajandaGrupSil(olusmaAni) {
    try {
        const db = await ensureDatabaseReady();
        const result = await db.runAsync(
            `DELETE FROM ajanda WHERE olusmaAni = ?`,
            [olusmaAni]
        );
        return { success: true, deletedCount: result.changes };
    } catch (error) {
        console.error("Ajanda grubu silinemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 7) Belirli bir öğrenciye ait tüm kayıtları getirme
 * @param {number} ogrenciId - Öğrencinin Id'si
 */
export async function ogrenciAjandaGetir(ogrenciId) {
    try {
        const db = await ensureDatabaseReady();
        const rows = await db.getAllAsync(
            `SELECT 
                a.*,
                o.ogrenciAd,
                o.ogrenciSoyad,
                o.ogrenciTel,
                o.aktifmi
             FROM ajanda a 
             LEFT JOIN ogrenciler o ON a.ogrenciId = o.ogrenciId 
             WHERE a.ogrenciId = ? 
             ORDER BY a.tarih, a.saat`,
            [ogrenciId]
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Öğrenci ajandası getirilemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 8) Belirli bir oluşma anına ait kayıtları getirme (grup işlemleri için)
 * @param {string} olusmaAni - Grubun oluşma anı
 */
export async function ajandaGrupGetir(olusmaAni) {
    try {
        const db = await ensureDatabaseReady();
        const rows = await db.getAllAsync(
            `SELECT 
                a.*,
                o.ogrenciAd,
                o.ogrenciSoyad,
                o.ogrenciTel,
                o.aktifmi
             FROM ajanda a 
             LEFT JOIN ogrenciler o ON a.ogrenciId = o.ogrenciId 
             WHERE a.olusmaAni = ? 
             ORDER BY a.tarih, a.saat`,
            [olusmaAni]
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Ajanda grubu getirilemedi:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 9) Seçili günden sonraki grup kayıtlarını güncelleme
 * Bu fonksiyon düzenleme yaparken kullanılacak
 * @param {string} olusmaAni - Grup oluşma anı
 * @param {string} seciliTarih - Düzenlenen kayıt tarihi (YYYY-MM-DD)
 * @param {number} yeniTekrarSayisi - Yeni tekrar sayısı
 * @param {string} yeniSaat - Yeni saat (HH:MM)
 * @param {number} yeniPeriyot - Yeni periyot (gün)
 */
export async function ajandaGrupGuncelle(olusmaAni, seciliTarih, yeniTekrarSayisi, yeniSaat, yeniPeriyot = 7) {
    try {
        const db = await ensureDatabaseReady();

        // 1) Seçili tarihten sonraki kayıtları sil
        await db.runAsync(
            `DELETE FROM ajanda WHERE olusmaAni = ? AND tarih > ?`,
            [olusmaAni, seciliTarih]
        );

        // 2) Seçili kaydın bilgilerini al
        const mevcutKayit = await db.getFirstAsync(
            `SELECT * FROM ajanda WHERE olusmaAni = ? AND tarih = ?`,
            [olusmaAni, seciliTarih]
        );

        if (!mevcutKayit) {
            throw new Error('Güncellenecek kayıt bulunamadı');
        }

        // 3) Seçili kaydı güncelle
        await db.runAsync(
            `UPDATE ajanda 
             SET saat = ?, tekrarsayisi = ?, kalanTekrarSayisi = ?
             WHERE olusmaAni = ? AND tarih = ?`,
            [yeniSaat, yeniTekrarSayisi, yeniTekrarSayisi, olusmaAni, seciliTarih]
        );

        // 4) Yeni periyodik kayıtları oluştur
        const baslangicTarihi = new Date(seciliTarih);

        for (let i = 1; i < yeniTekrarSayisi; i++) {
            const yeniTarih = new Date(baslangicTarihi);
            yeniTarih.setDate(baslangicTarihi.getDate() + (i * yeniPeriyot));

            const kalanTekrar = yeniTekrarSayisi - i;

            await db.runAsync(
                `INSERT INTO ajanda (ogrenciId, ogrAdsoyad, tarih, saat, tekrarsayisi, kalanTekrarSayisi, olusmaAni, tamamlanma, sutun1, sutun2) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    mevcutKayit.ogrenciId,
                    mevcutKayit.ogrAdsoyad,
                    yeniTarih.toISOString().split('T')[0],
                    yeniSaat,
                    yeniTekrarSayisi,
                    kalanTekrar,
                    olusmaAni,
                    '',
                    '',
                    ''
                ]
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Ajanda grup güncellemesi başarısız:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 10) Tek kayıt için tamamlanma durumu güncelleme
 * @param {number} ajandaId - Kayıt ID'si
 * @param {string} durum - Tamamlanma durumu (ör: 'tamamlandi', 'iptal', '')
 */
export async function ajandaTamamlanmaDurumuGuncelle(ajandaId, durum) {
    try {
        const db = await ensureDatabaseReady();
        const result = await db.runAsync(
            `UPDATE ajanda SET tamamlanma = ? WHERE ajandaId = ?`,
            [durum, ajandaId]
        );
        return { success: result.changes > 0 };
    } catch (error) {
        console.error("Tamamlanma durumu güncellenemedi:", error);
        return { success: false, error: error.message };
    }
}
/*  yeni bir guncelleme kodu baş*/


/**
 * Randevu güncelleme fonksiyonu
 * @param {Object} randevu - Güncellenmiş randevu objesi
 * @param {boolean} tumunuDegistir - true ise kalan tekrarları da güncelle
 */
export const randevuGuncelle = (randevu, tumunuDegistir = false) => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            if (tumunuDegistir) {
                // 🔹 Tüm kalan tekrarları sil
                tx.executeSql(
                    'DELETE FROM ajanda WHERE tekrarGrupId = ? AND tarih >= ?',
                    [randevu.tekrarGrupId, randevu.tarih],
                    (_, result) => console.log('Kalan tekrarlar silindi', result),
                    (_, error) => { console.error(error); return true; }
                );

                // 🔹 Yeni tekrarlar ekle
                const periyot = randevu.periyot.toLowerCase(); // gün/hafta/ay
                const tekrarSayisi = parseInt(randevu.kalanTekrarSayisi);

                for (let i = 0; i < tekrarSayisi; i++) {
                    let yeniTarih = new Date(randevu.tarih);
                    if (periyot === 'gün') yeniTarih.setDate(yeniTarih.getDate() + i);
                    else if (periyot === 'hafta') yeniTarih.setDate(yeniTarih.getDate() + i * 7);
                    else if (periyot === 'ay') yeniTarih.setMonth(yeniTarih.getMonth() + i);

                    const tarihStr = yeniTarih.toISOString().split('T')[0];

                    tx.executeSql(
                        `INSERT INTO ajanda (ogrenciId, ogrAdsoyad, tarih, saat, tekrarGrupId)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            randevu.ogrenciId || null,
                            randevu.ogrAdsoyad || '',
                            tarihStr,
                            randevu.saat,
                            randevu.tekrarGrupId
                        ]
                    );
                }
            } else {
                // 🔹 Sadece bu kayıt güncellenecek
                tx.executeSql(
                    `UPDATE ajanda
                     SET ogrenciId = ?, ogrAdsoyad = ?, tarih = ?, saat = ?, kalanTekrarSayisi = ?, periyot = ?
                     WHERE ajandaId = ?`,
                    [
                        randevu.ogrenciId || null,
                        randevu.ogrAdsoyad || '',
                        randevu.tarih,
                        randevu.saat,
                        randevu.kalanTekrarSayisi,
                        randevu.periyot,
                        randevu.ajandaId
                    ],
                    (_, result) => console.log('Randevu güncellendi', result),
                    (_, error) => { console.error(error); return true; }
                );
            }
        },
            (error) => {
                console.error('Transaction hatası:', error);
                reject(error);
            },
            () => resolve(true));
    });
};

/*yeni güncelleme kodu son*/
/**
 * 11) Tarih aralığındaki kayıtları getirme
 * @param {string} baslangicTarihi - YYYY-MM-DD formatında
 * @param {string} bitisTarihi - YYYY-MM-DD formatında
 */
export async function tarihAraligiAjandaGetir(baslangicTarihi, bitisTarihi) {
    try {
        const db = await ensureDatabaseReady();
        const rows = await db.getAllAsync(
            `SELECT 
                a.*,
                o.ogrenciAd,
                o.ogrenciSoyad,
                o.ogrenciTel,
                o.aktifmi
             FROM ajanda a 
             LEFT JOIN ogrenciler o ON a.ogrenciId = o.ogrenciId 
             WHERE a.tarih BETWEEN ? AND ?
             ORDER BY a.tarih, a.saat`,
            [baslangicTarihi, bitisTarihi]
        );
        console.log("ajandadatabase_başlangıç tarihi", bitisTarihi);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Tarih aralığı ajandası getirilemedi:", error);
        return { success: false, error: error.message };
    }
}