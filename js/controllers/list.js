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
