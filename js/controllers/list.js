/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('ListController', function($scope, $state, dataProvider, mapState) {
  dataProvider.getRestaurants().then(function(data) {
    $scope.restaurants = data;
  });

  $scope.select = function(restaurant) {
    $state.go('map.restaurant', { restaurantSlug: restaurant.slug });
  }
})
.service('mapState', function() {
  var state = {
    gmap: {},
    center: {
      latitude: 46.05,
      longitude: 14.5
    },
    zoom: 14
  };
  
  return state;
})
