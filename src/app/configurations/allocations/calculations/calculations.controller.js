/**
 * Created by ehealthafrica on 7/10/15.
 */

angular.module('allocations')
  .controller('CalculationsController', function (products, locations, locationService, calculationService, pouchUtil, log) {
    var vm = this;
    var viewMap = {
      targetpopulation: "getTargetPop",
      coverage: "computeCoverage",
      wastage: "computeWastage",
      schedule: "computeSchedule"
    };
    vm.productList = products || [];
    vm.renderedPartial = 'tp';
    vm.renderedViewLabel = 'target populations';
    vm.activeView = 'targetpopulation';
    vm.renderedData = [];
    vm.locationStates = ['KN', 'BA'];
    vm.selectedState = 'KN';
    vm.selectedLga = '';
    vm.lgas = [];
    vm.wards = [];

    findLga = function (state) {
      var keys = [];
      keys.push(["4", state]);
      return locationService.getByLevelAndAncestor(keys)
        .then(function (response) {
          vm.lgas = response;
          vm.selectedLga = response[0];
          return vm.selectedLga;
        })
        .catch(function (err) {
          log.error('', err, 'could not fetch lga list, please try again. contact admin if this persists.');
        });
    };
    function resetView (facilities) {
      return calculationService[viewMap[vm.activeView]](facilities)
        .then(function (response) {
          vm.renderedData = response;
          return response;
        });
    }

    function getFacilities(lgs) {
      var level = "6";
      var keys = [];
      var lgas = lgs || vm.selectedLga;
      if(!lgas){
        vm.rederedData = [];
        return;
      }
      if (angular.isArray(lgas)) {
        for (i in locationid) {
          keys.push([level, lgas[i]._id]);
        }
      } else {
        keys.push([level, lgas._id]);
      }
      return locationService.getByLevelAndAncestor(keys)
        .then(function (response) {
          return response;
        })
        .catch(function(err){
          log.error('','', 'could not retrieve facilitie, please reload and try again')
        })
    }
    function switchRenderedPartial(partial) {
      vm.renderedPartial = partial;
      return getFacilities()
        .then(resetView)
    }
    vm.switchLocationState = function (stateID) {
      var state = stateID || vm.selectedState;
      return findLga(state)
        .then(getFacilities)
        .then(resetView)
        .catch(function(err){
          log.error('',err, 'switching LGA failed');
          return [];
        })
    };
    //TODO: accomodate more than one lga at a time; input to single lga or array of lgas
    vm.switchLocationLga = function (lgas) {
     vm.selectedLga = lgas;
     return getFacilities(lgas)
      .then(resetView)
      .catch(function (err) {
        log.error('', '', 'switching LGA failed please reload page and try again')
      });
    };

    vm.switchLocationState(vm.selectedState);


    vm.changeDataView = function (partial, viewLabel) {
      var view = viewLabel.replace(' ', '');
      vm.renderedViewLabel = view;
      vm.activeView = view;
      switchRenderedPartial(partial);
    };

  });