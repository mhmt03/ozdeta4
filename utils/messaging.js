import * as Linking from 'expo-linking';
import * as SMS from 'expo-sms';

/**
 * SMS gönderme
 * @param {string} phone - Öğrenci telefon numarası
 * @param {string} mesaj - Gönderilecek mesaj
 */
export const sendSMS = async (phone, mesaj) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
        await SMS.sendSMSAsync([phone], mesaj);
    } else {
        alert('SMS gönderilemiyor!');
    }
};

/**
 * WhatsApp mesaj gönderme
 * @param {string} phone - Öğrenci telefon numarası
 * @param {string} mesaj - Gönderilecek mesaj
 */
export const sendWhatsApp = (phone, mesaj) => {
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(mesaj)}`;
    Linking.canOpenURL(url)
        .then((supported) => {
            if (!supported) {
                alert('WhatsApp yüklü değil!');
            } else {
                return Linking.openURL(url);
            }
        })
        .catch((err) => console.error('WhatsApp açma hatası:', err));
};
