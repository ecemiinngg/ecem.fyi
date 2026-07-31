// Canon Database — Homeros / Odysseia karar ağacı veri seti.
//
// Canon Database & Checker Agent'ın okuduğu tek doğruluk kaynağı. Her düğüm 3–4
// seçenek içerir ve tam olarak biri `canon: true` işaretlidir: Odysseus'un
// destanda gerçekten yaptığı hamle. Canon hattının motordan geçirilmiş toplamı
// 120 ay ve %100 mürettebat kaybıdır (CANON_REFERENCE ile doğrulanır).
//
// Etki sözlüğü için bkz. types.ts.

import type { CanonNode, GameState, MetricMeta } from "./types";

export const START_STATE: GameState = {
  crew: 600,
  months: 23,           // Troya'dan ayrılış → ilk düğüm arası seyir
  rationality: 50,
  curiosity: 50,
  risk: 50,
  authority: 50,
  wrath: 10,
  alive: true,
  nodeIndex: 0,
};

export const METRICS: MetricMeta[] = [
  { key: 'rationality', label: 'Rasyonellik',        short: 'Rasyonellik', axis: true },
  { key: 'curiosity',   label: 'Merak & Keşif',      short: 'Merak',       axis: true },
  { key: 'risk',        label: 'Risk Toleransı',     short: 'Risk',        axis: true },
  { key: 'authority',   label: 'Liderlik Otoritesi', short: 'Liderlik',    axis: true },
  { key: 'wrath',       label: 'Tanrıların Gazabı',  short: 'Gazap',       axis: false }
];

