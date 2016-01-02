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
        templateUrl: 'partials/main.html'
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
.controller('ListController', function($scope, $state, dataProvider, mapState) {
  dataProvider.getRestaurants().then(function(data) {
    $scope.restaurants = data;
  });

  $scope.select = function(restaurant) {
    $state.go('map.restaurant', { restaurantSlug: restaurant.slug });
  }
})
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
.service('userData', function() {
  var data = {
    location: {}
  };
  
  return data;
})
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
