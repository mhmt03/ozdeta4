import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import AnaSayfa from './screens/AnaSayfa';
import OgrenciListesi from './screens/ogrenciListesi';
import OgrenciDetay from './screens/OgrenciDetay';
import YeniKayit from './screens/YeniKayit';
import { initDatabase } from './utils/database';
import Ajanda from './screens/Ajanda';
import AjandaKayitEkle from './screens/AjandaKayitEkle';
import AjandaRandevuDuzenle from './screens/AjandaRandevuDuzenle';
import DersRapor from './screens/DersRapor';
import NotEkle from './screens/NotEkle';
import OdevEkle from './screens/OdevEkle';
import KaynakYonetimi from './screens/KaynakYonetimi';
import Ayarlar from './screens/Ayarlar';

const Stack = createStackNavigator();

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Dosya izinlerini kontrol et ve iste - DÜZELTİLDİ
  // Bu fonksiyon uygulama başlatıldığında dosya erişim izinlerini kontrol eder
  // Android'de dosya kaydetme/paylaşma işlemleri için gereklidir
  const checkAndRequestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android platform kontrolü - sadece Android'de dosya izinleri gerekli

        // Android 13+ (API 33+) için yeni scoped storage sistemi
        if (Platform.Version >= 33) {
          // StorageAccessFramework kullanarak dizin erişimi iste
          // Bu, kullanıcıdan belirli bir klasör seçmesini ister
          const { status } = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (status === 'granted') {
            // İzin verildi - dosya işlemleri yapılabilir
            setPermissionGranted(true);
            return true;
          } else {
            // İzin reddedildi - kullanıcıyı bilgilendir
            Alert.alert(
              'İzin Gerekli',
              'Uygulamanın düzgün çalışması için dosya erişim izni gereklidir.',
              [{ text: 'Tamam' }]
            );
            setPermissionGranted(false);
            return false;
          }
        } else {
          // Android 13 öncesi sürümler için
          // READ/WRITE_EXTERNAL_STORAGE izinleri app.json'da tanımlanmış
          // Expo otomatik olarak bu izinleri yönetir
          setPermissionGranted(true);
          return true;
        }
      } else {
        // iOS için dosya izinleri gerekli değildir
        // iOS'ta uygulama sandbox'ı içinde işlemler yapılır
        setPermissionGranted(true);
        return true;
      }
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
      // Hata durumunda varsayılan olarak izin ver (kritik olmayan işlemler için)
      setPermissionGranted(true);
      return true;
    }
  };

  useEffect(() => {
    const setupApp = async () => {
      try {
        setLoading(true);

        // 1. İzinleri kontrol et
        const hasPermission = await checkAndRequestPermissions();

        if (!hasPermission && Platform.OS === 'android' && Platform.Version < 33) {
          setLoading(false);
          return;
        }

        // 2. Veritabanını başlat
        await initDatabase();
        console.log('Veritabanı başarıyla başlatıldı');
        setDbInitialized(true);

      } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
        Alert.alert(
          'Hata',
          'Uygulama başlatılamadı. Lütfen uygulamayı yeniden başlatın.',
          [{ text: 'Tamam' }]
        );
      } finally {
        setLoading(false);
      }
    };

    setupApp();
  }, []);

  // Yükleme ekranı
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Uygulama yükleniyor...</Text>
      </View>
    );
  }

  // İzin verilmezse uyarı ekranı
  if (!permissionGranted && Platform.OS === 'android' && Platform.Version < 33) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ İzin Gerekli</Text>
        <Text style={styles.infoText}>
          Uygulamanın düzgün çalışması için depolama izni gereklidir.
        </Text>
        <Text style={styles.infoText}>
          Lütfen uygulamayı yeniden başlatın ve izin verin.
        </Text>
      </View>
    );
  }

  // Veritabanı başlatılamazsa hata ekranı
  if (!dbInitialized) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Veritabanı Hatası</Text>
        <Text style={styles.infoText}>
          Veritabanı başlatılamadı. Lütfen uygulamayı yeniden başlatın.
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName='AnaSayfa'
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name='AnaSayfa'
          options={{ title: "Ana Sayfa", headerShown: false }}
          component={AnaSayfa}
        />
        <Stack.Screen
          name='ogrenciListesi'
          options={{ title: "Öğrenci Listesi" }}
          component={OgrenciListesi}
        />
        <Stack.Screen
          name='yeniKayit'
          options={{ title: 'Yeni Öğrenci Kaydı' }}
          component={YeniKayit}
        />
        <Stack.Screen
          name='ogrenciDetay'
          options={{ title: 'Öğrenci Detayları' }}
          component={OgrenciDetay}
        />
        <Stack.Screen
          name='Ajanda'
          component={Ajanda}
        />
        <Stack.Screen
          name='AjandaKayitEkle'
          component={AjandaKayitEkle}
        />
        <Stack.Screen
          name='AjandaRandevuDuzenle'
          component={AjandaRandevuDuzenle}
        />
        <Stack.Screen
          name='DersRapor'
          component={DersRapor}
        />
        <Stack.Screen
          name='NotEkle'
          component={NotEkle}
        />
        <Stack.Screen
          name='OdevEkle'
          component={OdevEkle}
        />
        <Stack.Screen
          name='KaynakYonetimi'
          component={KaynakYonetimi}
        />
        <Stack.Screen
          name='Ayarlar'
          component={Ayarlar}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 22,
    color: '#f44336',
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
});