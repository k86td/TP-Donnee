const periodicRefreshPeriod = 15;
let holdCheckETag = false;
let currentETag = "";
let createMode = true;
let searchCategory = "";
let searchTitle = "";
let hideSearchBar = true;
let imageIdToDelete = 0; // used by confirmDeleteDlg
let selectedCategory = "";
let imagesCount = 50;
let appendCount = 3;
let previousScrollPosition = 0;
let appendMode = false;

init_UI();
HEAD(checkETag, error);
setInterval(() => { HEAD(checkETag, error) }, periodicRefreshPeriod * 1000);

function checkETag(ETag) {
	if (!holdCheckETag && ETag != currentETag) {
		currentETag = ETag;
		getImagesList();
	}
}

function getImagesList(refresh = true) {
	appendMode = !refresh;
	function prepareQueryString() {
		let queryString = "";
		if (appendMode) {
			queryString = `?sort=Date,desc&offset=${Math.trunc(imagesCount / appendCount)}&limit=${appendCount}`;
			imagesCount += appendCount;
		} else {
			queryString = `?sort=Date,desc&offset=${0}&limit=${imagesCount}`;
		}
		return queryString;
	}
	GET_ALL(refreshimagesList, error, prepareQueryString());
}
function refreshimagesList(images, ETag) {
	function insertIntoImageList(image) {

		$("#imagesList").append(
			$(` 
                                <div class='imageLayout'>
                                    <div class='imageHeader'>
                                        <div class="imageTitle">${image.Title}</div>
                                        <div    class="cmd editCmd  fa fa-pencil-square" 
                                                imageid="${image.Id}" 
                                                title="Editer ${image.Title}" 
                                                data-toggle="tooltip">
                                        </div>
                                        <div    class="cmd deleteCmd fa fa-window-close" 
                                                imageid="${image.Id}" 
                                                title="Effacer ${image.Title}" 
                                                data-toggle="tooltip">
                                        </div>
                                    </div>
                                    <a href="${image.OriginalURL}" target="_blank">
                                        <div    class='image' 
                                                style="background-image:url('${image.ThumbnailURL}')">
                                        </div>
                                    </a>
                                    <div class="imageDate">${convertToFrenchDate(parseInt(image.Date))}</div>
                                </div>
                        `)
		);
	}
	currentETag = ETag;
	previousScrollPosition = $(".scrollContainer").scrollTop();
	if (!appendMode) $("#imagesList").empty();

	if (appendMode && images.length == 0)
		imagesCount -= appendCount;

	for (let image of images) {
		insertIntoImageList(image);
	}

	$(".scrollContainer").scrollTop(previousScrollPosition);
	$(".editCmd").off();
	$(".deleteCmd").off();
	$(".showMore").off();
	$(".editCmd").click(e => { editimage(e) });
	$(".deleteCmd").click(e => { deleteimage(e) });

	$('[data-toggle="tooltip"]').tooltip();
}

function error(status) {
	let errorMessage = "";
	switch (status) {
		case 0:
			errorMessage = "Le service ne répond pas";
			break;
		case 401:
			errorMessage = "Requête non autorisée";
			break;
		case 400:
		case 422:
			errorMessage = "Requête invalide";
			break;
		case 404:
			errorMessage = "Service ou données introuvables";
			break;
		case 409:
			errorMessage = "Conflits de données: Hyperlien existe déjà";
			break;
		case 500:
			errorMessage = "Erreur interne du service";
			break;
		default:
			errorMessage = "Une erreur est survenue";
			break;
	}
	$("#errorMessage").text(errorMessage);
	$("#errorDlg").dialog('open');
}

function newAccount() {
	ImageUploader.imageRequired('imageAvatar', true);
	accountToForm();
	$("#newAccountDlg").dialog('option', 'title', 'Inscription');
	$("#newAccountDlg").dialog('open');
}

function loginDlg () {
	$('#emailLogin').val('');
	$('#passwordLogin').val('');
	$('#accountLoginDlg').dialog('open');
}

