var uploadPassiveData = function(userId, buffer, index, onProgress, onComplete)
{
	var manifest = chrome.runtime.getManifest();
	
	var userAgent = manifest['name'] + '/' + manifest['version'] + ' ' + navigator.userAgent;
	
    if (index < buffer.length)
    {
        var dayPoints = buffer[index];
        
        for (var i = 0; i < dayPoints.length; i++)
        {
			var metadata = {};
		
			metadata['source'] = userId;
			metadata['generator'] = userAgent;
			metadata['timestamp'] = dayPoints[i]["date"] / 1000; // Unix timestamp
			
			dayPoints[i]['passive-data-metadata'] = metadata;
        }
                
        var dataString = JSON.stringify(dayPoints, 2);
        
        $.ajax({
            type: "CREATE",
            url: "http://historian.audacious-software.com/data/add-bundle.json",
            dataType: "json",
            contentType: "application/json",
            data: dataString,
            success: function(data, textStatus, jqXHR)
            {
                onProgress(index, buffer.length);
                uploadPassiveData(userId, buffer, index + 1, onProgress, onComplete);
            }
        });
    }
    else
    {
        onComplete();
    }
};