/* global _ */
/* global angular */

var app = angular.module('vegamap-app', ['ui.router', 'ngMaterial', 'uiGmapgoogle-maps', 'geolocation', 'angular-cache'])

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
      .primaryPalette('pink', {
        'default': '400',
        'hue-1': '100',
        'hue-2': '400',
        'hue-3': '800'
      })
      .accentPalette('deep-orange');
})

// config gestures
.config(function( $mdGestureProvider ) {
  $mdGestureProvider.skipClickHijack();
})

/// config google maps
.config(function(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBMbjE3DWdjqfGtS1CW3NO0Q1VhVuiEJaw',
    libraries: 'places,geometry'
  });
})

/// config cache
.config(function(CacheFactoryProvider) {
  angular.extend(CacheFactoryProvider.defaults, { storageMode: 'localStorage' });
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

NotificationService.prototype.notifyListeners = function(data, clone) {
  _.forOwn(this.listeners, function(listeners, key) {
    _.each(listeners, function(listener) {
      listener(clone ? angular.copy(data) : data);
    });
  });
};

/////////////////////////
/// service: userData ///
/////////////////////////
function UserDataService(CacheFactory) {
  NotificationService.call(this);

  if (!CacheFactory.get(this.constructor.name)) {
    CacheFactory.createCache(this.constructor.name);
  }

  this.cache = CacheFactory.get(this.constructor.name);

  // restore data from cache
  if (this.cache.get('location')) {
    this.location = JSON.parse(this.cache.get('location'));
  } else {
    this.location = undefined;
  }
}

UserDataService.prototype = Object.create(NotificationService.prototype);
UserDataService.prototype.constructor = UserDataService;

UserDataService.prototype.setLocation = function(loc) {
  this.cache.put('location', JSON.stringify(loc));
  this.location = angular.copy(loc, this.location);

  this.notifyListeners(this.location, true);
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
.service('mapState', function(uiGmapIsReady) {
  var state = {
    gmap: {},
    center: {
      latitude: 46.05,
      longitude: 14.5
    },
    zoom: 14,

    directionsRenderer: undefined
  };

  uiGmapIsReady.promise(1)
  .then(function() {
    state.directionsRenderer = new google.maps.DirectionsRenderer({ map: state.gmap.getGMap() });
  })

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
        if (!restaurant.temp || DistanceService.distance(location, restaurant.temp.location) > 1) {
          restaurant.temp = {
            location: location,
            distance: DistanceService.distance(location, restaurant.location)
          }
        }
      });

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
});

function DirectionsService($q) {
  this.$q = $q;

  this.directionsService = new google.maps.DirectionsService();
}

DirectionsService.prototype.route = function(request) {
  var deferred = this.$q.defer();

  request.travelMode = request.travelMode || google.maps.TravelMode.DRIVING;
  this.directionsService.route(request, function(directions, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      deferred.resolve(directions);
    } else {
      deferred.reject(status);
    }
  });

  return deferred.promise;
}

app.service('DirectionsService', DirectionsService);