export const NODES: CanonNode[] = [
  /* ───────────────────────── DÜĞÜM 1 ───────────────────────── */
  {
    id: 'N1',
    title: 'Polyphemus\'un Mağarası',
    place: 'Kikloplar Ülkesi · Merak ile Hayatta Kalma arasındaki ilk sınav',
    prose: [
      'Sisin arkasından bir kıyı yükseldi: keçilerin başıboş gezdiği, ekilmemiş, yasasız bir toprak. ' +
      'Kumsalda ateş yoktu, liman yoktu, dost yoktu — yalnızca yamacın karnında açılmış kocaman bir ağız ve içinden ' +
      'sızan peynir kokusu.',
      'On iki adamını seçtin, bir tulum tatlı şarap aldın ve mağaraya yürüdün. Mağarada kimse yoktu; sepetler peynir, ' +
      'ağıllar kuzu doluydu. Adamların fısıldadı: <em>“Ne kadar taşıyabilirsek yükleyip gemiye dönelim, kaptan.”</em> ' +
      'Ama merak, açlıktan da eskidir: burada yaşayanın kim olduğunu bilmeden gitmek istemiyorsun.'
    ],
    risks: [
      'Mağara sahibi bir Kiklop: Poseidon\'un oğlu Polyphemus.',
      'Mağara girişini bir kaya kapatırsa çıkış yalnızca zekâyla olur.',
      'Adını haykırmak, düşmanına sana beddua etme adresini vermektir.'
    ],
    choices: [
      {
        id: 'N1-A',
        canon: true,
        label: 'Mağarada bekle, devi gör, şarapla kör et — kaçarken adını haykır',
        hint: 'Konukluk yasasını sına, ganimeti ve şanı birlikte al. Bedeli: bir tanrının adresi artık sende.',
        tag: 'merak',
        effects: { crew: -6, months: 1, rationality: -15, curiosity: 16, risk: 20, authority: 5, wrath: 40 },
        outcome:
          'Dev döndü, kayayı çekti, altı adamını çiğ çiğ yuttu. Sen şarabı sundun, adını “Kimse” dedin, akkor ' +
          'kazığı tek gözüne sürdün ve koçların karnına yapışıp kaçtın. Sonra — açık denizde, güvendeyken — ' +
          'dayanamayıp haykırdın: <em>“Beni kör eden Ithakalı Odysseus\'tur!”</em> Kayalar arkandan uçtu, ' +
          've Poseidon oğlunun duasını duydu.',
        analystNote:
          'Merakı ve şanı hayatta kalmanın önüne koydun: 6 adam ve bir tanrının kalıcı düşmanlığı karşılığında ' +
          'destanın en meşhur zaferini satın aldın.'
      },
      {
        id: 'N1-B',
        label: 'Kör et ama sessiz kaç — adını asla söyleme',
        hint: 'Zaferi al, faturayı kesme. Anonim kalan kahraman, gazaptan da anonim kalır.',
        tag: 'pragmatik',
        effects: { crew: -6, months: 1, rationality: 10, curiosity: 12, risk: 10, authority: 12, wrath: 5 },
        outcome:
          'Aynı kazık, aynı kör göz, aynı koç karnı — ama açık denizde ağzını açmadın. Adamların seni ' +
          'gülüşürken izledi; dev arkanızdan kime beddua edeceğini bilemedi. Şan defterine bir satır yazılmadı, ' +
          'ama Poseidon\'un defterine de yazılmadın.',
        analystNote:
          'Aynı taktik zaferi %90 daha düşük tanrısal maliyetle aldın. Kaybettiğin tek şey: destanın en çok ' +
          'alıntılanan repliği.'
      },
      {
        id: 'N1-C',
        label: 'Peynirleri ve kuzuları yükle, dev dönmeden kaç',
        hint: 'Ganimet al, hikâyeyi bırak. Klasik kâr–risk optimizasyonu.',
        tag: 'temkin',
        effects: { crew: 0, months: 0, rationality: 18, curiosity: -8, risk: -5, authority: -5, wrath: 0 },
        variance: { p: 0.20, crew: -2, note: 'Dev sürüsüyle beklenenden erken döndü; kıyıda iki adam geride kaldı.' },
        outcome:
          'Adamların haklıydı. Sepetleri sırtladınız, kuzuları sürdünüz, gemiler kürek uzunluğunda uzaklaştı. ' +
          'Ardınızda bir uğultu duyuldu ama kimse geri bakmadı. Karnınız tok, sayınız tam, hikâyeniz kısaydı.',
        analystNote:
          'Sıfır kayıpla kaynak topladın. Mürettebat seni “ganimeti bilen ama şanı olmayan kaptan” olarak ' +
          'not etti — otorite hafif eridi.'
      },
      {
        id: 'N1-D',
        label: 'Adaya hiç ayak basma, gemide kal ve rüzgârı bekle',
        hint: 'Bilinmeyen kıyı, ölçülmemiş risktir. Ölçemediğin şeye girmemek de bir stratejidir.',
        tag: 'temkin',
        effects: { crew: 0, months: 0, rationality: 22, curiosity: -22, risk: -20, authority: -10, wrath: 0 },
        outcome:
          'Kıyıya bakıp geçtin. Adamlar tayına dönen kuru peksimeti çiğnerken yamaçtaki ağızdan yükselen dumana ' +
          'baktılar, sonra sana baktılar. Kimse bir şey demedi. En pahalı kararlar, hiçbir şeyin olmadığı ' +
          'kararlardır.',
        analystNote:
          'Riski sıfırladın, merakı da sıfırladın. Mürettebat gözünde “ganimetsiz geçilen ada” bir liderlik ' +
          'aşınması olarak kaydedildi.'
      }
    ],
    canonSummary: 'Mağarada bekledi, devi kör etti ve kaçarken adını haykırdı: −6 adam, +1 ay, Poseidon\'un gazabı.'
  },

  /* ───────────────────────── DÜĞÜM 2 ───────────────────────── */
  {
    id: 'N2',
    title: 'Kirke\'nin Adası',
    place: 'Aiaie · Bir yıllık konfor ile bir günlük irade arasında',
    prose: [
      'Aiaie\'nin ortasında bir taş ev, evin çevresinde kurtlar ve aslanlar — hepsi ürkek, hepsi evcil, hepsi bir ' +
      'zamanlar insan. İçeriden bir tezgâhın tokmağı ve tanrıça sesi geliyordu.',
      'Eurylokhos\'un bölüğü içeri girdi ve domuz olarak geri çıktı. Hermes sana beyaz çiçekli moly kökünü verdi; ' +
      'Kirke\'nin kâsesi artık sana işlemiyor. Tanrıça kılıcını gördü, güldü ve sofrayı kurdu: ' +
      '<em>“Kal. Denizin sırlarını da, kendini de burada öğrenirsin.”</em>'
    ],
    risks: [
      'Konfor, zamanın en sessiz avcısıdır.',
      'Kirke\'nin bilgisi olmadan Hades\'in ve Sirenler\'in yolu haritasızdır.',
      'Mürettebat bir yıl karada kalırsa denizciliği unutur; bir günde kalkarsa kaptanını sorgular.'
    ],
    choices: [
      {
        id: 'N2-A',
        canon: true,
        label: 'Bir yıl kal: sofra, yatak ve tanrıçanın bütün bilgisi',
        hint: 'Zamanı harca, bilgiyi ve tanrıçanın dostluğunu topla. Yolculuğun en pahalı ders ücreti.',
        tag: 'merak',
        effects: { crew: 0, months: 12, rationality: -5, curiosity: 10, risk: 5, authority: -15, wrath: -5 },
        outcome:
          'Bir yıl. Domuzlar yeniden adam oldu, adamlar yeniden ziyafet ehli oldu, sen tanrıçanın yanında ' +
          'Hades\'in yolunu, Sirenler\'in tuzağını ve Helios\'un sığırlarına dair uyarıyı öğrendin. Sonunda ' +
          'Eurylokhos önüne geçti: <em>“Kaptan, artık Ithaka\'yı hatırlamıyor musun?”</em>',
        analystNote:
          'Bir yılı bilgiyle takas ettin. Takvimin en büyük tek kalemi bu; buna karşılık sonraki üç düğümü ' +
          'haritalı geçtin.'
      },
      {
        id: 'N2-B',
        label: 'Adamları çöz, aynı gün yelken aç',
        hint: 'Bilgi pahalıdır ama zaman da pahalıdır. Haritasız denize açılmak bir bahis.',
        tag: 'pragmatik',
        effects: { crew: 0, months: 1, rationality: 18, curiosity: -12, risk: 12, authority: 15, wrath: 5 },
        variance: { p: 0.25, crew: -20, months: 1, note: 'Tarifsiz sularda kuzey fırtınası: yirmi kürekçi denize gitti.' },
        outcome:
          'Kâseyi kırdın, büyüyü çözdürdün ve akşam rüzgârını beklemeden demir aldın. Adamlar kaptanlarının ' +
          'bir tanrıçaya bile takılmadığını gördü; omuzları düzeldi. Ama pruvada kimsenin elinde harita yoktu.',
        analystNote:
          'Bir yıl kazandın, kütüphaneyi kaybettin. Sonraki düğümlerde “bilmediğin için” alınan risk primini ' +
          'ödemeye hazır ol.'
      },
      {
        id: 'N2-C',
        label: 'İki ay kal: sadece rota bilgisini al, ziyafeti kes',
        hint: 'Bilginin marjinal faydası ilk haftalarda en yüksektir. Gerisi konfordur.',
        tag: 'pragmatik',
        effects: { crew: 0, months: 2, rationality: 25, curiosity: 5, risk: -5, authority: 8, wrath: -3 },
        outcome:
          'Tanrıçaya pazarlığı açık koydun: yol bilgisi karşılığı iki ay. Hades\'in ağzını, balmumunu, ' +
          'boğazın iki canavarını ve sığırlara dair yasağı öğrendin, sonra sofrayı devirmeden kalktın. ' +
          'Kirke ardından baktı: <em>“Ölçülü adam, tanrıçaları en çok yaralayan adamdır.”</em>',
        analystNote:
          'Canon\'un bilgi çıktısını on ay daha kısa sürede aldın. Yolculuğun en yüksek verimli tek kararı bu.'
      },
      {
        id: 'N2-D',
        label: 'Kılıcı çek, tanrıçayı zorla — domuzlar domuz kalsın',
        hint: 'Güç gösterisi hızlıdır. Tanrısal olanla pazarlıkta hız her zaman kâr değildir.',
        tag: 'kumar',
        effects: { crew: -50, months: 1, rationality: -22, curiosity: -5, risk: 30, authority: -25, wrath: 25 },
        outcome:
          'Kılıç kalktı, tanrıça kalkmadı — güldü. Büyü kısmen çözüldü, ağıldaki elli adam ağılda kaldı; ' +
          'geride kalan mürettebat kaptanının onları kurtaramadığını gördü. Aiaie ardınızda küçüldü, ' +
          'kayıp defteri büyüdü.',
        analystNote:
          'Zorlama, tanrısal muhataplarda negatif getirili. Elli adam ve otoriten bir günlük hız uğruna gitti.'
      }
    ],
    canonSummary: 'Bir yıl adada kaldı: 0 kayıp, +12 ay, tanrıçanın bütün rota bilgisi.'
  },

  /* ───────────────────────── DÜĞÜM 3 ───────────────────────── */
  {
    id: 'N3',
    title: 'Sirenler\'in Şarkısı',
    place: 'Çiçekli Ada · Bilmek ile güvende kalmak arasındaki en dar boğaz',
    prose: [
      'Rüzgâr birden kesildi; deniz cam oldu. Kirke\'nin uyarısı kulağında: iki Siren, çiçekli bir çayır ve ' +
      'çayırda çürüyen adam kemikleri. Şarkı öldürmez — şarkıyı dinleyen kendi kürek yerini bırakır, o öldürür.',
      'Balmumu topağı avucunda ısındı. Direk ayakta, halat hazır. Bir bilgi kapısının önündesin: ' +
      'insanlığın hiçbir hayatta kalanının duymadığı bir şey duyulabilir — ama ölmemek üzere.'
    ],
    risks: [
      'Şarkıyı duyan iradesi zayıf bir dümenci gemiyi kayalara sürer.',
      'Kaptanı bağlı bir gemide, komuta zinciri geçici olarak kopar.',
      'Rotadan uzaklaşmak bilinmeyen sulara girmek demektir.'
    ],
    choices: [
      {
        id: 'N3-A',
        canon: true,
        label: 'Kendini direğe bağlat, mürettebatın kulaklarını balmumuyla tıka',
        hint: 'Bilgiyi al, iradeyi halata devret. Riski ortadan kaldırmadan yönetmek.',
        tag: 'merak',
        effects: { crew: 0, months: 0, rationality: 10, curiosity: 22, risk: 18, authority: 15, wrath: 0 },
        outcome:
          'Halat etine gömüldü, sen çözülmek için bağırdın, adamlar duymadı ve kürek çekmeye devam etti. ' +
          'Şarkıyı duydun — sonuna kadar. Kayalıklar geride kalınca çözdüler; yüzün ıslaktı ve kimse ' +
          'nedenini sormadı. Kayıp: sıfır. Kazanç: kimsenin taşıyamadığı bir bilgi.',
        analystNote:
          'Sıfır maliyetle maksimum merak getirisi. Destanın en verimli risk mühendisliği hamlesi; ' +
          'ölçülemez bilgi için ölçülmüş bir düzenek kurdun.'
      },
      {
        id: 'N3-B',
        label: 'Herkesin kulağını tıka — kaptan dahil, kimse dinlemesin',
        hint: 'Bilinmeyen bilgi, alınmamış risktir. En temiz geçiş, en sessiz geçiştir.',
        tag: 'temkin',
        effects: { crew: 0, months: 0, rationality: 25, curiosity: -25, risk: -20, authority: 5, wrath: 0 },
        outcome:
          'Balmumu bütün kulaklara eşit dağıtıldı. Gemi sağır bir hayvan gibi çayırın önünden geçti; ' +
          'iki gölge kıyıda kollarını açtı, kimse görmedi bile. Deniz yeniden ses verdiğinde ada arkadaydı. ' +
          'Hiçbir şey olmadı — planlandığı gibi.',
        analystNote:
          'Sıfır kayıp, sıfır zaman, sıfır bilgi. Odysseus\'a kıyasla en büyük merak açığını burada verdin; ' +
          'karşılığında hiçbir belirsizlik satın almadın.'
      },
      {
        id: 'N3-C',
        label: 'Rotayı büsbütün değiştir, adayı uzaktan dolaş',
        hint: 'Tuzağa hiç girmemek. Bedeli haritada değil takvimde.',
        tag: 'temkin',
        effects: { crew: 0, months: 3, rationality: 5, curiosity: -15, risk: -25, authority: -5, wrath: 0 },
        variance: { p: 0.30, crew: -15, months: 1, note: 'Tarif dışı sularda sığlık: bir gemi karina verdi, on beş kayıp.' },
        outcome:
          'Dümeni kırdın, çiçekli ada ufkun dışında kaldı. Üç ay boyunca Kirke\'nin çizmediği sularda yol aldınız; ' +
          'ne şarkı duyuldu ne kemik görüldü. Bilinmeyeni sadece yerinden başka bir yere taşıdın.',
        analystNote:
          'Bilinen riski bilinmeyen riskle takas ettin — ve üç ay ödedin. Analitik olarak en pahalı “kaçınma” kararı.'
      },
      {
        id: 'N3-D',
        label: 'Hiç önlem alma: bütün mürettebat şarkıyı duysun',
        hint: 'Tam bilgi, tam risk. Destanda bunun hayatta kalanı yok.',
        tag: 'kumar',
        effects: { crew: -120, months: 0, rationality: -40, curiosity: 30, risk: 45, authority: -30, wrath: 5 },
        fatal: 0.50,
        outcome:
          'Balmumu güvertede eridi, halat kangalında kaldı. Şarkı geldi ve gemi kendi kendini kayalara sürdü. ' +
          'Yüz yirmi adam çiçekli çayırın kemik yığınına katıldı; şarkı sustuğunda hâlâ suyun üstünde olan ' +
          'her ne varsa, artık plansız yol alıyordu.',
        analystNote:
          'Kontrolsüz merak: en yüksek tek düğüm kaybı. Aynı bilgiyi canon 0 kayıpla aldı; fark, düzenek ' +
          'kurma disiplininde.'
      }
    ],
    canonSummary: 'Direğe bağlandı, mürettebatın kulağını tıkadı: 0 kayıp, 0 ay, maksimum merak getirisi.'
  },

  /* ───────────────────────── DÜĞÜM 4 ───────────────────────── */
  {
    id: 'N4',
    title: 'Skylla ve Kharybdis',
    place: 'Boğaz · Kesin küçük kayıp ile belirsiz toplu yıkım arasında',
    prose: [
      'Boğazın iki yakası da ölüm. Solda Kharybdis: günde üç kez denizi içine çekip kusan anafor; yakalanan gemiden ' +
      'tahta bile kalmaz. Sağda Skylla: kayanın oyuğunda altı boyunlu, her ağzı bir adamlık.',
      'Kirke\'nin sözü netti: <em>“Skylla\'ya yakın geç. Altı adam kaybetmek, bütün gemiyi kaybetmekten iyidir.”</em> ' +
      'Ve bir söz daha etti: adamların bunu bilmesi, kürek düzenini bozar.'
    ],
    risks: [
      'Kharybdis kuyruklu bir olasılık: ya sıfır kayıp ya toplam imha.',
      'Skylla kesin ve hesaplanabilir: altı adam.',
      'Kehaneti paylaşmak paniğe, saklamak kaptana duyulan güvene mal olur.'
    ],
    choices: [
      {
        id: 'N4-A',
        canon: true,
        label: 'Skylla\'ya yakın geç, kehaneti mürettebattan sakla',
        hint: 'Beklenen kaybı minimize et, bilgiyi tek elde tut. Kaptanın soğuk aritmetiği.',
        tag: 'pragmatik',
        effects: { crew: -6, months: 0, rationality: 20, curiosity: -5, risk: -10, authority: 10, wrath: 0 },
        outcome:
          'Zırhını kuşandın, iki mızrak aldın ve pruvada Skylla\'yı bekledin — adamlara tek kelime etmedin. ' +
          'Altı boyun aynı anda indi; altı isim aynı anda bitti. Kürek düzeni bozulmadı, çünkü kimse ne olacağını ' +
          'bilmiyordu. Bu, destanın en soğuk altı ölümüdür.',
        analystNote:
          'Beklenen değer hesabını doğru yaptın: 6 kesin kayıp, %40 toplam imha riskinden ucuzdur. ' +
          'Bilgi asimetrisini otoriteyi korumak için kullandın.'
      },
      {
        id: 'N4-B',
        label: 'Kehaneti açıkla, sonra Skylla\'dan geç',
        hint: 'Aynı aritmetik, şeffaf komuta. Şeffaflığın bedeli güvertede ödenir.',
        tag: 'pragmatik',
        effects: { crew: -6, months: 0, rationality: 15, curiosity: 0, risk: -10, authority: -20, wrath: 0 },
        variance: { p: 0.30, crew: -4, note: 'Panik kürek düzenini bozdu; Skylla altı yerine on ağız doldurdu.' },
        outcome:
          'Güverteye topladın ve söyledin: “Altımız gidecek, hangimiz bilmiyorum.” Kürekler bir an durdu. ' +
          'Skylla indiğinde çığlıklar hem kayadan hem gemiden geldi. Geçtiniz — ama artık her adam ' +
          'kaptanının aritmetiğini biliyordu.',
        analystNote:
          'Aynı kaybı şeffaflıkla aldın ve otorite priminden feragat ettin. Panik varyansı beklenen kaybı ' +
          'yukarı çekti.'
      },
      {
        id: 'N4-C',
        label: 'Kharybdis tarafından geç — belki anafor uyur',
        hint: 'Sıfır kayıp ihtimalini satın al, toplam imha riskini kabul et.',
        tag: 'kumar',
        effects: { crew: -10, months: 0, rationality: -18, curiosity: 10, risk: 40, authority: -10, wrath: 10 },
        fatal: 0.40,
        variance: { p: 0.55, crew: -90, note: 'Anafor tam altınızda açıldı: doksan adam ve bir gemi yutuldu.' },
        outcome:
          'Dümen sola. Su bir an çukurlaştı, kara kayanın dibi göründü, gemi bir hayvanın ağzına doğru kaydı. ' +
          'Kimin nefes alarak çıktığı, o gün anaforun kaçıncı yutkunmasında olduğuna bağlıydı.',
        analystNote:
          'Kuyruk riskini gönüllü aldın. Beklenen kaybı canon\'un yaklaşık on katına çıkardın; karşılığında ' +
          'küçük bir “sıfır kayıp” ihtimali satın aldın.'
      },
      {
        id: 'N4-D',
        label: 'Gelgiti bekle, boğazı gece sessizce geç',
        hint: 'Zamanı ödeyerek olasılığı düşür. En sabırlı seçenek.',
        tag: 'temkin',
        effects: { crew: -3, months: 2, rationality: 25, curiosity: 5, risk: -15, authority: 5, wrath: 0 },
        variance: { p: 0.35, crew: -9, note: 'Karanlıkta rota şaştı; Skylla beklenenden çok ağız doldurdu.' },
        outcome:
          'İki ay kıyıda gelgit saydın, dalgıç indirdin, Kharybdis\'in üç yutkunmasını çizdin. Sonra en sakin ' +
          'gecede, küreksiz, akıntıyla süzüldünüz. Skylla uyanmadı sayılır: üç adam. Boğaz ilk kez ' +
          'hesap edilerek geçildi.',
        analystNote:
          'Zamanı veriyle takas ettin: canon\'un yarısı kayıpla geçtin, karşılığında takvime iki ay yazdın.'
      }
    ],
    canonSummary: 'Skylla\'ya yakın geçti ve kehaneti sakladı: −6 adam, 0 ay, düzen korundu.'
  },

  /* ───────────────────────── DÜĞÜM 5 ───────────────────────── */
  {
    id: 'N5',
    title: 'Helios\'un Sığırları',
    place: 'Thrinakia · Açlık ile kutsal yasak arasındaki son sınav',
    prose: [
      'Thrinakia. Kıyıda Güneş\'in sürüsü otluyor: yedi sürü sığır, yedi sürü koyun, hiç doğmayan ve hiç ölmeyen ' +
      'hayvanlar. Hem Teiresias hem Kirke aynı cümleyi söyledi: <em>“Onlara dokunmayın; dokunursanız gemi de, ' +
      'adamlar da gitmiş sayılsın.”</em>',
      'Ama güney rüzgârı bir aydır esiyor, ambarda un yok, oltalar boş dönüyor. Adamlar kutsal olanı yiyip yaşamakla ' +
      'temiz kalıp ölmek arasında bir tercih olmadığını fısıldıyor. Bu, yolculuğunun son karar düğümü.'
    ],
    risks: [
      'Zeus\'un yıldırımı bir olasılık değil, ilan edilmiş bir sonuçtur.',
      'Aç bir mürettebatın itaati her gün biraz daha erir.',
      'Adada beklemek takvime, ayrılmak ambara yazılır.'
    ],
    choices: [
      {
        id: 'N5-A',
        canon: true,
        label: 'Yasağı ilan et ve yemin ettir — sonra uykuya çekil',
        hint: 'Kuralı koy, uygulamayı umuda bırak. Aç bir güvertede yemin, en kısa ömürlü sözleşmedir.',
        tag: 'merak',
        effects: { crew: 0, months: 84, crewMul: 0, rationality: 10, curiosity: -3, risk: 5, authority: -30, wrath: 50 },
        outcome:
          'Yemin ettirdin, sonra yorgunluk seni aldı. Uyandığında kıyıda et kokusu vardı: Eurylokhos en iyi ' +
          'sığırları kesmişti, deriler kımıldıyordu, şişteki etler böğürüyordu. Denize açıldığınızda gökyüzü ' +
          'karardı ve tek bir yıldırım gemiyi enkaza çevirdi. Bütün mürettebat gitti. Bir omurga tahtasına ' +
          'tutunan sen, Kalypso\'nun adasında yedi yıl kaldın.',
        analystNote:
          'Kuralı koydun ama denetlemedin. Takvimin en büyük kalemi (+84 ay) ve %100 mürettebat kaybı ' +
          'buradan geldi — canon\'un tek başına Ithaka\'ya varmasının nedeni bu düğüm.'
      },
      {
        id: 'N5-B',
        label: 'Adaya hiç yaklaşma, açlıkla yola devam et',
        hint: 'Kutsal olanla temas yok, kayıp kıtlıktan. Ölçülebilir acı, ölçülemez gazaptan iyidir.',
        tag: 'temkin',
        effects: { crew: -30, months: 2, rationality: 30, curiosity: -10, risk: 10, authority: -25, wrath: 0 },
        variance: { p: 0.40, crew: -45, note: 'Kıtlık uzadı: kırk beş adam daha küreğinde öldü.' },
        outcome:
          'Dümeni kıyıdan çevirdin. İki ay boyunca kemer sıktınız; kırk kadar adam kürek yerinde eridi, ' +
          'geri kalanı seni bir daha eskisi gibi görmedi. Ama gökyüzü sessiz kaldı ve gemi hâlâ senin gemindi.',
        analystNote:
          'Kutsal riski tamamen elemek için ölçülü bir kıtlık maliyeti ödedin. Canon\'un %100 kaybına karşı ' +
          'gemiyi kurtaran karar.'
      },
      {
        id: 'N5-C',
        label: 'Üç gün kal, sadece balık ve kuş avla, rüzgârı bekle',
        hint: 'Yasağa dokunmadan adanın kaynağını kullan. En dar ama en dengeli yol.',
        tag: 'pragmatik',
        effects: { crew: -2, months: 1, rationality: 28, curiosity: 5, risk: -10, authority: 8, wrath: 0 },
        variance: { p: 0.25, crew: -8, note: 'Kayalıkta olta indiren sekiz adam gelgite kapıldı.' },
        outcome:
          'Sürüye yüz adım mesafe koydun, nöbetçi diktin, oltaları ve kuş ağlarını kurdurdun. Üç gün sonra ' +
          'kuzey rüzgârı geldi. Ambar dolu değildi ama boş da değildi; sürü olduğu yerde otluyordu ve ' +
          'güneş bütün gün sizi izledi — kızmadan.',
        analystNote:
          'Yasak, açlık ve takvim arasındaki üçlü kısıtı en düşük toplam maliyetle çözdün. ' +
          'Bu düğümde canon\'a kıyasla en yüksek göreli performans.'
      },
      {
        id: 'N5-D',
        label: 'Sığırları bilerek kes, şölen kur, gazabı göğüsle',
        hint: 'Mürettebatı bugün doyur, faturayı tanrıya kes. Otorite kazanılır, gemi kaybedilir.',
        tag: 'kumar',
        effects: { crew: 0, months: 48, crewMul: 0.05, rationality: -35, curiosity: 10, risk: 45, authority: 15, wrath: 60 },
        fatal: 0.30,
        outcome:
          'İlk kazığı sen çaktın. Güverte üç gün boyunca ilk kez güldü, adamların gözünde tanrılardan da ' +
          'büyüktün. Dördüncü gün deniz kabardı, gökyüzü tek bir çatlak verdi ve o çatlak gemiyi ikiye böldü. ' +
          'Sudan çıkanlar bir elin parmağı kadardı.',
        analystNote:
          'Kutsal yasağı bilerek ihlal ettin: kısa vadeli otorite zıplaması, uzun vadede filonun tamamı. ' +
          'Gazap metriği tavana vurdu.'
      }
    ],
    canonSummary: 'Yasağı ilan etti ama uyudu; mürettebat sığırları yedi: %100 kayıp, +84 ay (Kalypso).'
  }
];

/** Referans değerler — motor çıktısı bunlara karşı doğrulanır. */
export const CANON_REFERENCE = {
  source: "Homeros, Odysseia — Kitap IX, X, XII",
  totalMonths: 120,
  finalCrew: 0,
  crewLossPct: 100,
  arrived: true,
  note: "Odysseus Ithaka'ya 10 yılda ve tek başına ulaştı.",
};
