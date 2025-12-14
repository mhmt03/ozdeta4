
//database.js
import * as SQLite from 'expo-sqlite';

let db = null;

// VERİTABANI VERSİYONU - Değişiklik yaptığınızda sadece bunu artırın!
const DATABASE_VERSION = 2;

export async function initDatabase() {
    try {
        if (db) {
            return db; // Zaten başlatılmışsa, mevcut bağlantıyı döndür
        }

        db = await SQLite.openDatabaseAsync('ozdeta.db');
        //db.execAsync(`drop table ajanda,odemeler,notlarim,odevler,kaynaklar`);
        // Version kontrolü ve migration işlemi
        await handleDatabaseMigration();

        console.log('Veritabanı başarıyla başlatıldı, versiyon:', DATABASE_VERSION);
        // await db.execAsync('drop table odemeler');
        // await db.execAsync('drop table dersler');
        // await db.execAsync('drop table odevler');
        // await db.execAsync('drop table notlarim');
        // await db.execAsync('drop table kaynaklar');

        /*  await db.execAsync(tabloOlusturucuV1);*/
        return db;
    } catch (error) {
        console.log("database_Veritabanı oluşturma hatası:", error);
        db = null;
        throw error;
    }
}

// Migration yönetim sistemi
async function handleDatabaseMigration() {
    try {
        // Önce tabloları oluştur (basitleştirilmiş versiyon)
        await db.execAsync(tabloOlusturucuV1);

        // Sonra version kontrolü yap
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS database_version (
                id INTEGER PRIMARY KEY,
                version INTEGER NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Mevcut versiyonu kontrol et
        let currentVersion = 0;
        try {
            const currentVersionResult = await db.getFirstAsync(
                'SELECT version FROM database_version ORDER BY id DESC LIMIT 1'
            );
            currentVersion = currentVersionResult ? currentVersionResult.version : 0;
        } catch (error) {
            console.log('Version tablosu henüz yok, oluşturuluyor...');
            currentVersion = 0;
        }

        console.log(`Mevcut veritabanı versiyonu: ${currentVersion}, Hedef versiyon: ${DATABASE_VERSION}`);

        if (currentVersion < DATABASE_VERSION) {
            console.log('Veritabanı güncelleniyor...');

            // Migration işlemlerini uygula
            for (let version = currentVersion + 1; version <= DATABASE_VERSION; version++) {
                await applyMigration(version);
                console.log(`Versiyon ${version} uygulandı`);
            }

            // Yeni versiyonu kaydet veya güncelle
            await db.runAsync(
                'INSERT OR REPLACE INTO database_version (id, version) VALUES (1, ?)',
                [DATABASE_VERSION]
            );

            console.log('Veritabanı güncelleme tamamlandı');
        } else {
            console.log('Veritabanı güncel');
        }
    } catch (error) {
        console.error('Migration hatası:', error);
        // Migration hatası olursa en azından tabloları oluşturmaya çalış
        try {
            await db.execAsync(tabloOlusturucuV1);
            console.log('Temel tablolar oluşturuldu');
        } catch (tableError) {
            console.error('Tablo oluşturma da başarısız:', tableError);
        }
        throw error;
    }
}

// Her versiyon için migration işlemlerini tanımla
async function applyMigration(version) {
    switch (version) {
        case 1:
            // İlk versiyon - tüm tabloları oluştur
            await db.execAsync(tabloOlusturucuV1);
            break;

        case 2:
            // Versiyon 2 - dersler tablosuna sutun1 ekleme
            try {
                await db.execAsync(`ALTER TABLE dersler ADD COLUMN sutun1 TEXT;`);
                console.log('dersler tablosuna sutun1 eklendi');
            } catch (error) {
                // Eğer sütun zaten varsa hata verme
                if (!error.message.includes('duplicate column name')) {
                    throw error;
                }
            }
            break;

        // case 3:
        //     // Versiyon 3 değişiklikleri
        //     await db.execAsync(`
        //         ALTER TABLE ogrenciler ADD COLUMN yeniSutun TEXT DEFAULT 'varsayilan';
        //     `);
        //     break;

        // case 4:
        //     // Versiyon 4 değişiklikleri
        //     await db.execAsync(`
        //         CREATE TABLE IF NOT EXISTS yeni_tablo (
        //             id INTEGER PRIMARY KEY AUTOINCREMENT,
        //             veri TEXT
        //         );
        //     `);
        //     break;

        default:
            throw new Error(`Bilinmeyen migration versiyonu: ${version}`);
    }
}

// Veritabanının hazır olduğundan emin olmak için yardımcı fonksiyon
async function ensureDatabaseReady() {
    try {
        const db = await initDatabase();
        if (!db) {
            throw new Error('Veritabanı başlatılamadı');
        }
        return db;
    } catch (error) {
        console.error('Veritabanı hazırlık hatası:', error);
        throw error;
    }
}

export async function ogrenciKaydet(params) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            INSERT INTO ogrenciler (ogrenciAd, ogrenciSoyad, ogrenciTel, veliAd, veliTel, ucret, okul, sinif, aciklama1, aciklama2, kayitTarihi, aktifmi) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                params.ogrenciAd,
                params.ogrenciSoyad,
                params.ogrenciTel,
                params.veliAd,
                params.veliTel,
                params.ucret,
                params.okul,
                params.sinif,
                params.aciklama1,
                params.aciklama2,
                params.kayitTarihi,
                params.aktifmi
            ]
        );

        console.log("Öğrenci kaydı başarılı");

        // Test amaçlı tüm öğrencileri listele
        const allStudents = await db.getAllAsync(`SELECT * FROM ogrenciler`);
        console.log("Toplam öğrenci sayısı:", allStudents.length);

        return { success: true, result };
    } catch (error) {
        console.log("Öğrenci kaydı eklenemedi:", error);
        return { success: false, error: error.message };
    }
}

