export const PANTHEON = [
  {
    key:'zeus', name:'ZEUS', greek:'ΖΕΥΣ', epithet:'He who gathers the clouds',
    realm:'THE AETHER', stratum:'STRATUM I',
    domains:['Sky','Thunder','Oaths','Kingship','Hospitality'],
    lore:'He rules by weather. A promise made in his name is heard by the air itself, and the air keeps no secrets. The bolt is not a weapon so much as a signature — the moment a broken oath is answered out loud.',
    speech:'Zeus. He who gathers the clouds. He rules by weather, and a promise made in his name is heard by the air itself. The bolt is not a weapon so much as a signature: the moment a broken oath is answered out loud.',
    accent:'#c9a227', accent2:'#f5dc94', fog:'#0a1020',
    chord:[110, 164.81, 220, 329.63], drone:'wind'
  },
  {
    key:'athena', name:'ATHENA', greek:'ΑΘΗΝΑ', epithet:'Grey-eyed, born fully armed',
    realm:'THE CITADEL', stratum:'STRATUM II',
    domains:['Wisdom','Strategy','Craft','The Loom','Just War'],
    lore:'She never fights for the joy of it. Where her half-brother brings slaughter, she brings the plan that makes slaughter unnecessary — and when it is necessary, the plan that ends it in one move. Cities are her real weapon.',
    speech:'Athena. Grey-eyed, born fully armed. She never fights for the joy of it. Where her half-brother brings slaughter, she brings the plan that makes slaughter unnecessary. Cities are her real weapon.',
    accent:'#a9c6e8', accent2:'#e2eefc', fog:'#0a1424',
    chord:[130.81, 196, 261.63, 392], drone:'glass'
  },
  {
    key:'apollo', name:'APOLLO', greek:'ΑΠΟΛΛΩΝ', epithet:'Far-shooter, lord of the lyre',
    realm:'THE MERIDIAN', stratum:'STRATUM III',
    domains:['Light','Music','Prophecy','Healing','Plague'],
    lore:'The same hand tunes the lyre and draws the bow. He gives the cure and he gives the sickness, and at Delphi he gives the truth — phrased so precisely that men walk into their fate while trying to escape it.',
    speech:'Apollo. Far-shooter, lord of the lyre. The same hand tunes the lyre and draws the bow. He gives the cure and he gives the sickness. At Delphi he gives the truth, phrased so precisely that men walk into their fate while trying to escape it.',
    accent:'#ffb03a', accent2:'#ffe0a3', fog:'#140c10',
    chord:[146.83, 220, 293.66, 440], drone:'string'
  },
  {
    key:'poseidon', name:'POSEIDON', greek:'ΠΟΣΕΙΔΩΝ', epithet:'Earth-shaker, tamer of horses',
    realm:'THE DEEP', stratum:'STRATUM IV',
    domains:['The Sea','Earthquakes','Horses','Storms','Springs'],
    lore:'He drew the sea in the lottery of brothers and has resented the sky ever since. Strike the ground with the trident and water answers; strike it harder and the ground answers instead. Sailors bargain. He rarely bargains back.',
    speech:'Poseidon. Earth-shaker, tamer of horses. He drew the sea in the lottery of brothers and has resented the sky ever since. Strike the ground with the trident and water answers. Strike it harder, and the ground answers instead.',
    accent:'#2fb3a8', accent2:'#8ff0e4', fog:'#04141a',
    chord:[98, 146.83, 196, 261.63], drone:'ocean'
  },
  {
    key:'hades', name:'HADES', greek:'ΑΙΔΗΣ', epithet:'The unseen one, host of many',
    realm:'THE ASPHODEL', stratum:'STRATUM V',
    domains:['The Dead','Wealth','Silence','The Oath','Return'],
    lore:'Not a devil — a warden, and a fair one. He keeps what is given and asks for nothing more, which is why his kingdom only grows. His single law is the one everyone breaks: do not look back before the threshold.',
    speech:'Hades. The unseen one, host of many. Not a devil, but a warden, and a fair one. He keeps what is given and asks for nothing more, which is why his kingdom only grows. His single law is the one everyone breaks: do not look back before the threshold.',
    accent:'#c4442a', accent2:'#ff9d6e', fog:'#0d0508',
    chord:[73.42, 110, 146.83, 174.61], drone:'ember'
  }
];

export const N = PANTHEON.length;
export const SPACING_Y = 30;
export const ORBIT_R = 11;
