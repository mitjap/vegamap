
angular.module('vegamap-app', ['ui.router', 'uiGmapgoogle-maps', 'geolocation'])
.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/');
	
  	$stateProvider
    .state('map', {
      url: '/map',
	  controller: 'main',
      templateUrl: 'partials/main.html'
    });
})
.run(function($rootScope, $location, $window){
	$rootScope.$on('$stateChangeSuccess', function(event){
		if (!$window.ga) return;
		$window.ga('send', 'pageview', { page: $location.path() });
	});
})
.controller('main', function($scope, dataProvider, uiGmapGoogleMapApi, geolocation) {
    $scope.center = { latitude: 45, longitude: -73 };
	$scope.zoom = 8;
	$scope.fit = true;
	
	$scope.data = [];
	
	uiGmapGoogleMapApi.then(function(maps) {
		$scope.data = dataProvider.restourants;
    });
	
	geolocation.getLocation()
	.then(function(data) {
		console.log('allowed');
		$scope.fit = false;	
		$scope.center = {
		  latitude: data.coords.latitude,
		  longitude: data.coords.longitude
	  	};
      	$scope.zoom = 14;
    })
	.catch(function() {
	});
})
.service('dataProvider', function() {
	var restourants = [
		{
			id: 0,
			"name": "Ajdovo Zrno",
			"address": "Trubarjeva 7, 1000 Ljubljana",
			"location": { "latitude" : 46.052012, "longitude" : 14.507220 },
			"type": 1,
			"phone": "040832446",
			"note": "veganska in presna ponudba",
			"options": { labelClass: 'label', labelContent: 'Ajdovo Zrno' }
		},
		{
			id: 1,
			"name": "Bobenček",
			"address": "Trubarjeva 17, 1000 Ljubljana",
			"location": { "latitude" : 46.052409, "longitude" : 14.508389 },
			"type": 0,
			"phone": "014321283",
			"note": "veganske jedi, smoothiji, rastlinsko mleko, presne torte",
			"options": { labelClass: 'label', labelContent: 'Bobenček' }
		}		
	];
	
	return {
		restourants: restourants
	}
});