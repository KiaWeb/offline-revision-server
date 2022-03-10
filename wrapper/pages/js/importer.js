const importer = $("#importer");
const studio = $("#obj");

/**
show and hide
**/
let importerVisible = false;
function showImporter() {
	switch(importerVisible) {
		case true: {
			hideImporter();
			break;
		}
		case false:
		default: {
			importerVisible = true;
			importer.css("width", "400px");
			if (!importer.data("importer"))
				importer.data("importer", new AssetImporter(importer))
			studio.openYourLibrary();
		}
	}
	return true;
}
function hideImporter() {
	importerVisible = false;
	importer.css("width", "");
}

/**
imports media
**/
class AssetImporter {
	constructor(importer) {
		this.importer = importer;
		this.queue = importer.find("#importer-queue");
		this.config = { maxsize: false }
		this.initialize();
	}
	initialize() {
		this.importer.find("#importer-files").on("change", event => {
			//uploads every file
			var fileUpload = document.getElementById("importer-files");
			for (var i = 0; i < fileUpload.files.length; i++) {
				this.addFiles(fileUpload.files[i]);
			}
		});
		this.importer.on("dragover", event => {
			event.preventDefault();
			event.stopPropagation();
		});
		this.importer.on("dragenter", event => {
			event.preventDefault();
			event.stopPropagation();
		})
		this.importer.on("drop", event => {
			event.preventDefault();
			event.stopPropagation();
			const files = event.originalEvent.dataTransfer.files;
			for (var i = 0; i < files.length; i++) {
				this.addFiles(files[i]);
			}
		})
	}
	addFiles(file) { //adds a file to the queue
		//image importing
		const ext = file.name.substring(file.name.lastIndexOf(".") + 1);
		const maxsize = this.config.maxsize
		if (maxsize && file.size > maxsize) return; // check if file is too large
		var validFileType = false;
		let el;
		switch (ext) {
			case "mp3":
			case "wav": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="/pages/img/importer/sound.png" />
							<div>
								<h4>${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
							</div>
						</div>
						<div class="import_as">
							<a href="#" type="bgmusic">Music</a>
							<a href="#" type="soundeffect">Sound effect</a>
							<a href="#" type="voiceover">Voiceover</a>
						</div>
					</div>
				`).appendTo(this.queue);
				break;
			}
			case "jpg":
			case "png": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="/pages/img/importer/image.png" />
							<div>
								<h4>${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
							</div>
						</div>
						<div class="import_as">
							<a href="#" type="bg">Background</a>
							<a href="#" type="prop">Prop</a>
						</div>
					</div>
				`).appendTo(this.queue);
				break;
			}
		}
		if (!validFileType) {
			console.error("Invalid file type!")
			return;
		}
		const request = new ImporterFile(file, el, ext);
	}
}
class ImporterFile {
	constructor(file, element, ext) {
		this.file = file;
		this.el = element;
		this.ext = ext
		this.initialize();
	}
	initialize() {
		switch (this.ext) {
			case "jpg":
			case "png": { // load image preview
				const fr = new FileReader();
				fr.addEventListener("load", (e) => {
					this.el.find("img").attr("src", e.target.result)
				})
				fr.readAsDataURL(this.file)
			}
		}
		this.el.find("[type]").on("click", (event) => {
			const el = $(event.target);
			const type = el.attr("type");
			const t = this.typeFickser(type);
			this.upload(this.file, t);
		});
	}
	typeFickser(type) {
		switch (type) {
			case "bgmusic":
			case "soundeffect":
			case "voiceover": {
				return { type: "sound", subtype: type }
				break;
			}
			case "bg":
			case "prop": {
				return { type: type, subtype: 0 }
				break;
			}
		}
	}
	async upload(file, type) { // adds a file to the queue
		var b = new FormData();
		b.append("import", file);
		b.append("type", type.type);
		b.append("subtype", type.subtype);
		$.ajax({
			url: "/api/asset/upload",
			method: "POST",
			data: b,
			processData: false,
			contentType: false,
			dataType: "json"
		}).done(d => {
			studio[0].importerStatus("done");
			this.el.fadeOut(() => this.el.remove())
		}).catch(e => console.error("Import failed."))
	}
}