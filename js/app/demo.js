var PROJECT = '581411807237';
var clientId = '581411807237-hi8jesii81k5725mo67q6bktc8ofi099.apps.googleusercontent.com';
var apiKey = 'AIzaSyA6NwESlZ5-uHcaTr8KjaajrAX6yf94ISQ';
var scopes = 'https://www.googleapis.com/auth/devstorage.read_write';
var API_VERSION = 'v1';
var BUCKET = 'web-historian-eu';
var object = "";
var GROUP =
    'group-00b4903a9760b6025c58662742f5a3adc6aaaedad9a94204ebd9a7e46e2ec252';
/**
 * Valid values are user-userId, user-email, group-groupId, group-email,
 * allUsers, allAuthenticatedUsers
 */
var ENTITY = 'allUsers';
/**
 * Valid values are READER, OWNER
 */
var ROLE = 'READER';
/**
 * Valid values are READER, OWNER
 */
var ROLE_OBJECT = 'READER';
/**
 * A list of example calls to the Google Cloud Storage JavaScript client
 * library, as well as associated explanations of each call.
 */
var listApiRequestExplanations = {
    'listBuckets': 'This API call queries the Google Cloud Storage API ' +
    'for a list of buckets in your project, and returns the result as ' +
    'a list of Google Cloud Storage buckets.',
    'listObjects': 'This API call queries the Google Cloud Storage API ' +
    'for a list of objects in your bucket, and returns the result as ' +
    'a list of Google Cloud Storage objects.',
    'listBucketsAccessControls': 'This API call queries the Google Cloud ' +
    'Storage API for the list of access control lists on buckets in your ' +
    'project and returns the result as a list of Google Cloud Storage ' +
    'Access Control Lists.',
    'listObjectsAccessControls': 'This API call queries the Google Cloud ' +
    'Storage API for the list of access control lists on objects in your ' +
    'bucket and returns the result as a list of Google Cloud Storage ' +
    'Access Control Lists.',
    'getBucket': 'This API call queries the Google Cloud Storage API ' +
    'for a bucket in your project, and returns the result as a ' +
    'Google Cloud Storage bucket.',
    'getBucketAccessControls': 'This API call queries the Google Cloud ' +
    'Storage API for the access control list on a specific bucket ' +
    'and returns the result as a Google Cloud Storage Access Control List.',
    'getObjectAccessControls': 'This API call queries the Google Cloud ' +
    'Storage API for the access control list on a specific object ' +
    'and returns the result as a Google Cloud Storage Access Control List.',
    'insertBucket': 'This API call uses the Google Cloud Storage API ' +
    'to insert a bucket into your project.',
    'insertObject': 'This API call uses the Google Cloud Storage API ' +
    'to insert an object into your bucket.',
    'insertBucketAccessControls': 'This API uses the Google Cloud ' +
    'Storage API to insert an access control list on a specific bucket ' +
    'and returns the result as a Google Cloud Storage Access Control List.',
    'insertObjectAccessControls': 'This API uses the Google Cloud ' +
    'Storage API to insert an access control list on a specific object ' +
    'and returns the result as a Google Cloud Storage Access Control List.',
    'deleteBucket': 'This API uses the Google Cloud Storage API to delete ' +
    'an empty bucket and returns an empty response to indicate success.',
    'deleteObject': 'This API uses the Google Cloud Storage API to delete ' +
    'an object and returns an empty response to indicate success.'
};
/**
 * Google Cloud Storage API request to retrieve the list of buckets in
 * your Google Cloud Storage project.
 */
function listBuckets() {
    var request = gapi.client.storage.buckets.list({
        'project': PROJECT
    });
    executeRequest(request, 'listBuckets');
}

/**
 * Google Cloud Storage API request to insert a bucket into
 * your Google Cloud Storage project.
 */
