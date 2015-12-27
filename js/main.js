angular.module('vegamap-app', ['ui.router', 'uiGmapgoogle-maps', 'geolocation'])
.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/map/list');

  $stateProvider
  .state('map', {
    url: '/map',
    abstract: true,
    views: {
      map: {
        controller: 'MapController',
        templateUrl: 'partials/main.html'
      }
    }
  })
  .state('map.list', {
    url: '/list',
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
    }
  });
})
.run(function($rootScope, $location, $window){
  $rootScope.$on('$stateChangeSuccess', function(event) {
    if (!$window.ga) return;
    $window.ga('send', 'pageview', { page: $location.path() });
  });
})
.controller('ListController', function($scope, $state, dataProvider, mapState) {
  $scope.restaurants = dataProvider.restaurants;

  $scope.select = function(restaurant) {
    $state.go('map.restaurant', { restaurantSlug: restaurant.slug });
  }
})
.controller('RestaurantController', function($scope, $stateParams, dataProvider, mapState) {
  var restaurant = dataProvider.findBySlug($stateParams.restaurantSlug);

  $scope.restaurant = restaurant;
  var wathcer = $scope.$watch(function() { return mapState.gmap.getGMap; }, function(maps) {
    if (mapState.gmap.getGMap) {
      mapState.gmap.getGMap().panTo({
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude
      });
      mapState.zoom = 17;
      wathcer();
    }
  });
})
.controller('MapController', function($scope, $state, dataProvider, mapState,
    uiGmapGoogleMapApi, geolocation) {
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
  
  uiGmapGoogleMapApi.then(function(maps) {
    $scope.data = dataProvider.restaurants;
  });
  
  geolocation.getLocation()
  .then(function(data) {
    console.log('location known', data);
    $scope.position = {
      longitude: data.coords.longitude,
      latitude: data.coords.latitude,
      accuracy: data.coords.accuracy
    };
    
    $scope.fit = false;
    mapState.center = {
      longitude: data.coords.longitude,
      latitude: data.coords.latitude
    };
    $scope.zoom = 18;
  })
  .catch(function() {
    // TODO: do something
  });
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
.service('dataProvider', function() {
  var restaurants = [
    {
      id: 0,
      slug: "Ajdovo_Zrno",
      name: "Ajdovo Zrno",
      address: "Trubarjeva 7, Ljubljana",
      location: { latitude: 46.052012, longitude: 14.507220 },
      type: 1,
      phone: "040832446",
      note: "veganska in presna ponudba",
    },
    {
      id: 1,
      slug: "Bobencek",
      name: "Bobenček",
      address: "Trubarjeva 17, Ljubljana",
      location: { latitude: 46.052409, longitude: 14.508389 },
      type: 0,
      phone: "014321283",
      note: "veganske jedi, smoothiji, rastlinsko mleko, presne torte",
    },
    {
      id: 2,
      slug: "Loving_Hut_-_Ljubljana_Vic",
      name: "Loving Hut - Ljubljana Vič",
      address: "Koprska ulica 72, Ljubljana",
      location: { latitude: 46.036941, longitude: 14.482071 },
      type: 0,
      phone: "070631500",
      note: "veganska hrana in pijača",
    },
    {
      id: 3,
      slug: "Loving_Hut_-_Ljubljana_Center",
      name: "Loving Hut - Ljubljana Center",
      address: "Trg osvobodilne fronte 14, Ljubljana",
      location: { latitude: 46.057449, longitude: 14.508750 },
      type: 0,
      phone: "068126970",
      note: "veganska hrana in pijača",
    },
    {
      id: 4,
      slug: "Loving_Hut_-_Ljubljana_Siska",
      name: "Loving Hut - Ljubljana Šiška",
      address: "Devova ulica 5, Ljubljana",
      location: { latitude: 46.086281, longitude: 14.477469 },
      type: 0,
      phone: "068130463",
      note: "veganska hrana in pijača",
    },
  ];

  var findBySlug = function(slug) {
    return _.find(restaurants, _.matchesProperty('slug', slug));
  };
  
  return {
    restaurants: restaurants,
    findBySlug: findBySlug
  }
});
