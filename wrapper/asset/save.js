/***
 * asset upload route
 */
const formidable = require("formidable");
const fs = require("fs");
const asset = require("./main");
const loadPost = require("../request/post_body");

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.path) {
		case "/api/asset/upload": {
			new formidable.IncomingForm().parse(req, (e, f, files) => {
				const path = files.import.path, buffer = fs.readFileSync(path);
		
				const name = files.import.name;
				const meta = {
					type: f.type,
					subtype: f.subtype,
					title: name.substring(0, name.lastIndexOf(".")),
					duration: null,
					ext: name.substring(name.lastIndexOf(".") + 1),
					tId: "ugc"
				}
				asset.save(buffer, meta);
				fs.unlinkSync(path);
				res.end(JSON.stringify({ status: "ok" }));
			});
			return true;
			break;
		}
		case "/goapi/saveTemplate/": {
			loadPost(req, res).then(data => {
				var body = Buffer.from(data.body_zip, "base64");
				var thumb = Buffer.from(data.thumbnail_large, "base64");
				asset
					.saveStarter(body, thumb, data.movieId || null)
					.then(nId => res.end("0" + nId))
					.catch(err => {
						if (process.env.NODE_ENV == "dev") throw err;
						console.error("Error saving starter: " + err)
						res.end("1")
					});
			});
			return true;
			break;
		}
		default:
			return;
	}
}