function insertBucket() {
    resource = {
        'name': BUCKET
    };
    var request = gapi.client.storage.buckets.insert({
        'project': PROJECT,
        'resource': resource
    });
    executeRequest(request, 'insertBucket');
}
/**
 * Google Cloud Storage API request to insert an object into
 * your Google Cloud Storage bucket.
 */
function insertObject(event) {
    try{
        var fileData = event.target.files[0];
    }
    catch(e) {
        //'Insert Object' selected from the API Commands select list
        //Display insert object button and then exit function
        filePicker.style.display = 'block';
        return;
    }
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function(e) {
        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'name': fileData.name,
            'mimeType': contentType
        };
        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;
        //Note: gapi.client.storage.objects.insert() can only insert
        //small objects (under 64k) so to support larger file sizes
        //we're using the generic HTTP request method gapi.client.request()
        var request = gapi.client.request({
            'path': '/upload/storage/' + API_VERSION + '/b/' + BUCKET + '/o',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});
        //Remove the current API result entry in the main-content div
        listChildren = document.getElementById('main-content').childNodes;
        if (listChildren.length > 1) {
            listChildren[1].parentNode.removeChild(listChildren[1]);
        }
        try{
            //Execute the insert object request
            executeRequest(request, 'insertObject');
            //Store the name of the inserted object
            object = fileData.name;
        }
        catch(e) {
            alert('An error has occurred: ' + e.message);
        }
    }
}
/**
 * Google Cloud Storage API request to insert an Access Control List into
 * your Google Cloud Storage bucket.
 */
function insertBucketAccessControls() {
    resource = {
        'entity': ENTITY,
        'role': ROLE
    };
    var request = gapi.client.storage.bucketAccessControls.insert({
        'bucket': BUCKET,
        'resource': resource
    });
    executeRequest(request, 'insertBucketAccessControls');
}

/**
 * Removes the current API result entry in the main-content div, adds the
 * results of the entry for your function.
 * @param {string} apiRequestName The name of the example API request.
 */
function updateApiResultEntry(apiRequestName) {
    listChildren = document.getElementById('main-content')
        .childNodes;
    if (listChildren.length > 1) {
        listChildren[1].parentNode.removeChild(listChildren[1]);
    }
    if (apiRequestName != 'null') {
        window[apiRequestName].apply(this);
    }
}
/**
 * Determines which API request has been selected, and makes a call to add
 * its result entry.
 */
function runSelectedApiRequest() {
    var curElement = document.getElementById('api-selection-options');
    var apiRequestName = curElement.options[curElement.selectedIndex].value;
    updateApiResultEntry(apiRequestName);
}
/**
 * Binds event listeners to handle a newly selected API request.
 */
function addSelectionSwitchingListeners() {
    document.getElementById('api-selection-options')
        .addEventListener('change',
        runSelectedApiRequest, false);
}
/**
 * Template for getting JavaScript sample code snippets.
 * @param {string} method The name of the Google Cloud Storage request
 * @param {string} params The parameters passed to method
 */
function getCodeSnippet(method, params) {
    var objConstruction = "// Declare your parameter object\n";
    objConstruction += "var params = {};";
    objConstruction += "\n\n";
    var param = "// Initialize your parameters \n";
    for (i in params) {
        param += "params['" + i + "'] = ";
        param += JSON.stringify(params[i], null, '\t');
        param += ";";
        param += "\n";
    }
    param += "\n";
    var methodCall = "// Make a request to the Google Cloud Storage API \n";
    methodCall += "var request = gapi.client." + method + "(params);";
    return objConstruction + param + methodCall;
}
/**
 * Executes your Google Cloud Storage request object and, subsequently,
 * inserts the response into the page.
 * @param {string} request A Google Cloud Storage request object issued
 *    from the Google Cloud Storage JavaScript client library.
 * @param {string} apiRequestName The name of the example API request.
 */
