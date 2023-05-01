process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
const http = require("http")
const url = require('url')
const cheerio = require('cheerio')
const cloudscraper = require('cloudscraper')

const port = 7654

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
  var R = 6371
  var dLat = (lat2-lat1) * (Math.PI/180)
  var dLon = (lon2-lon1) * (Math.PI/180)
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  var d = R * c
  return d
}

var server = http.createServer((req, res) => {
  var queryString = url.parse(req.url, true).query

  if (url.parse(req.url).pathname == '/'){

    var closest = [ 'none', 999999 ]

    for (const key in fergekaiz){
      var name = key
      var lat = fergekaiz[key].lat
      var long = fergekaiz[key].long
      var dist = getDistanceFromLatLonInKm(lat, long, queryString.lat, queryString.long)
      console.log(dist, "km distance to", name)

      if (closest[1] >= dist){
        closest[1] = dist
        closest[0] = name
        console.log("closest:", name)
      }
    }
    var d = new Date()
    var hh = d.getHours()
    var mm = d.getMinutes()
    var day = d.getDate()
    var month = d.getMonth()+1
    var year = d.getFullYear()

    var scrapingUrl = `https://frammr.travelplanner.no/scripts/TravelMagic/TravelMagicWE.dll/svar?lang=nn&referrer=frammr.no&dep1=&theme=&from=Vestnes+ferjekai+%28Vestnes%29&to=Molde+ferjekai+%28Molde%29&Time=${hh}:${mm}&Date=${day}.${month}.${year}&now=on&search=Søk&referrer=frammr.no&lang=nn&dep1=&theme=&direction=1&search=Søk&result=0`
    var finalString = 'Neste i fra Vestnes: '
    if (closest[0] == 'molde') {
      finalString = 'Neste i fra Molde: '
      scrapingUrl = `https://frammr.travelplanner.no/scripts/TravelMagic/TravelMagicWE.dll/svar?lang=nn&referrer=frammr.no&dep1=&theme=&from=Molde+ferjekai+%28Molde%29&to=Vestnes+ferjekai+%28Vestnes%29&Time=${hh}:${mm}&Date=${day}.${month}.${year}&now=on&search=Søk&referrer=frammr.no&lang=nn&dep1=&theme=&direction=1&search=Søk&result=0`
    }

    cloudscraper({ uri: scrapingUrl, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36' } }).then(function(htmlString){
      const $ = cheerio.load(htmlString)
      const times = $('.tm-result-fratil')
      
      times.each((i, tid) => {
        if (i == 0 || i == 2 || i == 4){
          console.log(i, $(tid).text())
          finalString += $(tid).text() + ", "
        }
         
      })

      if (times.length == 0){
        finalString = 'Ingen resultat'
      }
      res.writeHead(200)
      res.end(finalString.substring(0, finalString.length-2))
    }).catch((e) => console.log(e))
  }
})

server.listen(port)