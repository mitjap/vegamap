/* global _ */
/* global angular */

var app = angular.module('vegamap-app', ['ui.router', 'ngMaterial', 'uiGmapgoogle-maps', 'geolocation'])

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
      sidebar: {
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
.config(function($mdThemingProvider) {
  $mdThemingProvider
      .theme('default')
      .primaryPalette('blue')
      .accentPalette('orange');
})

/// config google maps
.config(function(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBMbjE3DWdjqfGtS1CW3NO0Q1VhVuiEJaw',
    libraries: 'places,geometry'
  });
})

/// RUN!
.run(function($rootScope, $location, $window){
  $rootScope.$on('$stateChangeSuccess', function(event) {
    $window.ga && $window.ga('send', 'pageview', { page: $location.path() });
  });
});

/// Notification class
function NotificationService() {
  this.listeners = {};
}

NotificationService.prototype.addListener = function($scope, listener) {
  var listeners = this.listeners[$scope.$id] || [];
  listeners.push(listener);
  this.listeners[$scope.$id] = listeners;

  // remove listener on scope destruction
  $scope.$on('$destroy', _.bind(this.removeListener, this, $scope));
}

NotificationService.prototype.removeListener = function($scope) {
  delete this.listeners[$scope.$id];
}

NotificationService.prototype.notifyListeners = function(data) {
  _.forOwn(this.listeners, function(listeners, key) {
    _.each(listeners, function(listener) {
      listener(data);
    });
  });
};

/////////////////////////
/// service: userData ///
/////////////////////////
function UserDataService() {
  NotificationService.call(this);

  this.location = undefined;
}

UserDataService.prototype = Object.create(NotificationService.prototype);
UserDataService.prototype.constructor = UserDataService;

UserDataService.prototype.setLocation = function(loc) {
  this.location = angular.copy(loc, this.location);

  this.notifyListeners(this.location);
}

UserDataService.prototype.getLocation = function() {
  return angular.copy(this.location);
}

UserDataService.prototype.hasLocation = function() {
  return !_.isUndefined(this.location);
}

app.service('userData', UserDataService)

/////////////////////////
/// service: mapState ///
/////////////////////////
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

/////////////////////////////
/// service: dataProvider ///
/////////////////////////////
.service('dataProvider', function($http, $q, DistanceService) {
  var dataPromise = $http.get('data/restaurants.json');

  var getRestaurants = function(location) {
    return dataPromise.then(function(response) {
      return response.data.restaurants;
    })
    .then(function(restaurants) {
      if (!location) return restaurants;

      // add temporary distance from location field
      _.each(restaurants, function(restaurant) {
        restaurant.temp = {
          distance: DistanceService.distance(location, restaurant.location)
        }
      })

      return restaurants.sort(function(a, b) {
        return a.temp.distance - b.temp.distance;
      });
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

////////////////////////
/// GeoCodingService ///
////////////////////////

function GeocodingService($q) {
  this.$q = $q;

  this.geocoder = new google.maps.Geocoder;
}

GeocodingService.prototype.geocode = function(data) {
  var deferred = this.$q.defer();

  this.geocoder.geocode(data, function(results, status) {
    switch(status) {
      case google.maps.GeocoderStatus.OK:
        deferred.resolve(results);
        break;
      case google.maps.GeocoderStatus.ZERO_RESULTS:
        deferred.resolve([]);
        break;
      default:
        deferres.reject(status);
        break;
    }
  });

  return deferred.promise;
}

app.service('GeocodingService', GeocodingService);

app.service('DistanceService', function() {
  return {
    distance: function(loc1, loc2) {
      return google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(loc1.lat || loc1.latitude, loc1.lng || loc1.longitude),
        new google.maps.LatLng(loc2.lat || loc2.latitude, loc2.lng || loc2.longitude)
      )
    }
  };
})
