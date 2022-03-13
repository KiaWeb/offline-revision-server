/***
 * asset api
 */
const fs = require("fs");
const database = require("../data/database"), DB = new database();
const folder = `${__dirname}/../${process.env.CACHÉ_FOLDER}`;
const fUtil = require("../fileUtil");

module.exports = {
	delete(aId) {
		// remove info from database
		const db = DB.get();
		const index = db.assets.findIndex(i => i.id == aId);
		db.assets.splice(index, 1);
		DB.save(db);
		// find file by id and delete it
		var match = false;
		fs.readdirSync(`${folder}`)
			.forEach(filename => {
				if (filename.search(aId) !== -1) match = filename;
			})
		if (match) fs.unlinkSync(`${folder}/${match}`);
	},
	list(type, subtype = null, tId = null) { // very simple thanks to the database
		let aList = DB.get().assets.filter(i => i.type == type);
		// more filters
		if (subtype) aList = aList.filter(i => i.subtype == subtype);
		if (tId) aList = aList.filter(i => i.themeId == tId);
		return aList;
	},
	load(aId) { // look for match in folder
		var match = false;
		fs.readdirSync(`${folder}`)
			.forEach(filename => {
				if (filename.search(aId) !== -1) match = filename;
			})
		return match ? fs.readFileSync(`${folder}/${match}`) : null;
	},
	meta(verse, aId) {
		const met = DB.get().assets.find(i => i.id == aId);
		if (!met) {
			console.error("Asset metadata doesn't exist! Asset id: " + aId);
			return { status: "invalid", message: "invalid_asset" };
		}
		return { // return only the important metadata
			status: "ok",
			data: met
		};
	},
	save(buf, { type, subtype, title, duration, ext, tId }) {
		// save asset info
		const aId = fUtil.generateId();
		const db = DB.get();
		db.assets.push({ // base info, can be modified by the user later
			id: aId,
			enc_asset_id: aId,
			themeId: tId,
			type: type,
			subtype: subtype,
			title: title,
			published: "",
			share: {
				type: "none"
			},
			tags: "",
			duration: duration,
			file: `${id}.${ext}`
		});
		DB.save(db);
		// save the file
		fs.writeFileSync(`${folder}/${aId}.${ext}`, buf);
		return id;
	},
	saveWf(wf, aId) {
		// save the waveform
		fs.writeFileSync(`${folder}/${aId}.wf`, wf);
		return true;
	},
	update(newInf, aId) {
		// set new info and save
		const db = DB.get();
		const met = db.assets.find(i => i.id == aId);
		met.title = newInf.title;
		met.published = newInf.published;
		met.share = newInf.share;
		met.tags = newInf.tags;
		DB.save(db);
		return true;
	}
};