//ogrenciListesi.js

import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { FAB } from 'react-native-paper'
import { useEffect, useState } from "react";
import { ogrencileriListele, ogrenciSil } from "../utils/database";
import OgrenciListItem from "./OgrenciListItem";

export default function OgrenciListesi({ navigation }) {
    const [ogrenciler, setOgrenciler] = useState([]);
    const [pasifGor, setPasifGor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            verileriYenile();
        });

        verileriYenile(); // İlk yükleme

        return unsubscribe;
    }, [navigation, pasifGor]);

    const verileriYenile = async () => {
        try {
            setRefreshing(true);
            const result = await ogrencileriListele(pasifGor);

            if (result.success) { //* eğer öğrenciler başarı ile yüklenmiş ise
                setOgrenciler(Array.isArray(result.data) ? result.data : []);
            } else {
                setOgrenciler([]);
            }
        } catch (error) {
            console.error("Öğrenci listesi alınamadı:", error);
            Alert.alert("Hata", "Öğrenci listesi yüklenirken bir hata oluştu");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const togglePasifGor = () => {
        setPasifGor(!pasifGor);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Yükleniyor...</Text>
            </View>
        );
    }

    const handleEdit = (ogrenci) => {
        navigation.navigate("yeniKayit", { ogrenci });
    };

    const handleDelete = (ogrenciId) => {
        Alert.alert(
            "Öğrenci Silme Onayı",
            "Bu öğrenciyi silmek istediğinize emin misiniz?",
            [
                {
                    text: "Hayır",
                    style: "cancel"
                },
                {
                    text: "Evet",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ogrenciSil(ogrenciId);
                            verileriYenile();
                        } catch (error) {
                            Alert.alert("Hata", "Öğrenci silinirken bir hata oluştu");
                        }
                    }
                }
            ]
        );
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>

                <TouchableOpacity
                    style={[styles.toggleButton, pasifGor && styles.toggleButtonActive]}
                    onPress={togglePasifGor}
                >
                    <Text style={styles.toggleButtonText}>
                        {pasifGor ? 'Pasif Öğrenciler' : 'Aktif Öğrenciler'}
                    </Text>
                </TouchableOpacity>
            </View>

            {ogrenciler.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Kayıtlı öğrenci bulunamadı</Text>
                    <Text style={styles.emptySubText}>Yeni öğrenci eklemek için alttaki + butonuna tıklayın</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('yeniKayit')}
                    >
                        <Text style={styles.addButtonText}>Yeni Öğrenci Ekle</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={ogrenciler}
                    keyExtractor={item => item.ogrenciId?.toString() ?? Math.random().toString()}
                    renderItem={({ item }) => (
                        <OgrenciListItem
                            ogrenci={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPress={() => navigation.navigate('ogrenciDetay', { ogrenci: item })}
                        />
                    )}
                    refreshing={!!refreshing}
                    onRefresh={verileriYenile}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('yeniKayit')}
                color="white"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    toggleButton: {
        padding: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
    },
    toggleButtonActive: {
        backgroundColor: '#4CAF50',
    },
    toggleButtonText: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 8,
        paddingBottom: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 20,
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2196F3',
    },
});
