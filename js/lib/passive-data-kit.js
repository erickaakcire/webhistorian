define(function() {
	var pdk = {};
	
	pdk.upload = function(endpoint, userId, generatorId, buffer, index, onProgress, onComplete)
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
				metadata['generator-id'] = generatorId;
				metadata['timestamp'] = dayPoints[i]["date"] / 1000; // Unix timestamp
			
				dayPoints[i]['passive-data-metadata'] = metadata;
			}
				
			var dataString = JSON.stringify(dayPoints, 2);
		
			$.ajax({
				type: "CREATE",
				url: endpoint,
				dataType: "json",
				contentType: "application/json",
				data: dataString,
				success: function(data, textStatus, jqXHR)
				{
					onProgress(index, buffer.length);
					pdk.upload(endpoint, userId, generatorId, buffer, index + 1, onProgress, onComplete);
				}
			});
		}
		else
		{
			onComplete();
		}
	};
	
	return pdk;
});