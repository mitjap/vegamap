/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('RestaurantController', function($scope, $q, $state, $stateParams, $window, restaurant, mapState, userData, DirectionsService) {
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

  $scope.recenterMap = function() {
    centerOnRestaurant(restaurant, mapState.gmap.getGMap);

    $window.ga && $window.ga('send', 'event', 'restaurant', 'recenter');
  }

  $scope.openWeb = function(event) {
    $window.open(restaurant.web);

    $window.ga && $window.ga('send', 'event', 'restaurant', 'open_web');
  }

  $scope.sendMail = function(event) {
    $window.open("mailto:" + restaurant.email);

    $window.ga && $window.ga('send', 'event', 'restaurant', 'send_mail');
  }

  $scope.call = function(event) {
    $window.open("tel:" + restaurant.phone);

    $window.ga && $window.ga('send', 'event', 'restaurant', 'call');
  }

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

    $window.ga && $window.ga('send', 'event', 'restaurant', 'directions');
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
})
