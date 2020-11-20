const http = require('http');
const fs = require('fs');

let a = {
  "error": 0,
  "status": "success",
  "date": "2020-11-09",
  "results": [
    {
      "currentCity": "石家庄市",
      "pm25": "106",
      "index": [],
      "weather_data": [
        {
          "date": "周三 09月16日 (实时：25℃)",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "西北风3-4级",
          "temperature": "27 ~ 16℃"
        },
        {
          "date": "周四",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "北风3-4级",
          "temperature": "27 ~ 18℃"
        },
        {
          "date": "周五",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "北风3-4级",
          "temperature": "29 ~ 17℃"
        },
        {
          "date": "周六",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "南风微风",
          "temperature": "30 ~ 18℃"
        }
      ]
    }
  ]
}

const server = http.createServer(async (req, res) => {
  console.log('接受到请求')
  console.log(req.headers, '请求')
  // res.setHeader('Content-Type', 'text/html');
  // res.setHeader('Content-Type', 'text/plain');
  // res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  // res.writeHead(200, { 'Content-Type': 'application/json' })
  let html = fs.readFileSync('./index.html').toString('utf8')
  res.end(
    // JSON.stringify(a)

    // `hello http 哈哈`

    // `{"error":0,"status":"success","date":"2020-11-09","results":[{"currentCity":"石家庄市","pm25":"106","index":[],"weather_data":[{"date":"周三 09月16日 (实时：25℃)","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"西北风3-4级","temperature":"27 ~ 16℃"},{"date":"周四","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"北风3-4级","temperature":"27 ~ 18℃"},{"date":"周五","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"北风3-4级","temperature":"29 ~ 17℃"},{"date":"周六","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"南风微风","temperature":"30 ~ 18℃"}]}]}`

    html

  )
});
server.listen(8080, () => {
  console.log(`120.0.0.1:8080`)
})