export async function ogrenciSil(ogrenciId) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            DELETE FROM ogrenciler WHERE ogrenciId=?`,
            [ogrenciId]
        );
        return { success: result.changes > 0 };
    } catch (error) {
        console.log("Öğrenci silinemedi:", error);
        return { success: false, error: error.message };
    }
}

export async function ogrenciGuncelle(ogrenciId, params) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            UPDATE ogrenciler
            SET ogrenciAd=?, ogrenciSoyad=?, ogrenciTel=?, veliAd=?, veliTel=?, ucret=?, okul=?, sinif=?, aciklama1=?, aciklama2=?, kayitTarihi=?, aktifmi=?
            WHERE ogrenciId=?`,
            [
                params.ogrenciAd,
                params.ogrenciSoyad,
                params.ogrenciTel,
                params.veliAd,
                params.veliTel,
                params.ucret,
                params.okul,
                params.sinif,
                params.aciklama1,
                params.aciklama2,
                params.kayitTarihi,
                params.aktifmi,
                ogrenciId
            ]
        );
        return { success: result.changes > 0 };
    } catch (error) {
        console.log("Kayıt güncelleme başarısız:", error);
        return { success: false, error: error.message };
    }
}

export async function ogrencileriListele(pasifGoster = false) {
    try {
        await ensureDatabaseReady();

        // pasifGoster = false → aktifmi=1
        // pasifGoster = true  → aktifmi=0
        const aktifDeger = pasifGoster ? 0 : 1;

        const result = await db.getAllAsync(
            `SELECT * FROM ogrenciler WHERE aktifmi=? ORDER BY ogrenciAd ASC`,
            [aktifDeger]
        );

        return { success: true, data: result };
    } catch (error) {
        console.log("Öğrenci listeleme hatası:", error);
        return { success: false, error: error.message };
    }
}

export async function tekOgrenci(ogrenciId) {
    try {
        await ensureDatabaseReady();

        const result = await db.getFirstAsync(
            `SELECT * FROM ogrenciler WHERE ogrenciId=?`,
            [ogrenciId]
        );
        return { success: true, data: result };
    } catch (error) {
        console.log("Öğrenci bilgisi alınamadı:", error);
        return { success: false, error: error.message };
    }
}

