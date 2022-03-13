/***
 * asset upload route
 */
const formidable = require("formidable");
const fs = require("fs");
const mp3Duration = require("mp3-duration");
const asset = require("./main");
const loadPost = require("../request/post_body");

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.path) {
		case "/api/asset/upload": { // asset uploading
			new formidable.IncomingForm().parse(req, (e, f, files) => {
				const path = files.import.path, buffer = fs.readFileSync(path);
		
				const name = files.import.name;
				const ext = name.substring(name.lastIndexOf(".") + 1);
				let meta;
				switch (ext) {
					case "mp3": {
						mp3Duration(buffer, (e, duration) => {
							if (e || !duration) return;
							meta = {
								type: f.type,
								subtype: f.subtype,
								title: name.substring(0, name.lastIndexOf(".")),
								duration: 1e3 * duration,
								ext: ext,
								tId: "ugc"
							};
							asset.save(buffer, meta);
						});
						break;
					}
					default: {
						meta = {
							type: f.type,
							subtype: f.subtype,
							title: name.substring(0, name.lastIndexOf(".")),
							duration: null,
							ext: ext,
							tId: "ugc"
						}
						asset.save(buffer, meta);
						break;
					}
				}
				fs.unlinkSync(path);
				res.end(JSON.stringify({ status: "ok" }));
			});
			return true;
		}
		case "/goapi/saveWaveform/": { // waveform saving
			loadPost(req, res).then(data => {
				const wf = data.waveform, aId = data.wfid;
				if (asset.load(aId)) asset.saveWf(wf, aId);
				res.end("0");
			});
			return true;
		}
		default: return;
	}
}