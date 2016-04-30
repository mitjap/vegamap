/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('RestaurantController', function($scope, $q, $state, $stateParams, restaurant, mapState, userData) {
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

  $scope.getEta = function(location) {
    var defered = $q.defer();

    // TODO: check if userData.location is actually set!!!

    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [{
        lat: userData.getLocation().latitude,
        lng: userData.getLocation().longitude
      }],
      destinations: [{
        lat: location.latitude,
        lng: location.longitude
      }],
      travelMode: google.maps.TravelMode.DRIVING,
    }, function(response, status) {
      console.log('data', response.rows[0].elements[0]);
      defered.resolve(response.rows[0].elements[0]);
    });

    defered.promise.then(function() {
      console.log('after', defered.promise);
      console.log('after', defered.promise.$$v);
    })

    return defered.promise;
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
