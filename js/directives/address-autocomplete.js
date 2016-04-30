angular.module('vegamap-app')
.directive('addressAutocomplete', function() {
  return {
    restrict: 'E',
    templateUrl: './js/directives/address-autocomplete.html',
    controller: function($scope, $q, mapState, userData) {
      var autocompleteService = new google.maps.places.AutocompleteService();
      var placesService = new google.maps.places.PlacesService(mapState.gmap.getGMap());

      if (userData.hasLocation()) {
        $scope.selectedItem = userData.getLocation();
      }

      userData.addListener($scope, function(item) {
        console.log("addressAutocomplete callback", item)
        $scope.selectedItem = item;
      })

      var deferred;
      var getResults = function(address) {
        deferred && deferred.reject();
        deferred = $q.defer();
        autocompleteService.getPlacePredictions({
          input: address,
          bounds: mapState.gmap.getGMap().getBounds()
        }, function(data) {
          deferred.resolve(data);
        });

        return deferred.promise;
      }

      var selectedItemChange = function(item) {
        if (!item || !item.place_id) {
          return;
        }

        placesService.getDetails({ placeId: item.place_id }, function(data, status) {
          userData.setLocation({
            latitude: data.geometry.location.lat(),
            longitude: data.geometry.location.lng(),
            accuracy: data.geometry.viewport ? (google.maps.geometry.spherical.computeDistanceBetween(
              data.geometry.viewport.getNorthEast(),
              data.geometry.viewport.getSouthWest()
            ) / 4) : 50,
            description: data.formatted_address
          });
        });
      }

      $scope.querySearch = getResults;
      $scope.selectedItemChange = selectedItemChange;
    }
  }
});