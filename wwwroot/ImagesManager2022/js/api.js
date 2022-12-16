const apiBaseURL = "http://localhost:5000/api/images";
const baseUrl = "http://localhost:5000/api";

function HEAD(successCallBack, errorCallBack) {
    $.ajax({
        url: apiBaseURL,
        type: 'HEAD',
        contentType: 'text/plain',
        complete: request => { successCallBack(request.getResponseHeader('ETag')) },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}
function GET_ID(id, successCallBack, errorCallBack) {
    $.ajax({
        url: apiBaseURL + "/" + id,
        type: 'GET',
        success: data => { successCallBack(data); },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}
function GET_ALL(successCallBack, errorCallBack, queryString = null) {
    let url = apiBaseURL + (queryString ? queryString : "");
    $.ajax({
        url: url,
        type: 'GET',
        success: (data, status, xhr) => { successCallBack(data, xhr.getResponseHeader("ETag")) },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}
function POST(data, successCallBack, errorCallBack) {
    $.ajax({
        url: apiBaseURL,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: (data) => { successCallBack(data) },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}
function PUT(bookmark, successCallBack, errorCallBack) {
    $.ajax({
        url: apiBaseURL + "/" + bookmark.Id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(bookmark),
        success: () => { successCallBack() },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}
function DELETE(id, successCallBack, errorCallBack) {
    $.ajax({
        url: apiBaseURL + "/" + id,
        type: 'DELETE',
        success: () => { successCallBack() },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}
/**
 * Unprotected post to endpoint
 * @param {string} endpoint 
 * @param {object} data 
 * @param {Function} successCallBack 
 * @param {Function} errorCallBack 
 */
async function uPost(endpoint, data, successCallBack, errorCallBack) {
    await $.ajax({
        url: baseUrl + endpoint,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: (data) => { successCallBack(data) },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}

async function pPost(endpoint, data, token, successCallBack, errorCallBack) {
    return $.ajax({
        url: baseUrl + endpoint,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
		beforeSend: function (xhr) {
			xhr.setRequestHeader("Authorization", "Bearer " + token);
		},
        success: (data) => successCallBack(data),
        error: (jqXHR) => errorCallBack(jqXHR.status)
    });
}

async function uGet(endpoint, successCallBack, errorCallBack) {
    await $.ajax({
        url: baseUrl + endpoint,
        type: 'GET',
        success: (data) => { successCallBack(data) },
        error: function (jqXHR) { errorCallBack(jqXHR.status) }
    });
}

async function pGet(endpoint, token, successCallBack, errorCallBack) {
    return $.ajax({
        url: baseUrl + endpoint,
        type: 'GET',
		beforeSend: function (xhr) {
			xhr.setRequestHeader("Authorization", "Bearer " + token);
		},
        success: (data) => successCallBack(data),
        error: (jqXHR) => errorCallBack(jqXHR.status)
    });
}

function storeToken (token) {
    localStorage.setItem("access-token", token);
}

function retrieveToken () {
    return localStorage.getItem("access-token");
}
