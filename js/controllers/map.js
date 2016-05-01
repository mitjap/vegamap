/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('MapController', function($scope, $state, $q, $window, $mdToast, dataProvider,
    mapState, userData, geolocation, GeocodingService) {
  $scope.state = mapState;
  $scope.fit = true;
  $scope.mapOptions = {
    maxZoom: 18,
    styles: [{
      featureType: "poi",
      stylers: [
        { visibility: "off" }
      ]
    }]
  };

  $scope.markerClick = function(marker, event, restaurant) {
    $state.go('map.restaurant', { restaurantSlug: restaurant.slug });

    $window.ga && $window.ga('send', 'event', 'list', 'navigate_marker');
  };

  $scope.data = [];
  $scope.location = {};

  if (userData.hasLocation()) {
    angular.copy(userData.getLocation());
  }

  userData.addListener($scope, function(data) {
    $scope.location = angular.copy(data, $scope.location);
  });

  //$q.all(dataProvider.getRestaurants())
  dataProvider.getRestaurants()
  .then(function(restaurants) {
    $scope.data = restaurants;
  });

  if (!userData.hasLocation()) {
    var locationData;
    geolocation.getLocation()
    .then(function(data) {
      locationData = data;
      return GeocodingService.geocode({
        location: {
            lat: locationData.coords.latitude,
            lng: locationData.coords.longitude
        }
      });
    })
    .then(function(geocodedData) {
      userData.setLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
        description: geocodedData.length ? geocodedData[0].formatted_address : "No address"
      });

      $mdToast.show($mdToast.simple().position('bottom right').textContent('Awesome! We got your location.'));

      $scope.fit = false;
      mapState.center = angular.copy(userData.getLocation());
      $scope.zoom = 5;
    })
    .then(function() {
      $window.ga && $window.ga('send', 'event', 'location', 'location_approved');
    })
    .catch(function() {
      $window.ga && $window.ga('send', 'event', 'location', 'location_denied');
    });
  }
})
