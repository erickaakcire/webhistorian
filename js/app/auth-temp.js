/*
 var bytes = lengthInUtf8Bytes(stringData);
 var url = "web-historian-eu.storage.googleapis.com/o?uploadType=resumable&name=myObject";
 var req = new XMLHttpRequest();

 req.addEventListener("load", transferComplete, false);
 req.addEventListener("error", transferFailed, false);
 req.addEventListener("abort", transferCanceled, false);

 req.open("POST",url,true);

 req.setRequestHeader("Authorization", "Bearer "+access_token);
 req.setRequestHeader("x-goog-project-id", "581411807237");
 req.setRequestHeader("x-goog-resumable", "start");
 //req.setRequestHeader("Content-Type","application/json; charset=UTF-8");
 req.setRequestHeader("X-Upload-Content-Type","application/json; charset=UTF-8");
 req.setRequestHeader("X-Upload-Content-Length", 7);
 req.send("testing");//stringData

 var response=req.responseXML;
 console.log(response);

 function transferComplete(evt) {
 console.log("The transfer is complete.");
 }

 function transferFailed(evt) {
 console.log("An error occurred while transferring the file.");
 }

 function transferCanceled(evt) {
 console.log("The transfer has been canceled by the user.");
 }

 // if response successful 2**, if not "There was a problem uploading your data. Please try again later.";


 POST /upload/storage/v1/b/web-historian-eu/o?uploadType=resumable HTTP/1.1
 Content-Length: 38
 X-Upload-Content-Type: json/text*
 X-Upload-Content-Length: bytes

 {"name": "myObject"}

 POST https://www.googleapis.com/upload/storage/v1/b/myBucket/o?uploadType=resumable&name=myObject
 */
//d3.select("#"+divName).append("p").text("Data submitted successfully. Thank you ").attr("id", "visualization");