// Veritabanı durumunu kontrol etmek için yardımcı fonksiyon
export async function getDatabaseInfo() {
    try {
        await ensureDatabaseReady();

        const versionInfo = await db.getFirstAsync(
            'SELECT version FROM database_version ORDER BY id DESC LIMIT 1'
        );

        const studentCount = await db.getFirstAsync(
            'SELECT COUNT(*) as count FROM ogrenciler'
        );

        return {
            success: true,
            version: versionInfo ? versionInfo.version : 0,
            studentCount: studentCount ? studentCount.count : 0
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Uygulama kapatıldığında veritabanını kapat
export async function closeDatabase() {
    if (db) {
        await db.closeAsync();
        db = null;
        console.log('Veritabanı bağlantısı kapatıldı');
    }
}
//todo dersler tablosunu güncellemelisin, öğrenci adsoyad ekledim
// TABLO TANIMLARI - VERSİYONLARA GÖRE AYRILMIŞ


// Ders kaydetme fonksiyonu
export async function dersiKaydet(dersVerisi) {
    try {
        const database = await initDatabase();

        await database.runAsync(
            `INSERT INTO dersler (ogrenciId, tarih, saat, ucret, konu, dersturu, ogrenciAdSoyad, sutun1) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [dersVerisi.ogrenciId, dersVerisi.tarih, dersVerisi.saat, dersVerisi.ucret, dersVerisi.konu, dersVerisi.dersturu, dersVerisi.ogrenciAdSoyad, dersVerisi.sutun1]
        );

        console.log("✅ Ders başarıyla kaydedildi!");
        return true;

    } catch (error) {
        console.error("❌ Ders kaydetme hatası:", error);
        return false;
    }
}

// Ödeme kaydetme fonksiyonu
export async function odemeiKaydet(odeme) {
    try {
        if (!db) db = await initDatabase();

        await db.runAsync(
            `INSERT INTO odemeler (ogrenciId, alinanucret, odemetarih, odemesaati, odemeturu, aciklama)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                odeme.ogrenciId,
                odeme.alinanucret,
                odeme.odemetarih,
                odeme.odemesaati,
                odeme.odemeturu,
                odeme.aciklama
            ]
        );

        console.log('Ödeme başarıyla kaydedildi:', odeme);
    } catch (error) {
        console.error('Ödeme kaydetme hatası:', error);
        throw error;
    }
}

//bir öğrencinin ödemeleri

export async function ogrencininOdemeleri(ogrenciId) {
    try {
        await ensureDatabaseReady();
        const odemeler = await db.getAllAsync(`SELECT * FROM odemeler WHERE ogrenciId=?`, [ogrenciId]);
        const dersler = await db.getAllAsync(`SELECT * FROM dersler `, [ogrenciId]);


        console.log("dersler:", dersler);
        return { odemeler: odemeler || [], dersler: dersler || [] };//eğer undefined olursa boş dizi döndürür
    } catch (error) {
        console.log("odeme toplamı bulunamadı:", error);
    }

}

//tüm yapılan dersler
export async function tumYapilanDersler() {
    try {
        await ensureDatabaseReady();
        const yapilanDersler = await db.getAllAsync(`SELECT * FROM dersler `);

        return { success: true, yapilanDersler: yapilanDersler || [] };
    } catch (error) {
        console.log("DB_yapılan dersler alınamadı...");
        return { success: false, yapilanDersler: [], error: error }
    }
}
export async function notKaydet(notVerisi) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            INSERT INTO notlarim (ogrenciId, tarih, not1) 
            VALUES (?, ?, ?)`,
            [
                notVerisi.ogrenciId,
                notVerisi.tarih,
                notVerisi.not1
            ]
        );

        console.log("Not başarıyla kaydedildi");
        return { success: true, result };
    } catch (error) {
        console.log("Not kaydetme hatası:", error);
        return { success: false, error: error.message };
    }
}

export async function notGuncelle(notId, notVerisi) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            UPDATE notlarim 
            SET not1=?, tarih=?
            WHERE notlarimId=?`,
            [
                notVerisi.not1,
                notVerisi.tarih,
                notId
            ]
        );

        return { success: result.changes > 0 };
    } catch (error) {
        console.log("Not güncelleme hatası:", error);
        return { success: false, error: error.message };
    }
}

