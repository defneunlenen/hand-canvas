# Cam Drawer

Webcam uzerinden el hareketleriyle havaya cizim yapmanizi saglayan tarayici tabanli bir uygulama. MediaPipe kullanarak el ve yuz takibi yapar; basparmak ile isaret parmagini sikistirarak (pinch) cizim yapabilirsiniz.

## Ozellikler

- **El ile cizim** -- Basparmak + isaret parmagi sikistirma hareketi ile cizim baslar, parmaklar acilinca durur
- **Kalem & Silgi** -- Araç cubugu veya el jestleri ile gecis yapilabilir
- **Renk paleti** -- 10 farkli renk secenegi (beyaz, kirmizi, turuncu, sari, yesil, cyan, mavi, mor, pembe, gri)
- **Firca boyutu** -- 2px - 40px arasi ayarlanabilir slider
- **Geri alma (Undo)** -- 20 adima kadar geri alma destegi
- **Kaydet** -- Cizimi PNG olarak indir
- **Dil ile silme** -- Dilinizi cikararak tuvali temizleyin (acilip kapatilabilir)

## El Jestleri

| Jest | Islem |
|------|-------|
| Basparmak + Isaret parmagi (pinch) | Cizim yap |
| Basparmak + Orta parmak | Buyuk firca / normal firca gecisi |
| Basparmak + Yuzuk parmagi | Geri al |
| Basparmak + Serce parmak | Sonraki renge gec |
| Dil cikarma | Tuvali temizle |

## Teknolojiler

- **HTML5 Canvas** -- Cizim ve overlay katmanlari
- **MediaPipe Hands** -- El landmark tespiti ve takibi
- **MediaPipe Face Mesh** -- Yuz landmark tespiti (dil algilama icin)
- **MediaPipe Camera Utils** -- Webcam erisimi
- Vanilla JavaScript, harici framework yok

## Kurulum

Herhangi bir build aracina veya `npm install`'a gerek yoktur. Dosyalari bir HTTP sunucusu uzerinden servis edin:

```bash
# Python ile
python3 -m http.server 8000

# Node.js ile (npx)
npx serve .

# VS Code kullaniyorsaniz Live Server eklentisi ile de acabilirsiniz
```

Tarayicinizda `http://localhost:8000` adresine gidin. Kamera izni istendigi zaman onaylayin.

## Dosya Yapisi

```
cam-drawer/
  index.html    # Ana HTML sayfasi, toolbar ve canvas elemanlari
  app.js        # Uygulama mantigi: el takibi, jest algilama, cizim motoru
  styles.css    # Arayuz stilleri
```

## Nasil Calisir

1. Uygulama webcam'i acar ve her kareyi MediaPipe Hands + Face Mesh modeline gonderir
2. El landmark'lari EMA (Exponential Moving Average) ile yumusatilir, titresim onlenir
3. Basparmak (landmark 4) ile isaret parmagi ucu (landmark 8) arasindaki mesafe hesaplanir
4. Mesafe esik degerinin altina dustugunde ardisik 3 kare boyunca onay bekler (hysteresis), sonra cizim baslar
5. Cizim sirasinda isaret parmagi ucunun konumu takip edilir ve canvas uzerine cizgi cizilir
6. Dil algilama icin agiz acikligi orani ve agiz bolgesindeki kirmizi renk baskinligi kontrol edilir

## Tarayici Gereksinimleri

- Kamera erisimi destekleyen modern bir tarayici (Chrome, Edge, Firefox)
- HTTPS veya localhost (kamera izni icin gerekli)

## Lisans

Bu proje kisisel kullanim icin gelistirilmistir.
