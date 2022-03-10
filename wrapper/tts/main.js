const voices = require('./info').voices;
const get = require('../request/get');
const qs = require('querystring');
const https = require('https');

module.exports = function (voiceName, text) {
	return new Promise((res, rej) => {
		const voice = voices[voiceName];
		switch (voice.source) {
			case 'polly': {
				/**
				 * Does a POST request to https://pollyvoices.com/.
				 * The response is a redirect to /play/(id).mp3.
				 * Then it gets the redirect link and removes the "/play" part and requests that URL, which returns the file.
				 * 
				 * Example: (path - method - data - headers (optional))
				 * / - POST - text=(text)&voice=(voice)
				 * 	   Redirected to /play/(id)
				 * /(id) - GET
				 *     File
				 */
				const params = new URLSearchParams({
					"text": text,
					"voice": voice.arg
				}).toString();
				var req = https.request(
					{
						hostname: "pollyvoices.com",
						port: "443",
						path: "/",
						method: "POST",
						headers: {
							"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
							"Content-Type": "application/x-www-form-urlencoded",
							"Host": "pollyvoices.com",
							"Origin": "https://pollyvoices.com",
							"Referer": "https://pollyvoices.com/",
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0"
						}
					},
					(r) => {
						const file = r.headers.location.substring(6);
						r.on("data", (b) => {
							get(`https://pollyvoices.com/${file}`)
								.then(buffer => res(buffer, voice.desc))
								.catch(err => rej(err));
						});
						r.on("error", (err) => rej("Unable to generate TTS. Please check your internet connection."));
					}
				);
				req.write(params);
				req.end();
				break;
			}
			case 'cepstral':
			case 'voiceforge': {
				var q = new URLSearchParams({
					voice: voice.arg,
					msg: text,
				}).toString();
				http.get(
					{
						host: "127.0.0.1",
						port: "8181",
						path: `/vfproxy/speech.php?${q}`,
					},
					(r) => {
						var buffers = [];
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => res(Buffer.concat(buffers)));
						r.on("error", rej);
					}
				);
				break;
			}
			case 'vocalware': {
				var q = qs.encode({
					EID: voice.arg[0],
					LID: voice.arg[1],
					VID: voice.arg[2],
					TXT: text,
					IS_UTF8: 1,
					HTTP_ERR: 1,
					ACC: 3314795,
					API: 2292376,
					vwApiVersion: 2,
					CB: 'vw_mc.vwCallback',
				});
				var req = https.get({
					host: 'cache-a.oddcast.com',
					path: `/tts/gen.php?${q}`,
					method: 'GET',
					headers: {
						Referer: 'https://www.vocalware.com/index/demo',
						Origin: 'https://www.vocalware.com',
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
					},
				}, r => {
					var buffers = [];
					r.on('data', d => buffers.push(d));
					r.on('end', () => res(Buffer.concat(buffers)));
					r.on('error', rej);
				});
				break;
			}
			case 'voicery': {
				var q = qs.encode({
					text: text,
					speaker: voice.arg,
					ssml: text.includes('<'),
				});
				https.get({
					host: 'www.voicery.com',
					path: `/api/generate?${q}`,
				}, r => {
					var buffers = [];
					r.on('data', d => buffers.push(d));
					r.on('end', () => res(Buffer.concat(buffers)));
					r.on('error', rej);
				});
				break;
			}
			case 'watson': {
				var q = qs.encode({
					text: text,
					voice: voice.arg,
					download: true,
					accept: "audio/mp3",
				});
				console.log(https.get({
					host: 'text-to-speech-demo.ng.bluemix.net',
					path: `/api/v1/synthesize?${q}`,
					headers: {
						Referer: 'https://www.vocalware.com/index/demo',
						Origin: 'https://www.vocalware.com',
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
					},
				}, r => {
					var buffers = [];
					r.on('data', d => buffers.push(d));
					r.on('end', () => res(Buffer.concat(buffers)));
					r.on('error', rej);
				}));
				break;
			}
		}
	});
}