export async function notSil(notId) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            DELETE FROM notlarim WHERE notlarimId=?`,
            [notId]
        );

        return { success: result.changes > 0 };
    } catch (error) {
        console.log("Not silme hatası:", error);
        return { success: false, error: error.message };
    }
}

export async function ogrenciNotlari(ogrenciId) {
    try {
        await ensureDatabaseReady();

        const result = await db.getAllAsync(
            `SELECT * FROM notlarim WHERE ogrenciId=? ORDER BY tarih DESC`,
            [ogrenciId]
        );

        return { success: true, data: result || [] };
    } catch (error) {
        console.log("Notlar alma hatası:", error);
        return { success: false, error: error.message, data: [] };
    }
}
// Kaynak kaydetme
export async function kaynakKaydet(kaynakVerisi) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            INSERT INTO kaynaklar (ogrenciId, kaynak) 
            VALUES (?, ?)`,
            [
                kaynakVerisi.ogrenciId,
                kaynakVerisi.kaynak
            ]
        );

        console.log("Kaynak başarıyla kaydedildi");
        return { success: true, result };
    } catch (error) {
        console.log("Kaynak kaydetme hatası:", error);
        return { success: false, error: error.message };
    }
}

// Kaynak listesi alma
export async function kaynakListesi(ogrenciId) {
    try {
        await ensureDatabaseReady();

        const result = await db.getAllAsync(
            `SELECT * FROM kaynaklar WHERE ogrenciId=? ORDER BY kaynak ASC`,
            [ogrenciId]
        );

        return { success: true, data: result || [] };
    } catch (error) {
        console.log("DB_Kaynak listesi alma hatası:", error);
        return { success: false, error: error.message, data: [] };
    }
}

// Ödev kaydetme
export async function odevKaydet(odevVerisi) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            INSERT INTO odevler (ogrenciId, kaynak, odev, verilmetarihi, teslimttarihi, yapilmadurumu, aciklama) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                odevVerisi.ogrenciId,
                odevVerisi.kaynak,
                odevVerisi.odev,
                odevVerisi.verilmetarihi,
                odevVerisi.teslimttarihi,
                odevVerisi.yapilmadurumu,
                odevVerisi.aciklama
            ]
        );

        console.log("Ödev başarıyla kaydedildi");
        return { success: true, result };
    } catch (error) {
        console.log("Ödev kaydetme hatası:", error);
        return { success: false, error: error.message };
    }
}

// Ödev güncelleme
export async function odevGuncelle(odevId, odevVerisi) {
    try {
        await ensureDatabaseReady();

        const result = await db.runAsync(`
            UPDATE odevler 
            SET kaynak=?, odev=?, verilmetarihi=?, teslimttarihi=?, yapilmadurumu=?, kontroltarihi=?, aciklama=?
            WHERE odevId=?`,
            [
                odevVerisi.kaynak,
                odevVerisi.odev,
                odevVerisi.verilmetarihi,
                odevVerisi.teslimttarihi,
                odevVerisi.yapilmadurumu,
                odevVerisi.kontroltarihi,
                odevVerisi.aciklama,
                odevId
            ]
        );

        return { success: result.changes > 0 };
    } catch (error) {
        console.log("Ödev güncelleme hatası:", error);
        return { success: false, error: error.message };
    }
}