function executeRequest(request, apiRequestName) {
    request.execute(function(resp) {
        console.log(resp);
        var apiRequestNode = document.createElement('div');
        apiRequestNode.id = apiRequestName;
        var apiRequestNodeHeader = document.createElement('h2');
        apiRequestNodeHeader.innerHTML = apiRequestName;
        var apiRequestExplanationNode = document.createElement('div');
        apiRequestExplanationNode.id = apiRequestName + 'RequestExplanation';
        var apiRequestExplanationNodeHeader = document.createElement('h3');
        apiRequestExplanationNodeHeader.innerHTML = 'API Request Explanation';
        apiRequestExplanationNode.appendChild(apiRequestExplanationNodeHeader);
        var apiRequestExplanationEntry = document.createElement('p');
        apiRequestExplanationEntry.innerHTML =
            listApiRequestExplanations[apiRequestName];
        apiRequestExplanationNode.appendChild(apiRequestExplanationEntry);
        apiRequestNode.appendChild(apiRequestNodeHeader);
        apiRequestNode.appendChild(apiRequestExplanationNode);
        var apiRequestCodeSnippetNode = document.createElement('div');
        apiRequestCodeSnippetNode.id = apiRequestName + 'CodeSnippet';
        var apiRequestCodeSnippetHeader = document.createElement('h3');
        apiRequestCodeSnippetHeader.innerHTML = 'API Request Code Snippet';
        apiRequestCodeSnippetNode.appendChild(apiRequestCodeSnippetHeader);
        var apiRequestCodeSnippetEntry = document.createElement('pre');
        //If the selected API command is not 'insertObject', pass the request
        //paramaters to the getCodeSnippet method call as 'request.B.rpcParams'
        //else pass request paramaters as 'request.B'
        if (apiRequestName != 'insertObject') {
            apiRequestCodeSnippetEntry.innerHTML =
                getCodeSnippet(request.B.method, request.B.rpcParams);
            //Selected API Command is not 'insertObject'
            //hide insert object button
            filePicker.style.display = 'none';
        } else {
            apiRequestCodeSnippetEntry.innerHTML =
                getCodeSnippet(request.B.method, request.B);
        }
        apiRequestCodeSnippetNode.appendChild(apiRequestCodeSnippetEntry);
        apiRequestNode.appendChild(apiRequestCodeSnippetNode);
        var apiResponseNode = document.createElement('div');
        apiResponseNode.id = apiRequestName + 'Response';
        var apiResponseHeader = document.createElement('h3');
        apiResponseHeader.innerHTML = 'API Response';
        apiResponseNode.appendChild(apiResponseHeader);
        var apiResponseEntry = document.createElement('pre');
        apiResponseEntry.innerHTML = JSON.stringify(resp, null, ' ');
        apiResponseNode.appendChild(apiResponseEntry);
        apiRequestNode.appendChild(apiResponseNode);
        var content = document.getElementById('main-content');
        content.appendChild(apiRequestNode);
    });
}
/**
 * Set required API keys and check authentication status.
 */
function handleClientLoad() {
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth, 1);
}
/**
 * Authorize Google Cloud Storage API.
 */
function checkAuth() {
    gapi.auth.authorize({
        client_id: clientId,
        scope: scopes,
        immediate: true
    }, handleAuthResult);
}
/**
 * Handle authorization.
 */
function handleAuthResult(authResult) {
    var authorizeButton = document.getElementById('authorize-button');
    if (authResult && !authResult.error) {
        authorizeButton.style.visibility = 'hidden';
        initializeApi();
        filePicker.onchange = insertObject;
    } else {
        authorizeButton.style.visibility = '';
        authorizeButton.onclick = handleAuthClick;
    }
}
/**
 * Handle authorization click event.
 */
function handleAuthClick(event) {
    gapi.auth.authorize({
        client_id: clientId,
        scope: scopes,
        immediate: false
    }, handleAuthResult);
    return false;
}
/**
 * Load the Google Cloud Storage API.
 */
function initializeApi() {
    gapi.client.load('storage', API_VERSION);
}
/**
 * Driver for sample application.
 */
$(window)
    .bind('load', function() {
        addSelectionSwitchingListeners();
        handleClientLoad();
    });