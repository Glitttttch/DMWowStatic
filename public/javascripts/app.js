var app = angular.module ("FormApp", []);


app.controller("FormController", function($scope, $http, $interval){
	$interval(function(){
		$http.get("/api/twmodel")
		.success(function (response) {
			$scope.forms = response;

	});
	}, 1000)
})

app.controller("ListController", function($scope, $http, $interval){
	$interval(function(){
		$http.get("/api/wordCount")
		.success(function (response) {
			$scope.words = response;

	});
	}, 1000)
})


app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