// Öğrenci ödevleri alma
export async function ogrenciOdevleri(ogrenciId) {
    try {
        await ensureDatabaseReady();

        const result = await db.getAllAsync(
            `SELECT * FROM odevler WHERE ogrenciId=? ORDER BY verilmetarihi DESC`,
            [ogrenciId]
        );

        return { success: true, data: result || [] };
    } catch (error) {
        console.log("Ödevler alma hatası:", error);
        return { success: false, error: error.message, data: [] };
    }
}
// kaynak silme
export async function kaynakSil(kaynakId) {
    try {
        const result = await db.runAsync(
            "DELETE FROM kaynaklar WHERE kaynakId = ?",
            [kaynakId]
        );
        return { success: true };
    } catch (error) {
        console.error("Kaynak silme hatası:", error);
        return { success: false, error };
    }
}

// Versiyon 1 tabloları
const tabloOlusturucuV1 = `
CREATE TABLE IF NOT EXISTS ogrenciler (        
    ogrenciId INTEGER PRIMARY KEY AUTOINCREMENT,
    ogrenciAd TEXT NOT NULL,
    ogrenciSoyad TEXT DEFAULT '-',
    veliAd TEXT DEFAULT '-',
    okul TEXT DEFAULT '-',
    sinif TEXT DEFAULT '-',
    aciklama1 TEXT DEFAULT '-',
    aciklama2 TEXT DEFAULT '-',
    kayitTarihi TEXT DEFAULT CURRENT_TIMESTAMP,
    ucret INTEGER DEFAULT 0,
    ogrenciTel TEXT DEFAULT '-',
    veliTel TEXT DEFAULT '-',
    aktifmi INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dersler (
    dersId INTEGER PRIMARY KEY AUTOINCREMENT,
    ogrenciId INTEGER,
    dersturu TEXT,
    konu TEXT,
    saat TEXT,
    tarih TEXT,
    ucret TEXT,
    ogrenciAdSoyad TEXT,
    sutun1 TEXT,
    sutun2 TEXT,
    sutun3 TEXT,
    sutun4 TEXT,
    FOREIGN KEY (ogrenciId) REFERENCES ogrenciler(ogrenciId)
);

CREATE TABLE IF NOT EXISTS kaynaklar (
    kaynakId INTEGER PRIMARY KEY AUTOINCREMENT, 
    ogrenciId INTEGER, 
    kaynak TEXT,  
    sutun1 TEXT, 
    sutun2 TEXT, 
    sutun3 TEXT,  
    sutun4 TEXT,
    FOREIGN KEY (ogrenciId) REFERENCES ogrenciler(ogrenciId)
);

CREATE TABLE IF NOT EXISTS odevler (
    odevId INTEGER PRIMARY KEY AUTOINCREMENT, 
    ogrenciId INTEGER,
    kaynak TEXT,
    odev TEXT,
    verilmetarihi TEXT,
    teslimttarihi TEXT,
    kontroltarihi TEXT,
    yapilmadurumu TEXT,
    aciklama TEXT,
    sutun1 TEXT,
    sutun2 TEXT,
    sutun3 TEXT,
    sutun4 TEXT,
    FOREIGN KEY (ogrenciId) REFERENCES ogrenciler(ogrenciId)
);

CREATE TABLE IF NOT EXISTS notlarim (
    notlarimId INTEGER PRIMARY KEY AUTOINCREMENT, 
    ogrenciId INTEGER,
    tarih TEXT,
    not1 TEXT,
    sutun1 TEXT,
    sutun2 TEXT,
    sutun3 TEXT,
    FOREIGN KEY (ogrenciId) REFERENCES ogrenciler(ogrenciId)
);

CREATE TABLE IF NOT EXISTS odemeler (
    odemeId INTEGER PRIMARY KEY AUTOINCREMENT, 
    ogrenciId INTEGER,
    alinanucret TEXT,
    odemetarih TEXT,
    odemeturu TEXT,
    aciklama TEXT,
    odemesaati TEXT,
    sutun2 TEXT,
    sutun3 TEXT,
    sutun4 TEXT,
    FOREIGN KEY (ogrenciId) REFERENCES ogrenciler(ogrenciId)
);

CREATE TABLE IF NOT EXISTS ajanda (
    ajandaId INTEGER PRIMARY KEY AUTOINCREMENT, 
    ogrenciId INTEGER,
    ogrAdsoyad TEXT,
    tarih TEXT,
    saat TEXT,
    tekrarsayisi TEXT,
    kalanTekrarSayisi TEXT,
    olusmaAni TEXT,
    tamamlanma TEXT,
    sutun1 TEXT,
    sutun2 TEXT,
    FOREIGN KEY (ogrenciId) REFERENCES ogrenciler(ogrenciId)
);
`;

