export type WeatherType = 'sunny' | 'rain' | 'snow' | 'night';

export type SceneMode =
  | 'city'
  | 'hotel'
  | 'restaurant'
  | 'cinema'
  | 'mandir'
  | 'police'
  | 'plane'
  | 'train'
  | 'library'
  | 'pool'
  | 'jhoola'
  | 'game'
  | 'stadium'
  | 'natak'
  | 'gym'
  | 'aspatal'
  | 'school'
  | 'mall'
  | 'estate'
  | 'bank'
  | 'petrol'
  | 'metro'
  | 'bus'
  | 'park'
  | 'kirana'
  | 'mithai'
  | 'kapda'
  | 'fire';

export interface LocationInfo {
  id: SceneMode;
  nameHindi: string;
  nameEng: string;
  icon: string;
  category: 'core' | 'activity' | 'service' | 'transport';
  tagline: string;
  coords?: [number, number, number];
}

export const CITY_LOCATIONS: LocationInfo[] = [
  { id: 'mandir', nameHindi: '🛕 मंदिर (पूजा व आरती)', nameEng: 'Temple Sanctum', icon: '🛕', category: 'core', tagline: 'दीये, आरती, घंटी और पूजा करते भक्त', coords: [-55, 13, -38] },
  { id: 'police', nameHindi: '🚓 पुलिस स्टेशन व जेल', nameEng: 'Police Station & Jail', icon: '🚓', category: 'core', tagline: 'चोर को पकड़कर जेल की सलाखों में बंद करना', coords: [-50, 6, -11] },
  { id: 'hotel', nameHindi: '🏨 होटल अपना', nameEng: 'Hotel Apna', icon: '🏨', category: 'core', tagline: 'लक्ज़री लाउंज, रिसेप्शन और खाते-पीते मेहमान', coords: [-54, 12, 14] },
  { id: 'restaurant', nameHindi: '🍽️ रेस्टोरेंट (लाइव किचन)', nameEng: 'Restaurant & Dining', icon: '🍽️', category: 'core', tagline: 'कड़ाही की लपटें, स्वादिष्ट खाना और वेटर', coords: [-12, 6, 70] },
  { id: 'cinema', nameHindi: '🎬 सिनेमा हॉल / थिएटर', nameEng: 'Cinema Theater', icon: '🎬', category: 'activity', tagline: 'रंगीन स्क्रीन, तालियां बजाते व उठते-बैठते दर्शक', coords: [21, 7, -9] },
  { id: 'library', nameHindi: '📚 पुस्तकालय (लाइब्रेरी)', nameEng: 'Grand Library', icon: '📚', category: 'core', tagline: 'किताबों की अलमारियां व पन्ने पलटते पाठक', coords: [12, 7, 70] },
  { id: 'pool', nameHindi: '🏊 स्विमिंग पूल', nameEng: 'Olympic Swimming Pool', icon: '🏊', category: 'activity', tagline: 'तैराकी करते तैराक और डाइविंग बोर्ड से छलांग', coords: [-12, 5, 88] },
  { id: 'jhoola', nameHindi: '🎡 मेला व झूले', nameEng: 'Carnival & Swings', icon: '🎡', category: 'activity', tagline: 'विशाल चरखी, उड़ते झूले और आनंद लेते बच्चे', coords: [-35, 22, -38] },
  { id: 'plane', nameHindi: '✈️ हवाई जहाज़ की उड़ान', nameEng: 'Airplane Flight', icon: '✈️', category: 'transport', tagline: 'बादलों के बीच उड़ते हुए खिड़की से नज़ारे', coords: [58, 40, 20] },
  { id: 'train', nameHindi: '🚆 ट्रेन का सफर', nameEng: 'Train Ride', icon: '🚆', category: 'transport', tagline: 'चलती ट्रेन और खिड़की से दिखता हरा-भरा दृश्य', coords: [25, 5, -29] },
  { id: 'stadium', nameHindi: '🏟️ फुटबॉल स्टेडियम', nameEng: 'Soccer Stadium', icon: '🏟️', category: 'activity', tagline: 'गोल करते खिलाड़ी, गूंजता मैदान और ट्रॉफी', coords: [125, 20, 95] },
  { id: 'game', nameHindi: '🎮 गेम ज़ोन व आर्केड', nameEng: 'Arcade Game Zone', icon: '🎮', category: 'activity', tagline: 'आर्केड मशीनें, टेबल टेनिस और कैरम', coords: [0, 6, 106] },
  { id: 'natak', nameHindi: '🎭 नाट्यशाला (थिएटर)', nameEng: 'Live Stage Theater', icon: '🎭', category: 'activity', tagline: 'तलवारबाज़ी नाटक और तालियां बजाती जनता', coords: [12, 8, 88] },
  { id: 'gym', nameHindi: '💪 फिटनेस जिम', nameEng: 'Fitness Gym', icon: '💪', category: 'activity', tagline: 'ट्रेडमिल, वेट लिफ्टिंग और कसरत', coords: [-17, 6, 12] },
  { id: 'aspatal', nameHindi: '🏥 ज़िला अस्पताल', nameEng: 'City Hospital', icon: '🏥', category: 'service', tagline: 'मरीजों के बेड, डॉक्टर और नर्स', coords: [-37, 10, 13] },
  { id: 'park', nameHindi: '🌳 पार्क व योग स्थल', nameEng: 'Central Park', icon: '🌳', category: 'activity', tagline: 'सैर, योग, बत्तखें और उड़ती पतंग', coords: [-86, 8, 52] },
  { id: 'school', nameHindi: '🏫 सरकारी स्कूल', nameEng: 'Public School', icon: '🏫', category: 'service', tagline: 'कक्षा, ब्लैकबोर्ड और हाथ उठाते छात्र', coords: [-76, 8, 16] },
  { id: 'mall', nameHindi: '🛍️ सिटी मॉल', nameEng: 'City Mall', icon: '🛍️', category: 'service', tagline: 'एस्केलेटर, फव्वारा और खरीदार', coords: [96, 12, -10] },
  { id: 'bank', nameHindi: '🏦 सिटी बैंक', nameEng: 'City Bank', icon: '🏦', category: 'service', tagline: 'कैशियर काउंटर और बड़ा लॉकर वॉल्ट', coords: [96, 8, 10] },
  { id: 'petrol', nameHindi: '⛽ पेट्रोल पंप', nameEng: 'Fuel Station', icon: '⛽', category: 'service', tagline: 'गाड़ियों में पेट्रोल भरते कर्मचारी', coords: [75, 8, -12] },
  { id: 'metro', nameHindi: '🚇 मेट्रो ट्रेन', nameEng: 'Metro Train', icon: '🚇', category: 'transport', tagline: 'एलिवेटेड ट्रैक पर दौड़ती आधुनिक मेट्रो', coords: [10, 17, -65] },
  { id: 'bus', nameHindi: '🚌 नगर बस अड्डा', nameEng: 'Bus Terminal', icon: '🚌', category: 'transport', tagline: 'सवारी बस और चलते यात्री', coords: [-72, 7, -12] },
  { id: 'fire', nameHindi: '🚒 अग्निशमन केंद्र', nameEng: 'Fire Station', icon: '🚒', category: 'service', tagline: 'दमकल गाड़ी और तत्पर जवान', coords: [9, 5, -11] },
];
