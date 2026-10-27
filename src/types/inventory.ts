export interface InventoryItem {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  icon: string;
  source: string;
  category: 'trophy' | 'sacred' | 'ticket' | 'food' | 'artifact';
  unlockedAt?: string;
  count: number;
}

export const INITIAL_ITEMS_CATALOG: Record<string, Omit<InventoryItem, 'count' | 'unlockedAt'>> = {
  temple_prasad: {
    id: 'temple_prasad',
    name: 'Sacred Temple Prasad & Rudraksha',
    hindiName: 'पवित्र प्रसाद व रुद्राक्ष माला',
    description: 'मंदिर में दीप प्रज्वलित कर आरती करने और भक्ति भाव से मिला दिव्य प्रसाद।',
    icon: '🛕',
    source: 'मंदिर (Mandir)',
    category: 'sacred',
  },
  cinema_ticket: {
    id: 'cinema_ticket',
    name: 'Golden Cinema Ticket & Popcorn',
    hindiName: 'गोल्डन सिनेमा टिकट व पॉपकॉर्न',
    description: 'थिएटर में हाउसफुल शो की वीआईपी सीट और गरमागरम बटर पॉपकॉर्न।',
    icon: '🍿',
    source: 'सिनेमा हॉल (Cinema)',
    category: 'ticket',
  },
  football_trophy: {
    id: 'football_trophy',
    name: 'Nagri Soccer Champion Cup',
    hindiName: 'नगरी फुटबॉल चैंपियन कप',
    description: 'महा स्टेडियम में सटीक पेनल्टी किक लगाकर गोल दागने पर मिली भव्य स्वर्ण ट्रॉफी।',
    icon: '🏆',
    source: 'फुटबॉल स्टेडियम (Stadium)',
    category: 'trophy',
  },
  cricket_bat: {
    id: 'cricket_bat',
    name: 'Master Willow Cricket Bat',
    hindiName: 'गोल्डन मास्टर बल्ला',
    description: 'क्रिकेट मैदान पर तूफानी छक्का जड़ने पर प्राप्त हुआ विशेष क्रिकेट बल्ला।',
    icon: '🏏',
    source: 'क्रिकेट मैदान (Cricket)',
    category: 'trophy',
  },
  police_badge: {
    id: 'police_badge',
    name: 'Honorary Police Star Badge',
    hindiName: 'ऑनरेरी पुलिस स्टार बैज',
    description: 'पुलिस स्टेशन में चोर को सलाखों के पीछे सुरक्षित बंद कराने के लिए वीरता सम्मान।',
    icon: '⭐',
    source: 'पुलिस थाना (Police Station)',
    category: 'trophy',
  },
  plane_ticket: {
    id: 'plane_ticket',
    name: 'Sky-High Flight Boarding Pass',
    hindiName: 'विमान प्रथम श्रेणी बोर्डिंग पास',
    description: 'हवाई जहाज़ में बादलों के ऊपर रोमांचक उड़ान का आधिकारिक वीआईपी पास।',
    icon: '✈️',
    source: 'हवाई अड्डा (Airplane)',
    category: 'ticket',
  },
  library_book: {
    id: 'library_book',
    name: 'Ancient Codex of City Architecture',
    hindiName: 'नगरी ज्ञान ग्रंथ (लाइब्रेरी बुक)',
    description: 'भव्य पुस्तकालय की अलमारी से खोजी गई दुर्लभ और ज्ञानवर्धक ऐतिहासिक पुस्तक।',
    icon: '📖',
    source: 'पुस्तकालय (Library)',
    category: 'artifact',
  },
  swimmer_medal: {
    id: 'swimmer_medal',
    name: 'Olympic Gold Swimmer Medal',
    hindiName: 'गोल्ड स्विमर पदक',
    description: 'स्विमिंग पूल में शानदार तैराकी और ऊंचे डाइविंग बोर्ड से साहसिक छलांग का पदक।',
    icon: '🥇',
    source: 'स्विमिंग पूल (Pool)',
    category: 'trophy',
  },
  royal_thali: {
    id: 'royal_thali',
    name: 'Nagri Royal Feast (Shahi Thali)',
    hindiName: 'शाही दावत थाली व मिठाई',
    description: 'रेस्टोरेंट के कुशल शेफ द्वारा गरमागरम मसालों से तैयार की गई लज़ीज़ थाली।',
    icon: '🍽️',
    source: 'रेस्टोरेंट (Restaurant)',
    category: 'food',
  },
  hotel_keycard: {
    id: 'hotel_keycard',
    name: 'Penthouse VIP Keycard',
    hindiName: 'पेंटहाउस सुइट की-कार्ड',
    description: 'होटल अपना की सर्वोच्च मंज़िल के लग्ज़री सुइट का डिजिटल गोल्ड की-कार्ड।',
    icon: '🔑',
    source: 'होटल अपना (Hotel)',
    category: 'artifact',
  },
  carnival_token: {
    id: 'carnival_token',
    name: 'Golden Ferris Wheel Token',
    hindiName: 'मेला झूला गोल्डन कॉइन',
    description: 'मेले के विशालकाय झूले और उड़ती चरखी की सवारी का जादुई टिकट कॉइन।',
    icon: '🎡',
    source: 'मेला झूला (Carnival)',
    category: 'ticket',
  },
  arcade_token: {
    id: 'arcade_token',
    name: 'Retro Arcade Champion Token',
    hindiName: 'रेट्रो आर्केड चैंपियन टोकन',
    description: 'गेम ज़ोन में 8-बिट रेट्रो रनर गेम में शानदार हाई-स्कोर बनाने पर मिला टोकन।',
    icon: '🎮',
    source: 'गेम ज़ोन (Game Zone)',
    category: 'trophy',
  },
};
