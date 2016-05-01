/* global _ */
/* global angular */

angular.module('vegamap-app')
.controller('ListController', function($scope, $state, $window, dataProvider, mapState, userData) {
  dataProvider.getRestaurants(userData.getLocation()).then(function(data) {
    $scope.restaurants = data;
  });

  userData.addListener($scope, function(location) {
    dataProvider.getRestaurants(location).then(function(data) {
      $scope.restaurants = data;
    });
  });

  $scope.select = function(restaurant) {
    $state.go('map.restaurant', { restaurantSlug: restaurant.slug });

    $window.ga && $window.ga('send', 'event', 'list', 'navigate_listitem');
  }
})