function newImage() {
	holdCheckETag = true;
	createMode = true;
	resetimageForm();
	ImageUploader.imageRequired('image', true);
	$("#imageDlg").dialog('option', 'title', "Ajout d'image");
	$("#imageDlgOkBtn").text("Ajouter");
	$("#imageDlg").dialog('open');
}
function editimage(e) {
	holdCheckETag = true;
	createMode = false;
	GET_ID(e.target.getAttribute("imageid"), imageToForm, error);
	holdCheckETag = true;
	ImageUploader.imageRequired('image', false);
	$("#imageDlg").dialog('option', 'title', "Modification d'image");
	$("#imageDlgOkBtn").text("Modifier");
	$("#imageDlg").dialog('open');
}
function deleteimage(e) {
	holdCheckETag = true;
	imageIdToDelete = e.target.getAttribute("imageid")
	GET_ID(
		imageIdToDelete,
		image => {
			$("#confirmationMessage").html("Voulez-vous vraiment effacer l'image <br><b>" + image.Title + "</b>?")
		},
		error
	);
	holdCheckETag = true;
	$("#confirmDlg").dialog('option', 'title', "Retrait d'image'...");
	$("#confirmDeleteDlgOkBtn").text("Effacer");
	$("#confirmDeleteDlg").dialog('open');
}
function resetimageForm() {
	$("#Id_input").val("0");
	$("#GUID_input").val("");
	$("#date_input").val(Date.now());
	$("#title_input").val("");
	$("#description_input").val("");
	ImageUploader.resetImage('image');
}
function imageFromForm() {
	if ($("#imageForm")[0].checkValidity()) {
		let image = {
			Id: parseInt($("#Id_input").val()),
			GUID: $("#GUID_input").val(),
			Title: $("#title_input").val(),
			Description: $("#description_input").val(),
			ImageData: ImageUploader.getImageData('image'),
			Date: parseInt($("#date_input").val())
		};
		return image;
	} else {
		$("#imageForm")[0].reportValidity()
	}
	return false;
}
function imageToForm(image) {
	$("#Id_input").val(image.Id);
	$("#GUID_input").val(image.GUID);
	$("#date_input").val(image.Date);
	//$("#date_input").val(Date.now());
	$("#title_input").val(image.Title);
	$("#description_input").val(image.Description);
	ImageUploader.setImage('image', image.OriginalURL);
}
function accountFromForm() {

	if ($("#newAccountForm")[0].checkValidity()) {
		let id = $("#Id").val() ? $("#Id").val() : 0;
		let name = $("#name").val();
		let email = $("#email").val();
		let password = $("#password").val();
		let avatar = ImageUploader.getImageData('imageAvatar');

		return {
			"Id": id,
			"Name": name,
			"Email": email,
			"Password": password,
			"ImageData": avatar
		};
	}
	else
		$("#newAccountForm")[0].reportValidity()
}
function accountToForm(previousInfo = undefined) {
	if (previousInfo == undefined) {
		// clear form
		$("#Id").val("");
		$("#name").val("");
		$("#email").val("");
		$("#password").val("");
		ImageUploader.resetImage('imageAvatar');
	}
}

const _passwordMismatchErrorMessage = "La confirmation du mot de passe n'est pas identitque au mot de passe";
function setPasswordConfirmationFor (password, confirmation) {
	let pwd = document.getElementById(password);
	let conf = document.getElementById(confirmation);

	const passwordConfirmationHandler = () => {
		if (pwd.value != conf.value)
			conf.setCustomValidity(_passwordMismatchErrorMessage);
		else
			conf.setCustomValidity("");
	};

	pwd.onchange = passwordConfirmationHandler;
	conf.onkeyup = passwordConfirmationHandler;
}

function loginHandler () {
	if (document.getElementById('accountLoginForm').reportValidity()) {
		let email = $("#emailLogin").val();
		let password = $("#passwordLogin").val();

		uPost('/token', { "Email" : email, "Password" : password });
	}
}



