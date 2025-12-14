// AjandaKayitEkle.js (Ajanda Kayıt Ekleme Sayfası)
// -----------------------------------------------------------------------------
// Bu sayfa, yeni randevu kayıtları oluşturmak için kullanılır.
// Özellikler:
// 1) Tarih seçici (DateTimePicker)
// 2) Radio button: Kayıtlı/Kayıtsız öğrenci seçimi
// 3) Öğrenci dropdown veya text input
// 4) Saat seçici
// 5) Tekrar sayısı (+ - butonları ile)
// 6) Periyot (gün bazında tekrar aralığı)
// 7) Periyodik kayıt sistemi (oluşma anı ile gruplanmış)
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ogrencileriListele } from '../utils/database';
import { ajandaKayitEkle } from '../utils/ajandaDatabase';

// 🎯 Ana Component Tanımı
export default function AjandaKayitEkle() {
    // 🧭 React Navigation Hook'ları
    // useNavigation(): sayfa geçişleri için navigation objesi
    // useRoute(): bu sayfaya gönderilen parametreleri almak için
    const navigation = useNavigation();
    const route = useRoute();

    // 📥 Route params'dan seçili tarihi al
    // Optional chaining (?.): params null ise hata vermesin
    // || new Date(): params yoksa bugünü kullan
    const selectedDateParam = route.params?.selectedDate;

    // 🕐 Tarih objesi oluşturma
    // selectedDateParam string formatında gelir (ISO string)
    // new Date(isoString): string'i Date objesine çevir
    const initialDate = selectedDateParam ? new Date(selectedDateParam) : new Date();

    // 🏪 Component State Tanımlamaları
    // useState Hook: [değer, değiştirFonksiyon] = useState(başlangıçDeğer)

    // 📅 Tarih ve saat state'leri
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // 👤 Öğrenci seçimi state'leri
    const [isRegisteredStudent, setIsRegisteredStudent] = useState(true); // Radio button
    const [selectedOgrenci, setSelectedOgrenci] = useState(null); // Seçili öğrenci objesi
    const [unregisteredName, setUnregisteredName] = useState(''); // Kayıtsız öğrenci adı
    const [ogrenciler, setOgrenciler] = useState([]); // Öğrenci listesi
    const [showOgrenciModal, setShowOgrenciModal] = useState(false); // Öğrenci seçim modal'ı

    // 🔄 Tekrar ayarları state'leri
    const [tekrarSayisi, setTekrarSayisi] = useState(1); // Kaç kere tekrarlanacak
    const [periyot, setPeriyot] = useState(7); // Kaç günde bir (default: haftalık)

    // ⚡ Loading ve UI state'leri
    const [loading, setLoading] = useState(false);
    const [ogrenciLoading, setOgrenciLoading] = useState(true);

    // 🔄 useEffect Hook: Sayfa açıldığında öğrenci listesini çek
    // useEffect(fonksiyon, bağımlılıkDizisi)
    // [] boş dizi: sadece component mount olduğunda çalıştır
    useEffect(() => {
        fetchOgrenciler();
    }, []);

    // 🔍 Öğrenci listesi çekme fonksiyonu
    // async function: asenkron fonksiyon tanımlama
    // await: Promise çözülene kadar bekle
    const fetchOgrenciler = async () => {
        try {
            setOgrenciLoading(true);
            // false parametresi: sadece aktif öğrencileri getir
            const result = await ogrencileriListele(false);

            // Destructuring ve optional chaining
            if (result?.success) {
                setOgrenciler(result.data || []);
            } else {
                console.error('Öğrenci listesi çekilemedi:', result?.error);
            }
        } catch (error) {
            console.error('Öğrenci çekme hatası:', error);
        } finally {
            // finally: hata olsun olmasın çalışır
            setOgrenciLoading(false);
        }
    };

    // 📅 DateTimePicker değişiklik handler'ı
    // event: picker'dan gelen event objesi
    // date: seçilen yeni tarih/saat
    const handleDateTimeChange = (event, date) => {
        // Android'de picker her değişiklikte kapanır
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setShowTimePicker(false);
        }

        // date undefined olabilir (iptal durumu)
        if (date) {
            if (showDatePicker) {
                setSelectedDate(date);
            } else if (showTimePicker) {
                setSelectedTime(date);
            }
        }
    };

    // ➕➖ Tekrar sayısı değiştirme fonksiyonları
    // Math.max(a, b): a ve b'den büyük olanı döndür (minimum 1 garantili)
    const increaseTekrar = () => {
        setTekrarSayisi(prev => prev + 1);
    };

    const decreaseTekrar = () => {
        setTekrarSayisi(prev => Math.max(1, prev - 1));
    };

    // ➕➖ Periyot değiştirme fonksiyonları
    const increasePeriyot = () => {
        setPeriyot(prev => prev + 1);
    };

    const decreasePeriyot = () => {
        setPeriyot(prev => Math.max(1, prev - 1));
    };

    // 👤 Öğrenci seçme fonksiyonu
    const selectOgrenci = (ogrenci) => {
        setSelectedOgrenci(ogrenci);
        setShowOgrenciModal(false);
    };

    // 🎨 FlatList render fonksiyonu: Öğrenci listesi
    // { item }: destructuring - sadece item prop'unu al
    // item: ogrenciler dizisinden gelen tek bir öğrenci objesi
    const renderOgrenciItem = ({ item }) => (
        <TouchableOpacity
            style={styles.ogrenciItem}
            onPress={() => selectOgrenci(item)}
        >
            {/* Template literal: ${} ile değişken yerleştirme */}
            <Text style={styles.ogrenciText}>
                {`${item.ogrenciAd} ${item.ogrenciSoyad}`}
            </Text>

            {/* Conditional rendering: seçili öğrenci ise check ikonu */}
            {selectedOgrenci?.ogrenciId === item.ogrenciId && (
                <MaterialIcons name="check" size={24} color="#2ecc71" />
            )}
        </TouchableOpacity>
    );

    // 💾 Form validasyon fonksiyonu
    // Return boolean: tüm alanlar doldurulmuş mu kontrol et
    const validateForm = () => {
        if (isRegisteredStudent && !selectedOgrenci) {
            Alert.alert('Hata', 'Lütfen bir öğrenci seçiniz');
            return false;
        }

        if (!isRegisteredStudent && !unregisteredName.trim()) {
            Alert.alert('Hata', 'Lütfen öğrenci adını giriniz');
            return false;
        }

        // .trim(): string başındaki ve sonundaki boşlukları temizle
        if (tekrarSayisi < 1) {
            Alert.alert('Hata', 'Tekrar sayısı en az 1 olmalıdır');
            return false;
        }

        return true;
    };


    const handleSave = async () => {
        // Form validasyon kontrolü
        if (!validateForm()) return;

        try {
            setLoading(true);

            // Oluşma anı: tüm periyodik kayıtlar için aynı timestamp
            const olusmaAni = Date.now().toString();

            // Kayıt verilerini hazırla
            const ogrenciId = isRegisteredStudent ? selectedOgrenci.ogrenciId : null;
            const ogrAdsoyad = isRegisteredStudent
                ? `${selectedOgrenci.ogrenciAd} ${selectedOgrenci.ogrenciSoyad}`
                : unregisteredName.trim();

            // Saat formatını hazırla
            const saatStr = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;

            selectedDate.setDate(selectedDate.getDate() + 1); //seçili tarihe indis yüzünden 1 ekledim
            // Periyodik kayıtları oluşturma döngüsü
            for (let i = 0; i < tekrarSayisi; i++) {

                // Her kayıt için tarih hesaplama
                const kayitTarihi = new Date(selectedDate);

                kayitTarihi.setDate(selectedDate.getDate() + (i * (periyot - 1)));

                // Bu kayıt için kalan tekrar sayısını hesapla
                const kalanTekrar = tekrarSayisi - i;

                // Kayıt objesi oluştur
                const record = {
                    ogrenciId: ogrenciId,
                    ogrAdsoyad: ogrAdsoyad,
                    tarih: kayitTarihi.toISOString().split('T')[0], // YYYY-MM-DD formatı
                    saat: saatStr,
                    tekrarsayisi: tekrarSayisi,
                    kalanTekrarSayisi: kalanTekrar,
                    olusmaAni: olusmaAni,
                    sutun1: '',
                    sutun2: ''
                };

                // Veritabanına kaydet
                const result = await ajandaKayitEkle(record);

                if (!result.success) {
                    throw new Error(result.error);
                }

                console.log(`Kayıt ${i + 1}/${tekrarSayisi} eklendi:`, {
                    tarih: record.tarih,
                    saat: record.saat,
                    kalanTekrar: record.kalanTekrarSayisi
                });
            }

            // Başarılı kayıt sonrası işlemler
            Alert.alert(
                'Başarılı',
                `${tekrarSayisi} adet randevu kaydedildi\n\nİlk randevu: ${selectedDate.toLocaleDateString('tr-TR')}\nSon randevu: ${new Date(selectedDate.getTime() + ((tekrarSayisi - 1) * periyot * 24 * 60 * 60 * 1000)).toLocaleDateString('tr-TR')}`,
                [
                    {
                        text: 'Tamam',
                        onPress: () => navigation.goBack(),
                    }
                ]
            );

        } catch (error) {
            console.error('Kayıt hatası:', error);
            Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    // 🚫 Vazgeçme işlemi
    const handleCancel = () => {
        // Alert.alert: native popup gösterme
        // 3 parametre: başlık, mesaj, buton dizisi
        Alert.alert(
            'Vazgeç',
            'Yaptığınız değişiklikler kaybolacak. Emin misiniz?',
            [
                { text: 'Hayır', style: 'cancel' }, // İptal butonu
                {
                    text: 'Evet',
                    style: 'destructive', // Kırmızı renk (iOS)
                    onPress: () => navigation.goBack()
                },
            ]
        );
    };

    // 🖼️ Ana render fonksiyonu
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* KeyboardAvoidingView: klavye açıldığında içeriği yukarı kaydır */}

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled" // Klavye açıkken de dokunma algıla
            >
                {/* BAŞLIK */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Yeni Randevu</Text>
                    <Text style={styles.headerSubtitle}>
                        Randevu detaylarını belirleyiniz
                    </Text>
                </View>

                {/* 📅 TARİH SEÇİCİ BÖLÜMÜ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Randevu Tarihi</Text>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <MaterialIcons name="calendar-today" size={24} color="#3498db" />
                        <Text style={styles.dateButtonText}>
                            {selectedDate.toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color="#bdc3c7" />
                    </TouchableOpacity>
                </View>

                {/* 👤 ÖĞRENCİ SEÇİMİ BÖLÜMÜ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Öğrenci</Text>

                    {/* Radio Button Container */}
                    <View style={styles.radioContainer}>
                        {/* Kayıtlı Öğrenci Radio */}
                        <TouchableOpacity
                            style={styles.radioItem}
                            onPress={() => setIsRegisteredStudent(true)}
                        >
                            <View style={[
                                styles.radioCircle,
                                isRegisteredStudent && styles.radioSelected
                            ]}>
                                {isRegisteredStudent && <View style={styles.radioInner} />}
                            </View>
                            <Text style={styles.radioText}>Kayıtlı Öğrenci</Text>
                        </TouchableOpacity>

                        {/* Kayıtsız Öğrenci Radio */}
                        <TouchableOpacity
                            style={styles.radioItem}
                            onPress={() => setIsRegisteredStudent(false)}
                        >
                            <View style={[
                                styles.radioCircle,
                                !isRegisteredStudent && styles.radioSelected
                            ]}>
                                {!isRegisteredStudent && <View style={styles.radioInner} />}
                            </View>
                            <Text style={styles.radioText}>Kayıtsız Öğrenci</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Conditional Rendering: Radio seçimine göre farklı input */}
                    {isRegisteredStudent ? (
                        // Kayıtlı öğrenci: Dropdown benzeri seçici
                        <TouchableOpacity
                            style={styles.ogrenciSelector}
                            onPress={() => setShowOgrenciModal(true)}
                            disabled={ogrenciLoading} // Loading sırasında disable
                        >
                            <Ionicons name="person" size={24} color="#3498db" />
                            <Text style={[
                                styles.ogrenciSelectorText,
                                !selectedOgrenci && styles.placeholderText
                            ]}>
                                {selectedOgrenci
                                    ? `${selectedOgrenci.ogrenciAd} ${selectedOgrenci.ogrenciSoyad}`
                                    : ogrenciLoading ? 'Öğrenciler yükleniyor...' : 'Öğrenci seçiniz'
                                }
                            </Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color="#bdc3c7" />
                        </TouchableOpacity>
                    ) : (
                        // Kayıtsız öğrenci: Text input
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={24} color="#3498db" />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Öğrenci adı ve soyadı"
                                value={unregisteredName}
                                onChangeText={setUnregisteredName} // Her karakter değişiminde state güncelle
                                autoCapitalize="words" // Kelime başlarını büyük harf yap
                                autoCorrect={false} // Otomatik düzeltme kapalı
                            />
                        </View>
                    )}
                </View>

                {/* 🕐 SAAT SEÇİCİ BÖLÜMÜ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🕐 Randevu Saati</Text>

                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <MaterialIcons name="access-time" size={24} color="#3498db" />
                        <Text style={styles.timeButtonText}>
                            {/* Date objesinden saat:dakika formatı çıkar */}
                            {`${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`}
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color="#bdc3c7" />
                    </TouchableOpacity>
                </View>

                {/* 🔄 TEKRAR AYARLARI BÖLÜMÜ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔄 Tekrar Ayarları</Text>

                    {/* Tekrar Sayısı */}
                    <View style={styles.counterContainer}>
                        <Text style={styles.counterLabel}>Tekrar Sayısı:</Text>
                        <View style={styles.counterControls}>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={decreaseTekrar}
                            >
                                <MaterialIcons name="remove" size={20} color="#e74c3c" />
                            </TouchableOpacity>

                            <Text style={styles.counterValue}>{tekrarSayisi}</Text>

                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={increaseTekrar}
                            >
                                <MaterialIcons name="add" size={20} color="#2ecc71" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Periyot (Gün Aralığı) */}
                    <View style={styles.counterContainer}>
                        <Text style={styles.counterLabel}>Periyot (Gün):</Text>
                        <View style={styles.counterControls}>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={decreasePeriyot}
                            >
                                <MaterialIcons name="remove" size={20} color="#e74c3c" />
                            </TouchableOpacity>

                            <Text style={styles.counterValue}>{periyot}</Text>

                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={increasePeriyot}
                            >
                                <MaterialIcons name="add" size={20} color="#2ecc71" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tekrar Özeti */}
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>
                            📋 {tekrarSayisi} hafta boyunca, {periyot} günde bir tekrarlanacak
                        </Text>
                        <Text style={styles.summarySubText}>
                            Toplam {tekrarSayisi} randevu oluşturulacak
                        </Text>
                    </View>
                </View>

                {/* 🎛️ AKSIYON BUTONLARI */}
                <View style={styles.actionButtons}>
                    {/* Vazgeç Butonu */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={handleCancel}
                        disabled={loading}
                    >
                        <MaterialIcons name="close" size={24} color="#e74c3c" />
                        <Text style={styles.cancelButtonText}>Vazgeç</Text>
                    </TouchableOpacity>

                    {/* Kaydet Butonu */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            // Loading sırasında spinner göster
                            <MaterialIcons name="hourglass-empty" size={24} color="white" />
                        ) : (
                            <MaterialIcons name="save" size={24} color="white" />
                        )}
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 📅 DATE PICKER MODAL */}
            {/* iOS'te modal, Android'te overlay olarak açılır */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date" // Sadece tarih seçimi
                    display="default" // Platform varsayılan görünüm
                    onChange={handleDateTimeChange}
                    minimumDate={new Date()} // Bugünden önceki tarihleri engelle
                />
            )}

            {/* 🕐 TIME PICKER MODAL */}
            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time" // Sadece saat seçimi
                    display="default"
                    onChange={handleDateTimeChange}
                    is24Hour={true} // 24 saat formatı
                />
            )}

            {/* 👥 ÖĞRENCİ SEÇİM MODALI */}
            <Modal
                visible={showOgrenciModal}
                transparent={true}
                animationType="slide" // Alt taraftan yukarı doğru açılır
                onRequestClose={() => setShowOgrenciModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowOgrenciModal(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>
                                    Öğrenci Seçiniz ({ogrenciler.length})
                                </Text>

                                {ogrenciler.length > 0 ? (
                                    <FlatList
                                        data={ogrenciler}
                                        renderItem={renderOgrenciItem}
                                        keyExtractor={(item) => item.ogrenciId.toString()}
                                        style={styles.ogrenciList}
                                        showsVerticalScrollIndicator={false}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <MaterialIcons name="school" size={50} color="#ddd" />
                                        <Text style={styles.emptyText}>
                                            Kayıtlı öğrenci bulunamadı
                                        </Text>
                                    </View>
                                )}

                                {/* Modal kapatma butonu */}
                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setShowOgrenciModal(false)}
                                >
                                    <Text style={styles.modalCloseText}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </KeyboardAvoidingView>
    );
}

