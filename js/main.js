/* global _ */
/* global angular */

angular.module('vegamap-app', ['ui.router', 'ngMaterial', 'uiGmapgoogle-maps', 'geolocation'])

// config routes
.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/map');

  $stateProvider
  .state('map', {
    url: '/map',
    abstract: true,
    views: {
      map: {
        controller: 'MapController',
        templateUrl: 'partials/map.html'
      }
    },
    resolve: {
      uiGmapGoogleMapApi: "uiGmapGoogleMapApi"
    }
  })
  .state('map.list', {
    url: '',
    views: {
      overlay: {
        controller: 'ListController',
        templateUrl: 'partials/list.html'
      }
    }
  })
  .state('map.restaurant', {
    url: '/{restaurantSlug:[a-zA-Z 0-9_-]+}',
    views: {
      sidebar: {
        controller: 'RestaurantController',
        templateUrl: 'partials/restaurant.html'
      }
    },
    resolve: {
      restaurant: function($stateParams, dataProvider) {
        return dataProvider.findBySlug($stateParams.restaurantSlug);
      }
    }
  });
})

/// config themes
.config(function($mdThemingProvider, $mdIconProvider) {
  $mdThemingProvider
      .theme('default')
      .primaryPalette('pink')
      .accentPalette('orange');

  $mdIconProvider
      .icon('phone',      'svg/phone.svg')
      .icon('place',      'svg/place.svg')
      .icon('email',      'svg/email.svg')
      .icon('arrow-back', 'svg/arrow-back.svg');
})
.run(function($rootScope, $location, $window){
  $rootScope.$on('$stateChangeSuccess', function(event) {
    if (!$window.ga) return;
    $window.ga('send', 'pageview', { page: $location.path() });
  });
})

/////////////////////////
/// service: userData ///
/////////////////////////
.service('userData', function() {
  var data = {
    location: {}
  };
  
  return data;
})

/////////////////////////////
/// service: dataProvider ///
/////////////////////////////
.service('dataProvider', function($http, $q) {
  var dataPromise = $http.get('data/restaurants.json');
  
  var getRestaurants = function() {
    return dataPromise.then(function(response) {
      return response.data.restaurants;
    });
  };
  
  var findBySlug = function(slug) {
    return getRestaurants()
    .then(function(data) {
      return _.find(data, _.matchesProperty('slug', slug));
    });
  };
  
  return {
    getRestaurants: getRestaurants,
    findBySlug: findBySlug
  }
});
