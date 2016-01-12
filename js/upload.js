var uploadPassiveData = function(buffer, index, onProgress, onComplete)
{
    if (index < buffer.length)
    {
        var dayPoints = buffer[index];
        
        for (var i = 0; i < dayPoints.length; i++)
        {
            dayPoints[i]['user'] = 'historian-test'
            dayPoints[i]['timestamp'] = dayPoints[i]["date"] / 1000;
        }
        
        var dataString = JSON.stringify(dayPoints, 2);
        
        $.ajax({
            type: "CREATE",
            url: "http://54.146.178.80/data/add-bundle.json",
            dataType: "json",
            contentType: "application/json",
            data: dataString,
            success: function(data, textStatus, jqXHR)
            {
                onProgress(index, buffer.length);
                uploadPassiveData(buffer, index + 1, onProgress, onComplete);
            }
        });
    }
    else
    {
        onComplete();
    }
};