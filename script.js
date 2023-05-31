$(function () {
	//values pulled from query string
	setupButtonListeners();
});

var infer = function () {
	$('#output').html("Aguarde...");
	$("#resultContainer").show();
	$('html').scrollTop(100000);

	getSettingsFromForm(function (settings) {
		$.ajax(settings).then(function (response) {
			if (settings.format == "json") {
				var pretty = $('<pre>');
				var formatted = JSON.stringify(response, null, 4)

				pretty.html(formatted);
				$('#output').html("").append(pretty);
				$('html').scrollTop(100000);
			} else {
				var arrayBufferView = new Uint8Array(response);
				var blob = new Blob([arrayBufferView], {
					'type': 'image\/jpeg'
				});
				var base64image = window.URL.createObjectURL(blob);

				var img = $('<img/>');
				img.get(0).onload = function () {
					$('html').scrollTop(100000);
				};
				img.attr('src', base64image);
				$('#output').html("").append(img);
			}
		});
	});
};

var retrieveDefaultValuesFromLocalStorage = function () {
	try {

		var format = localStorage.getItem("rf.format");
		if (format) $('#format').val(format);
	} catch (e) {
		// localStorage disabled
	}

	$('#format').change(function () {
		localStorage.setItem('rf.format', $(this).val());
	});
};

var setupButtonListeners = function () {
	// run inference when the form is submitted
	$('#inputForm').submit(function () {
		infer();
		return false;
	});

	// make the buttons blue when clicked
	// and show the proper "Select file" or "Enter url" state
	$('.btn').click(function () {
		$(this).parent().find('.btn').removeClass('active');
		$(this).addClass('active');

		if ($('#jsonButton').hasClass('active')) {
			$('#imageOptions').hide();
		} else {
			$('#imageOptions').show();
		}

		return false;
	});

	// wire styled button to hidden file input
	$('#fileMock').click(function () {
		$('#file').click();
	});

	// grab the filename when a file is selected
	$("#file").change(function () {
		var path = $(this).val().replace(/\\/g, "/");
		var parts = path.split("/");
		var filename = parts.pop();
		$('#fileName').val(filename);
	});
};

var getSettingsFromForm = function (cb) {
	var settings = {
		method: "POST",
	};

	var parts = [
		"https://detect.roboflow.com/moedas-pmfos/9?api_key=52ZPGjDntv3smMG4Yr7b&confidence=80&overlap=10&format=image&labels=on&stroke=2"
	];

	var format = $('#format .active').attr('data-value');
	parts.push("&format=" + format);
	settings.format = format;

	if (format == "image") {
		settings.xhr = function () {
			var override = new XMLHttpRequest();
			override.responseType = 'arraybuffer';
			return override;
		}
	}


	var file = $('#file').get(0).files && $('#file').get(0).files.item(0);
	if (!file) return alert("Please select a file.");

	getBase64fromFile(file).then(function (base64image) {
		settings.url = parts.join("");
		settings.data = base64image;

		console.log(settings);
		cb(settings);
	});

};

var getBase64fromFile = function (file) {
	return new Promise(function (resolve, reject) {
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function () {
			resizeImage(reader.result).then(function (resizedImage) {
				resolve(resizedImage);
			});
		};
		reader.onerror = function (error) {
			reject(error);
		};
	});
};


var resizeImage = function (base64Str) {

	return new Promise(function (resolve, reject) {
		var img = new Image();
		img.src = base64Str;
		img.onload = function () {
			var canvas = document.createElement("canvas");
			var MAX_WIDTH = 1500;
			var MAX_HEIGHT = 1500;
			var width = img.width;
			var height = img.height;
			if (width > height) {
				if (width > MAX_WIDTH) {
					height *= MAX_WIDTH / width;
					width = MAX_WIDTH;
				}
			} else {
				if (height > MAX_HEIGHT) {
					width *= MAX_HEIGHT / height;
					height = MAX_HEIGHT;
				}
			}
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL('image/jpeg', 1.0));
		};

	});
};
