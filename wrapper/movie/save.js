const loadPost = require("../request/post_body");
const movie = require("./main");

module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/saveMovie/") return;
	loadPost(req, res).then(data => {
		const trigAutosave = data.is_triggered_by_autosave;
		if (trigAutosave && !data.movieId)
			return res.end("0");

		var body = Buffer.from(data.body_zip, "base64");
		console.log(data)
		var thumb = Buffer.from(data.thumbnail_large, "base64");
		movie
			.save(body, thumb, data.movieId || null)
			.then(nId => res.end("0" + nId))
			.catch(e => res.end("1"));
	});
	return true;

}