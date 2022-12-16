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
let userIdToVerify = 0; // used by confirmVerifyDlg

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

		//uGet(`/accounts/publicInfo/${image.UserId}`, (data) => { user = data; }, error);
		let connectedUserId = getCookie("userId");
		if(image.Shared || image.UserId == connectedUserId){
			$("#imagesList").append(
				$(` 
					<div class='imageLayout'>
						<div class='imageHeader'>
							<div class="imageTitle">${image.Title}</div>
								${image.UserId == connectedUserId && connectedUserId != undefined ? `

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
							` : ""}
							</div>
								<div class="image" imageid="${image.Id}"
										style="background-image:url('${image.ThumbnailURL}')">
								</div>
						${image.Shared && image.userId == 1 ? 
							`<div id="sharedIcon" class="avatar" style="background-image:url('../images/shared.png');">`
							:
							`<div id="avatarOnImage" title="name" class="avatar" style="background-image:url('../../images/c5482a50-7cb1-11ed-92fe-2b03d4156d66.png';)"></div>`}
						<div class="imageDate">${convertToFrenchDate(parseInt(image.Date))}</div>
					</div>
			`)
			);
		}
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
	$('.image').click(e => { imageDlg(e)});

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

function loginDlg (options = undefined) {
	$('#emailLogin').val('email' in options ? options.email : '');
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

function imageDlg(e){
	GET_ID(e.target.getAttribute("imageid"), imageToDlg, error);
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
			Date: parseInt($("#date_input").val()),
			Shared : $("#shared_input").is(":checked"),
			UserId : getCookie("userId")

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
	$("#shared_input").prop("checked", image.Shared);
}

function imageToDlg(image) {
	$("#imageInfoLink").attr("href", image.OriginalURL);
	$("#imageInfoTitle").text(image.Title);
	$("#imageInfoDescription").text(image.Description);
	$("#imageInfoDate").text(convertToFrenchDate(parseInt(image.Date)));
	$("#imageInfoImage").css("background-image", "url(../../images/"+ image.GUID +".png)");
	//$("#imageInfoOwnerName").text(user.Name);
	//$("#imageInfoOwnerAvatar").css("background-image", "url(../../images/"+ user.AvatarGUID +".png)");
	$("#imageInfoDlg").dialog('open');
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
		$("#password_confirmation").val("");
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

function setCookie (cookieName, cookieValue, expires = undefined) {
	let _cookie = `${cookieName}=${cookieValue}; `;

	if (expires != undefined)
		_cookie += `expires=${expires}`;

	document.cookie = _cookie;
}

function unsetCookie (cookieName) {
	document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
}

function getCookie (cookieName) {
	if(!document.cookie.includes(cookieName)){
		return undefined;
	}
	return document.cookie.split('; ').filter(c => c.split('=')[0] == cookieName)[0].split('=')[1];
}

async function renderConnectivityStatus (isConnected = undefined) {
	// this function will re-render connectionMgmt depending if the user is logged in or not
	// if isConnected is undefined, we will need to figure out if user is logged in
	// if true/false, render based on value

	let userInfo;
	if (isConnected == undefined) {
		// check if cookie is set, then test if its expired. set isConnected based on result
		let cookies = document.cookie;
		if (cookies.includes("access_token")) {
			let cookie = cookies
				.split('; ') // get cookie in array
				.filter(c => { // filter the cookies
				return c.includes("access_token");
			})
				.map(c => {
				return c.split('=')[1]; // get only the value of the token
			})[0]; // get the first cookie (access_token)

			// test the cookie
			try {
				await pGet("/accounts/" + getCookie('userId'), cookie, data => {
					isConnected = true;
					userInfo = data;
				}, _ => {
					isConnected = false;
				});
			} catch {
				console.error("Not authenticated... Removing token");
			}
		}
		else
			isConnected = false;
	}

	if (isConnected) {
		await pGet("/accounts/" + getCookie('userId'), getCookie('access_token'), data => {
			userInfo = data;
		}, _ => {});
		$(".notLoggedIn").hide();
		$(".loggedIn").show();
		$("#avatarImage").attr("src", userInfo.AvatarURL);
		$("#accountName").html(userInfo.Name);
	} else {
		// if not connected, make sure we don't have a token stored!
		unsetCookie('access_token');
		unsetCookie('userId');
		$(".notLoggedIn").show();
		$(".loggedIn").hide();
	}
}

function codeVerification(userId){
	if (document.getElementById("verifyCodeForm").reportValidity()) {
		let code =  $("#code").val()
		uGet("/accounts/verify?id="+ userId + "&code=" + code, (data) => {
			$('#verifyCodeDlg').dialog('close');
		},
		(error) => {
			$("#verifyErrorMessage").html("Le code que vous avez entré n'est pas valide. Veuillez réessayer.");
			console.log(error);
		});
	}
}

function loginHandler () {
	// set the token when the user logs-in

	if (document.getElementById('accountLoginForm').reportValidity()) {
		let email = $("#emailLogin").val();
		let password = $("#passwordLogin").val();

		uPost('/accounts/login', { "Email" : email, "Password" : password }, data => {
			$('#accountLoginDlg').dialog('close');
			document.cookie = `access_token=${data.Access_token}; expires=${new Date(data.Expire_Time * 1000).toUTCString()}`;
			document.cookie = `userId=${data.UserId}`;
			if(data.Verified != true){
				userIdToVerify = data.UserId;
				renderConnectivityStatus(false);
				verifyCodeDlg();
			}
			else{
				$('#accountLoginDlg').dialog('close');
				document.cookie = `access_token=${data.Access_token}`;
				renderConnectivityStatus(true);
				getImagesList()
			}
		}, renderConnectivityStatus(false));
	}
}

function verifyCodeDlg(){
	$("#code").val('');
	$("#verifyCodeDlg").dialog('open');
}

function logout () {
	const _callback = () => {renderConnectivityStatus(false); getImagesList();}
	pGet('/accounts/logout/' + getCookie('userId'), getCookie('access_token'), _callback, _callback);
}

async function editUser () {

	let userInfo;
	await pGet("/accounts/" + getCookie('userId'), getCookie('access_token'), data => {
		userInfo = data;
	}, _ => {});

	// show the form for resetting user
	if (userInfo == undefined)
		return;

	$("#nameEdit").val(userInfo.Name);
	$("#emailEdit").val(userInfo.Email);
	$("#imageAvatarEdit_ImageContainer").css('background-image', `url('${userInfo.AvatarURL}')`);
	$("#passwordEdit").val(userInfo.Password);
	$("#password_confirmationEdit").val(userInfo.Password);

	$("#editAccountDlg").dialog('open');
}

function editFormGetData () {
	let avatar = undefined
	if ($("#imageAvatarEdit_ImageContainer").css('background-image').includes('data:image'))
		avatar = ImageUploader.getImageData('imageAvatarEdit');
	
	let obj = {
		"Id": parseInt(getCookie('userId')),
		"Name": $('#nameEdit').val(),
		"Email": $("#emailEdit").val(),
		"Password": $("#passwordEdit").val(),
		
	};

	if (avatar !== undefined)
		obj['ImageData'] = avatar;
	else
		obj['AvatarGUID'] = $("#imageAvatarEdit_ImageContainer").css('background-image').match(/\w+-\w+-\w+-\w+-\w+/); // so that the image isn't deleted when we update

	return obj;
}

function init_UI() {
	setPasswordConfirmationFor('password', 'password_confirmation');
	setPasswordConfirmationFor('passwordEdit', 'password_confirmationEdit');
	renderConnectivityStatus();

	$("#newImageCmd").click(newImage);
	$("#newAccountCmd").click(newAccount);
	$("#loginAccountCmd").click(loginDlg);
	$("#logoutAccountCmd").click(logout);
	$("#accountCmd").click(editUser);

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
					uPost("/Accounts/register", formData, (data) => loginDlg({ 'email' : data.Email }), error);
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

	$("#editAccountDlg").dialog({
		title: "Modifier mon compte",
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
			text: "Modifier",
			click: function() {
				if (document.getElementById("editAccountForm").reportValidity()) {
					pPut("/accounts/modify", editFormGetData(), getCookie('access_token'), 
						() => renderConnectivityStatus(true), () => {});
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

	$("#verifyCodeDlg").dialog({
		title: "Code de vérification",
		autoOpen: false,
		modal: true,
		show: { effect: 'fade', speed: 400 },
		hide: { effect: 'fade', speed: 400 },
		width: 500,
		height: 300,
		buttons: [{
			id: "verifyCodeDlgOkBtn",
			text: "Valider",
			click: function() {
				codeVerification(userIdToVerify);
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
						pPost("/images",image, getCookie('access_token'), getImagesList, error);
						$(".scrollContainer").scrollTop(0);
					}
					else
						var callback = () => {getImagesList();}
						pPut("/images/" + image.Id, image, getCookie("access_token"), callback, error);
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

	$("#imageInfoDlg").dialog({
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
		buttons: [
		{
			text: "Retour",
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
					var callback = () => {getImagesList();}
					pDelete("/images/" + imageIdToDelete, getCookie('access_token'), callback, error);
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


