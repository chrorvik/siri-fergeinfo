import { load } from 'cheerio';
import cloudscraper from 'cloudscraper';


const fergekaiz = {
  "molde": {
    "lat": 62.736965,
    "long": 7.169330
  },
  "vestnes": {
    "lat": 62.651511,
    "long": 7.084845
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

export default async (req, res) => {
  const { lat, long } = req.query;

    let closest = [ 'none', 999999 ];

    for (const key in fergekaiz){
      const name = key;
      const { lat: fergeLat, long: fergeLong } = fergekaiz[key];
      const distance = getDistanceFromLatLonInKm(fergeLat, fergeLong, parseFloat(lat), parseFloat(long));
      console.log(distance, "km distance to", name)

      if (closest[1] >= distance) {
        closest = [name, distance];
        console.log("closest:", name)
      }
    }
    const now = new Date();
    const date = new Date(now.toLocaleString("nb-NO", {timeZone: "Europe/Oslo"}));
    
    const hh = date.getHours();
    const mm = date.getMinutes();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    console.log(`Tid og dato: ${day}.${month}.${year} ${hh}:${mm}`);

    let scrapingUrl = `https://frammr.travelplanner.no/scripts/TravelMagic/TravelMagicWE.dll/svar?lang=nn&referrer=frammr.no&dep1=&theme=&from=Vestnes+ferjekai+%28Vestnes%29&to=Molde+ferjekai+%28Molde%29&Time=${hh}:${mm}&Date=${day}.${month}.${year}&now=on&search=Søk&referrer=frammr.no&lang=nn&dep1=&theme=&direction=1&search=Søk&result=0`;
    let finalString = 'Ferge fra Vestnes: ';
    
    if (closest[0] === 'molde') {
      finalString = 'Ferge fra Molde: '
      scrapingUrl = `https://frammr.travelplanner.no/scripts/TravelMagic/TravelMagicWE.dll/svar?lang=nn&referrer=frammr.no&dep1=&theme=&from=Molde+ferjekai+%28Molde%29&to=Vestnes+ferjekai+%28Vestnes%29&Time=${hh}:${mm}&Date=${day}.${month}.${year}&now=on&search=Søk&referrer=frammr.no&lang=nn&dep1=&theme=&direction=1&search=Søk&result=0`;
    }
  
    try {
      const htmlString = await cloudscraper({ uri: scrapingUrl, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = load(htmlString);
      const times = $('.tm-result-fratil');

      times.each((i, timeElement) => {
        if ([0, 2, 4].includes(i)) {
          finalString += $(timeElement).text() + ", ";
        }
      });

      finalString = times.length === 0 ? 'Ingen resultat' : finalString.slice(0, -2);

      res.status(200).send(finalString);

    } catch (e) {
      console.error(e);
      res.status(500).send("En feil oppsto");
    }
};