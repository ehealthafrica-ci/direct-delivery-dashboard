'use strict';

angular.module('planning')
		.controller('ManageFacilitiesCtrl', function ($state, $modal, deliveryRound, copyRoundService, scheduleService, log, locationService) {
			var vm = this;

			vm.deliveryRound = deliveryRound;
			vm.facilityList = [];
			vm.selectedList = {};
			vm.selectOptions = [ 'All', 'None' ];
			vm.roundTemplate = [];

			vm.disableSave = function(){
				return angular.isObject(vm.selectedList) && Object.keys(vm.selectedList).length === 0;
			};

			vm.onSelect = function(option){
				var none = vm.selectOptions[1];
				if(option === none){
					return vm.selectedList = {};
				}
				vm.selectedList = {};
				vm.facilityList.forEach(function(facility){
					vm.selectedList[facility.id] = true;
				})
			};

			vm.onSelection = function(roundTemplate){
				vm.facilityList = [];
				vm.roundTemplate = roundTemplate;
				vm.roundTemplate.forEach(function(dailySchedule){
					dailySchedule.facilityRounds.forEach(function(facilityRound){
						vm.facilityList.push(facilityRound.facility);
						vm.selectedList[facilityRound.facility.id] = true;
					});
				});
			};

			vm.openAddFacilitiesDialog = function() {
				var addFacilitiesDialog = $modal.open({
					animation: true,
					templateUrl: 'app/planning/facilities/dialogs/add/add-facility-dialog.html',
					controller: 'AddFacilityDialogCtrl',
					controllerAs: 'afdCtrl',
					size: 'lg',
					keyboard: false,
					backdrop: 'static',
					resolve: {
						locationLevels: function(locationService){
							return locationService.levels()
									.catch(function(){
										return [];
									});
						},
						deliveryRound: function(){
							return vm.deliveryRound;
						}
					}
				});
				
				addFacilitiesDialog.result
						.then(vm.onSelection);
			};

			vm.copyFromRoundDialog = function() {
				var copyRoundDialog = $modal.open({
					animation: true,
					templateUrl: 'app/planning/facilities/dialogs/copy-round/copy-round.html',
					controller: 'CopyRoundTemplateDialogCtrl',
					controllerAs: 'crtdCtrl',
					size: 'lg',
					keyboard: false,
					backdrop: 'static',
					resolve: {
						deliveryRounds: function(planningService){
							return planningService.all()
									.catch(function(){
										return [];
									});
						},
						deliveryRound: function(){
							return vm.deliveryRound;
						}
					}
				});

				copyRoundDialog.result
						.then(vm.onSelection);
			};

			function OnError(err){
				if(err.status === 401){
					return log.error('unauthorizedAccess', err);
				}
				if(err.status === 409){
					return log.error('updateConflict', err);
				}
				log.error('saveBatchScheduleFailed', err);
			}

			function onSuccess(res){
				log.success('schedulesSaved');
				var stateParams = { roundId: vm.deliveryRound._id };
				$state.go('planning.schedule', stateParams);
			}

			vm.save = function(){
				var roundSchedules = copyRoundService.copySchedules(vm.roundTemplate, vm.selectedList);
				scheduleService.saveSchedules(roundSchedules)
						.then(onSuccess)
						.catch(OnError);
			};

		});