function init_UI() {
	setPasswordConfirmationFor('password', 'password_confirmation');

	$("#newImageCmd").click(newImage);
	$("#newAccountCmd").click(newAccount);
	$("#loginAccountCmd").click(loginDlg);

	$("#newAccountDlg").dialog({
		title: "...",
		autoOpen: false,
		modal: true,
		show: { effect: 'fade', speed: 400 },
		hide: { effect: 'fade', speed: 400 },
		width: 700,
		minWidth: 640,
		maxWidth: 700,
		height: 800,
		minHeight: 640,
		maxHeight: 800,
		buttons: [{
			id: "newUserDlgOkBtn",
			text: "S'inscrire",
			click: function() {
				if (document.getElementById("newAccountForm").reportValidity()) {
					let formData = accountFromForm();
					console.debug(formData);
					uPost("/Accounts/register", formData, () => "", error);
					$(this).dialog('close');
				}
			}
		},
		{
			text: "Annuler",
			click: function() {
				$(this).dialog("close");
			}
		}]
	});

	$("#accountLoginDlg").dialog({
		title: "Connexion",
		autoOpen: false,
		modal: true,
		show: { effect: 'fade', speed: 400 },
		hide: { effect: 'fade', speed: 400 },
		width: 500,
		height: 350,
		buttons: [{
			id: "loginUserDlgOkBtn",
			text: "Connexion",
			click: function() {
				loginHandler();
			}
		},
		{
			text: "Annuler",
			click: function() {
				$(this).dialog("close");
			}
		}]
	});

	$("#imageDlg").dialog({
		title: "...",
		autoOpen: false,
		modal: true,
		show: { effect: 'fade', speed: 400 },
		hide: { effect: 'fade', speed: 400 },
		width: 640,
		minWidth: 640,
		maxWidth: 640,
		height: 780,
		minHeight: 780,
		maxHeight: 780,
		position: { my: "top", at: "top", of: window },
		buttons: [{
			id: "imageDlgOkBtn",
			text: "Title will be changed dynamically",
			click: function() {
				let image = imageFromForm();
				if (image) {
					if (createMode) {
						POST(image, getImagesList, error);
						$(".scrollContainer").scrollTop(0);
					}
					else
						PUT(image, getImagesList, error);
					resetimageForm();
					holdCheckETag = false;
					$(this).dialog("close");
				}
			}
		},
		{
			text: "Annuler",
			click: function() {
				holdCheckETag = false;
				$(this).dialog("close");
			}
		}]
	});

	$("#confirmDeleteDlg").dialog({
		title: "Attention!",
		autoOpen: false,
		modal: true,
		show: { effect: 'fade', speed: 400 },
		hide: { effect: 'fade', speed: 400 },
		width: 500, minWidth: 500, maxWidth: 500,
		height: 230, minHeight: 230, maxHeight: 230,
		position: { my: "top", at: "top", of: window },
		buttons: [{
			id: "confirmDeleteDlgOkBtn",
			text: "Oui",
			click: function() {
				holdCheckETag = false;
				if (imageIdToDelete)
					DELETE(imageIdToDelete, getImagesList, error);
				imageIdToDelete = 0;
				$(this).dialog("close");
			}
		},
		{
			text: "Annuler",
			click: function() {
				holdCheckETag = false;
				imageIdToDelete = 0;
				$(this).dialog("close");
			}
		}]
	});

	$("#errorDlg").dialog({
		title: "Erreur...",
		autoOpen: false,
		modal: true,
		show: { effect: 'fade', speed: 400 },
		hide: { effect: 'fade', speed: 400 },
		width: 500, minWidth: 500, maxWidth: 500,
		height: 230, minHeight: 230, maxHeight: 230,
		position: { my: "top", at: "top", of: window },
		buttons: [{
			text: "Fermer",
			click: function() {
				holdCheckETag = false;
				imageIdToDelete = 0;
				$(this).dialog("close");
			}
		}]
	});

	$(".scrollContainer").scroll(function() {
		if ($(".scrollContainer").scrollTop() + $(".scrollContainer").innerHeight() >= $("#imagesList").height()) {
			getImagesList(false);
		}
	});
}