// ------------------------------- STYLES --------------------------------------
const styles = StyleSheet.create({
    // 📱 Ana container ve genel layout
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },

    // 📋 Başlık bölümü
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 5,
    },

    // 📦 Section (bölüm) stilleri
    section: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
    },

    // 📅 Tarih seçici button
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ecf0f1',
        borderRadius: 8,
        backgroundColor: '#fafbfc',
    },
    dateButtonText: {
        flex: 1, // Kalan alanı kapla
        marginLeft: 10,
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: '500',
    },

    // 🔘 Radio button stilleri
    radioContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 25,
    },
    // Radio button dış çember
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#bdc3c7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    // Radio button seçili dış çember
    radioSelected: {
        borderColor: '#3498db',
    },
    // Radio button iç dolu çember
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3498db',
    },
    radioText: {
        fontSize: 14,
        color: '#2c3e50',
    },

    // 👤 Öğrenci seçici stilleri
    ogrenciSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ecf0f1',
        borderRadius: 8,
        backgroundColor: '#fafbfc',
    },
    ogrenciSelectorText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#2c3e50',
    },
    placeholderText: {
        color: '#95a5a6', // Placeholder için soluk renk
        fontStyle: 'italic',
    },

    // 📝 Text input stilleri (kayıtsız öğrenci için)
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ecf0f1',
        borderRadius: 8,
        backgroundColor: '#fafbfc',
        paddingHorizontal: 12,
    },
    textInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        fontSize: 14,
        color: '#2c3e50',
    },

    // 🕐 Saat seçici button stilleri
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ecf0f1',
        borderRadius: 8,
        backgroundColor: '#fafbfc',
    },
    timeButtonText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace font
    },

    // 🔢 Counter (sayaç) stilleri
    counterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    counterLabel: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: '500',
        flex: 1,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ecf0f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    counterValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        minWidth: 30,
        textAlign: 'center',
    },

    // 📋 Özet bilgisi stilleri
    summaryContainer: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#e8f6f3',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2ecc71',
    },
    summaryText: {
        fontSize: 14,
        color: '#27ae60',
        fontWeight: '500',
        marginBottom: 4,
    },
    summarySubText: {
        fontSize: 12,
        color: '#7f8c8d',
        fontStyle: 'italic',
    },

    // 🎛️ Aksiyon butonları container
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 20,
        gap: 15, // Butonlar arası boşluk
    },
    actionButton: {
        flex: 1, // Her buton eşit genişlik kaplar
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },

    // 🚫 Vazgeç butonu stilleri
    cancelButton: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#e74c3c',
    },
    cancelButtonText: {
        color: '#e74c3c',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },

    // ✅ Kaydet butonu stilleri
    saveButton: {
        backgroundColor: '#2ecc71',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },

    // 🪟 Modal genel stilleri
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
        textAlign: 'center',
    },

    // 📝 Öğrenci listesi modal stilleri
    ogrenciList: {
        maxHeight: 300, // Modal içinde scroll için sabit yükseklik
    },
    ogrenciItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    ogrenciText: {
        fontSize: 16,
        color: '#2c3e50',
        flex: 1,
    },

    // 📭 Boş liste gösterimi
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 10,
        color: '#95a5a6',
        textAlign: 'center',
        fontSize: 14,
        fontStyle: 'italic',
    },

    // 🚪 Modal kapatma butonu
    modalCloseButton: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#ecf0f1',
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
});

// 📤 Component Export
// Default export: başka dosyalarda import AjandaKayitEkle from './AjandaKayitEkle'
// şeklinde kullanılabilir