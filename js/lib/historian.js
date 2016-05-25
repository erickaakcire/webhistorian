define(function() {
	var historian = {};
	
	historian.fetchUserId = function(endpoint, onComplete)
	{
		$.ajax({
			type: "GET",
			url: endpoint,
			dataType: "json",
			contentType: "application/json",
			success: function(data, textStatus, jqXHR)
			{
				console.log("2: " + JSON.stringify(data));
				
				onComplete(data["new_id"]);
			}
		});
	};
	
	return historian;
});