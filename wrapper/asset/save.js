/***
 * asset upload route
 */
const formidable = require("formidable");
const fs = require("fs");
const asset = require("./main");

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
		default:
			return;
	}
}