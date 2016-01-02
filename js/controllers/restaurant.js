/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('RestaurantController', function($scope, $state, $stateParams, restaurant, mapState, userData) {
  if (_.isUndefined(restaurant)) {
    $state.go('map.list');
    return;
  }
  
  
  $scope.restaurant = restaurant;
  
  
  var centerOnRestaurant = function(restaurant, gmap) {
    if (gmap) {
      gmap().panTo({
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude
      });
      mapState.zoom = 17;
      return true;
    } else {
      return false;
    }
  };
  
  if (!centerOnRestaurant(restaurant, mapState.gmap.getGMap)) {
    var wathcer = $scope.$watch(() => { return mapState.gmap.getGMap; }, function(maps) {
      if (centerOnRestaurant(restaurant, maps)) {
        wathcer();
      }
    }); 
  }
  
  /*
  if (userData.location.accuracy) {
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [{
        lat: userData.location.latitude,
        lng: userData.location.longitude
      }],
      destinations: [{
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude
      }],
      travelMode: google.maps.TravelMode.DRIVING,
    }, function(response, status) {
      console.log('data', response);
    });
  }
  */
})
