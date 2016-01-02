/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('MapController', function($scope, $state, $q, $mdToast, dataProvider,
    mapState, userData, geolocation) {
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
  };
  
  $scope.data = [];
  $scope.location = userData.location;
  
  //$q.all(dataProvider.getRestaurants())
  dataProvider.getRestaurants()
  .then(function(restaurants) {
    $scope.data = restaurants;
  });
  
  if (!userData.location.accuracy) {
    geolocation.getLocation()
    .then(function(data) {

      userData.location.latitude = data.coords.latitude;
      userData.location.longitude = data.coords.longitude;
      userData.location.accuracy = data.coords.accuracy;
      
      $mdToast.show($mdToast.simple().textContent('Awesome! We got your location.'));

      $scope.fit = false;
      mapState.center = angular.copy(userData.location);
      $scope.zoom = 18;
    })
    .catch(function() {
      // TODO: do something
    });
  }
})
