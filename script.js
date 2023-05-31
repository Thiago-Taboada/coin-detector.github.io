$(function () {
	setupButtonListeners();
});

// Função principal para Calcular resultado
var infer = function () {
	$('#outputTotal').html("Aguarde...");
	$("#resultContainer").show();
	$('html').scrollTop(100000);

	var count = 0; // Variável para armazenar a contagem

	// Função para obter as configurações em JSON para a contagem do valor total
	settingsJson(function (settings) {
		// Realiza uma requisição AJAX usando as configurações obtidas
		$.ajax(settings).then(function (response) {
			var pretty = $('<pre>');
			var formatted = JSON.stringify(response, null, 4);
			// Verifica cada uma das previsões retornadas na resposta
			response.predictions.forEach(function (prediction) {
				// Atualiza a contagem com base na classe de cada previsão
				if (prediction.class === "1 Real") {
					count+= 1;
				} else if (prediction.class === "50 Cent") {
					count += 0.5;
				} else if (prediction.class === "25 Cent") {
					count += 0.25;
				}else if (prediction.class === "10 Cent") {
					count += 0.1;
				}else if (prediction.class === "5 Cent") {
					count += 0.05;
				}
			});

			var valorTotal = count; // Valor total calculado com base na contagem
			
			var textoTotal = "Valor total aproximado: R$ " + valorTotal.toFixed(2);
			
			$('#outputTotal').html(textoTotal);
			$('html').scrollTop(100000);
		});
	});

	// Função para obter as configurações do formulário
	getSettingsFromForm(function (settings) {
		// Realiza uma requisição AJAX usando as configurações obtidas
		$.ajax(settings).then(function (response) {
			// Verifica o formato das configurações (JSON ou IMG)
			if (settings.format == "json") {
				var pretty = $('<pre>');
				var formatted = JSON.stringify(response, null, 4)

				pretty.html(formatted);
				$('#outputRes').html("").append(pretty);
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
				$('#outputRes').html("").append(img);
			}
		});
	});
};

// Função para recuperar os valores padrão do armazenamento local (localStorage)
var retrieveDefaultValuesFromLocalStorage = function () {
	try {
		// Recupera o valor de formato do armazenamento local
		var format = localStorage.getItem("rf.format");
		if (format) $('#format').val(format);
	} catch (e) {
	}

	// Monitora a alteração do elemento e atualiza o valor no armazenamento local
	$('#format').change(function () {
		localStorage.setItem('rf.format', $(this).val());
	});
};

// Função para configurar os listeners
var setupButtonListeners = function () {
	// Ouve os eventos de envio, clicks nos botoes e alteraçoes no formulario e chama a função infer()
	$('#inputForm').submit(function () {
		infer();
		return false;
	});

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

	$('#fileMock').click(function () {
		$('#file').click();
	});

	$("#file").change(function () {
		var path = $(this).val().replace(/\\/g, "/");
		var parts = path.split("/");
		var filename = parts.pop();
		$('#fileName').val(filename);
	});
};

// Função para obter as configurações do formulário
var getSettingsFromForm = function (cb) {
	var settings = {
		method: "POST",
	};

	var parts = [
		"https://detect.roboflow.com/moedas-pmfos/9?api_key=52ZPGjDntv3smMG4Yr7b&confidence=80&overlap=10&format=image&labels=on&stroke=1"
	];

	var format = $('#format .active').attr('data-value');
	parts.push("&format=" + format);
	settings.format = format;

	if (format == "image") {
		// Define a função xhr para lidar com a resposta em formato de array de bytes
		settings.xhr = function () {
			var override = new XMLHttpRequest();
			override.responseType = 'arraybuffer';
			return override;
		}
	}

	var file = $('#file').get(0).files && $('#file').get(0).files.item(0);
	if (!file) return alert("Please select a file.");

	// Converte o arquivo para base64
	getBase64fromFile(file).then(function (base64image) {
		settings.url = parts.join("");
		settings.data = base64image;

		console.log(settings);
		cb(settings);
	});

};

// Função para obter as configurações em JSON do formulario
var settingsJson = function (cb) {
	var settings = {
		method: "POST",
	};

	var parts = [
		"https://detect.roboflow.com/moedas-pmfos/9?api_key=52ZPGjDntv3smMG4Yr7b&confidence=80&overlap=10&format=image&labels=on&stroke=1&format=json"
	];

	var file = $('#file').get(0).files && $('#file').get(0).files.item(0);
	if (!file) return alert("Please select a file.");

	// Converte o arquivo para base64
	getBase64fromFile(file).then(function (base64image) {
		settings.url = parts.join("");
		settings.data = base64image;

		console.log(settings);
		cb(settings);
	});

};

// Função para converter o arquivo para base64
var getBase64fromFile = function (file) {
	return new Promise(function (resolve, reject) {
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function () {
			// Redimensiona a imagem
			resizeImage(reader.result).then(function (resizedImage) {
				resolve(resizedImage);
			});
		};
		reader.onerror = function (error) {
			reject(error);
		};
	});
};

// Função para redimensionar a imagem para um tamanho máximo
var resizeImage = function (base64Str) {

	return new Promise(function (resolve, reject) {
		var img = new Image();
		img.src = base64Str;
		img.onload = function () {
			var canvas = document.createElement("canvas");
			var MAX_WIDTH = 600;
			var MAX_HEIGHT = 600;
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
			// Converte o canvas para base64 com
			resolve(canvas.toDataURL('image/jpeg', 1.0));
		};

	});
};
