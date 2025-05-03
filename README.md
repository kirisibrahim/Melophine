# Melophine - Quiz Uygulaması

Bu proje, **React Native** ve **Expo** kullanılarak geliştirilmiş **etkileşimli bir quiz uygulamasıdır**.  
Dinamik animasyonlar, ses efektleri, lokal veri saklama ve kullanıcı dostu bir deneyim sunar. Deezer API kullanıldı.
State yönetimi lokal react native (askerden gelince Zustand'a geçireceğim..:D).

---

## Kullanılan Teknolojiler ve Paketler

Melophine uygulamasında kullanılan temel **kütüphaneler** ve **teknolojiler**:

### Ana Çerçeveler ve Yapılar**
- **React Native** (`react-native`) - Mobil UI geliştirme çerçevesi  
- **Expo** (`expo`) - Kolay yapılandırma ve geliştirme ortamı  
- **Expo Router** (`expo-router`) - Sayfa yönlendirme sistemi  

### UI ve Animasyon**
- **NativeWind** (`nativewind`) - Tailwind CSS benzeri stil sistemi  
- **React Native Animatable** (`react-native-animatable`) - Animasyon kütüphanesi  
- **React Native Reanimated** (`react-native-reanimated`) - Gelişmiş animasyonlar  
- **React Native Shared Element** (`react-native-shared-element`) - Geçişli animasyonlar  

### Ses ve Geri Bildirim**
- **Expo AV** (`expo-av`) - Ses dosyalarını oynatma  
- **Expo Haptics** (`expo-haptics`) - Dokunsal geri bildirim  
- **React Native Toast Message** (`react-native-toast-message`) - Kullanıcı bildirimleri  

### Veri Saklama ve Yönetimi**
- **AsyncStorage** (`@react-native-async-storage/async-storage`) - Lokal veri saklama  
- **Expo Secure Store** (`expo-secure-store`) - Güvenli veri saklama  

## Projeyi Kurma ve Çalıştırma

Projeyi çalıştırmak için aşağıdaki adımları takip edin:

### **1. Projeyi Klonlayın**

git clone https://github.com/kirisibrahim/melophine.git
cd melophine

### **2. Bağımlılıkları Yükleyin**
npm install

### **3. Uygulamayı Başlatın**
npx expo start
ExpoGo Uygulamasını indirerek terminaldaki qr kodu okutun ve ve uygulamada açın

```sh