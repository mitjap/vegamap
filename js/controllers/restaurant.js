/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('RestaurantController', function($scope, $q, $state, $stateParams, restaurant, mapState, userData, DirectionsService) {
  if (_.isUndefined(restaurant)) {
    $state.go('map.list');
    return;
  }

  $scope.restaurant = restaurant;
  $scope.panorama = {
    options: {
      addressControl: false,
        panControl: false,
        zoomControl: false,
        scrollwheel: false
    },
    povoptions: {
      zoom: 1
    }
  }

  if (userData.hasLocation()) {
    getEta(userData.getLocation());
  }

  userData.addListener($scope, function(location) {
    getEta(location);
  });

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

  $scope.$on('$destroy', function() {
    mapState.directionsRenderer.setDirections({routes: []});
  });

  $scope.showDirections = function() {
    var directionsDisplay = mapState.directionsRenderer;

    if (restaurant.temp && restaurant.temp.directions) {
      directionsDisplay.setDirections(restaurant.temp.directions);
    } else {
      DirectionsService.route({
        origin: {
          lat: userData.getLocation().latitude,
          lng: userData.getLocation().longitude
        },
        destination: {
          lat: restaurant.location.latitude,
          lng: restaurant.location.longitude
        }
      })
      .then(function(directions) {
        if (restaurant.temp) restaurant.temp.directions = directions;
        directionsDisplay.setDirections(directions);
      });
    }
  };

  function getEta(location) {
    // TODO: check if userData.location is actually set!!!

    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [{
        lat: location.latitude,
        lng: location.longitude
      }],
      destinations: [{
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude
      }],
      travelMode: google.maps.TravelMode.DRIVING,
    }, function(response, status) {
      $scope.eta = response.rows[0].elements[0];
    });
  }

  /*
  if (userData.location.accuracy) {
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