// GELECEKTEKİ VERSİYON ÖRNEKLERİ:

// Versiyon 2 için örnek migration
// const tabloOlusturucuV2 = `
//     ALTER TABLE ogrenciler ADD COLUMN email TEXT DEFAULT '';
//     ALTER TABLE ogrenciler ADD COLUMN adres TEXT DEFAULT '';
// `;

// Versiyon 3 için örnek migration
// const tabloOlusturucuV3 = `
//     CREATE TABLE IF NOT EXISTS ayarlar (
//         ayarId INTEGER PRIMARY KEY AUTOINCREMENT,
//         ayarAdi TEXT UNIQUE NOT NULL,
//         ayarDegeri TEXT,
//         olusturmaTarihi TEXT DEFAULT CURRENT_TIMESTAMP
//     );
//
//     INSERT OR IGNORE INTO ayarlar (ayarAdi, ayarDegeri) VALUES ('varsayilan_ucret', '100');
//     INSERT OR IGNORE INTO ayarlar (ayarAdi, ayarDegeri) VALUES ('derslik_kapasitesi', '20');
// `;

/*
KULLANIM REHBERİ:
=================

1. YENİ DEĞIŞIKLIK EKLEMEK İÇİN:
   - DATABASE_VERSION sayısını 1 artırın (örn: 1 → 2)
   - applyMigration fonksiyonuna yeni case ekleyin
   - Yeni tablo oluşturma, sütun ekleme, veri güncelleme vb. işlemlerinizi yazın

2. ÖRNEK KULLANIM:
   
   // Versiyon 2 eklemek için:
   const DATABASE_VERSION = 2; // 1'den 2'ye çıkarın
   
   // Sonra applyMigration'a case 2 ekleyin:
   case 2:
       await db.execAsync(`
           ALTER TABLE ogrenciler ADD COLUMN email TEXT DEFAULT '';
           ALTER TABLE ogrenciler ADD COLUMN adres TEXT DEFAULT '';
       `);
       break;

3. GÜVENLİ DEĞİŞİKLİK TİPLERİ:
   ✅ ALTER TABLE ADD COLUMN (yeni sütun ekleme)
   ✅ CREATE TABLE IF NOT EXISTS (yeni tablo oluşturma)
   ✅ INSERT OR IGNORE (varsayılan veri ekleme)
   ✅ CREATE INDEX (indeks oluşturma)
   
4. DİKKAT EDİLMESİ GEREKENLER:
   ⚠️  ALTER TABLE DROP COLUMN (SQLite'da sınırlı)
   ⚠️  Veri tipi değişiklikleri (karmaşık olabilir)
   ⚠️  FOREIGN KEY değişiklikleri

5. KARMAŞIK DEĞİŞİKLİKLER İÇİN:
   - Yeni tablo oluştur → verileri kopyala → eski tabloyu sil → yeni tabloyu yeniden adlandır
   
Örnek:
case 3:
    await db.execAsync(`
        -- Yeni yapıyla geçici tablo oluştur
        CREATE TABLE ogrenciler_temp (
            ogrenciId INTEGER PRIMARY KEY AUTOINCREMENT,
            ogrenciAd TEXT NOT NULL,
            ogrenciSoyad TEXT DEFAULT '-',
            // ... yeni yapı
        );
        
        -- Verileri kopyala
        INSERT INTO ogrenciler_temp SELECT * FROM ogrenciler;
        
        -- Eski tabloyu sil
        DROP TABLE ogrenciler;
        
        -- Yeni tabloyu doğru isimle değiştir
        ALTER TABLE ogrenciler_temp RENAME TO ogrenciler;
    `);
    break;
*/