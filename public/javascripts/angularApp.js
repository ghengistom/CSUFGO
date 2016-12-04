var app = angular.module('CSUFGO', ['ui.router']);

// this is a 'service' or 'factory' for the events
app.factory('events', ['$http', 'auth', function($http, auth){
	var o = {
		events: []
	};
	// this function gets all the events for the webpage from the DB
	o.getAll = function() {
		return $http.get('/events').success(function(data){
			angular.copy(data, o.events);
		});
	};
	// this function allows for events to be created and saved to DB
	o.create = function(event) {
		return $http.post('/events', event, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			o.events.push(data);
		});
	};
	// This function gets a single post from our server
	o.get = function(id) {
		return $http.get('/events/' + id).then(function(res){
			return res.data;
		});
	};

	o.addSubscriber = function(id, subscriber) {
		return $http.post('/events/' + id + '/subscribers', subscriber, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	o.editEvent = function(id, event_copy) {
		return $http.put('/editEvent/' + id, event_copy, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	o.deleteEvent = function(id) {
		return $http.delete('/deleteEvent/' + id, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	return o;
}]);

// this is a 'service' or 'factory' for the authentications
app.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};

	auth.saveToken = function (token){
		$window.localStorage['CSUFGO-token'] = token;
	};
	auth.getToken = function (){
		return $window.localStorage['CSUFGO-token'];
	};
	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};
	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};
	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};
	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
		});
	};
	auth.logOut = function(){
		$window.localStorage.removeItem('CSUFGO-token');
	};
	return auth;
}])

// this is providing the states to the index.html
// states == various pages
app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){

		$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
				eventPromise: ['events', function(events){
					return events.getAll();
				}]
			}
		})
		.state('events', {
			url: '/events/{id}',
			templateUrl: '/events.html',
			controller: 'EventsCtrl',
			resolve: {
				event: ['$stateParams', 'events', function($stateParams, events){
					return events.get($stateParams.id);
				}]
			}
		})
		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if(auth.isLoggedIn()){
					$state.go('home');
				}
			}]
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if(auth.isLoggedIn()){
					$state.go('home');
				}
			}]
		})
		.state('createEvent', {
			url: '/createEvent',
			templateUrl: '/createEvent.html',
			controller: 'CreateEventCtrl',
			resolve: {
				eventPromise: ['events', function(events){
					return events.getAll();
				}]
			}
		})
		.state('editEvent', {
			url: '/editEvent/{id}',
			templateUrl: '/editEvent.html',
			controller: 'EditEventCtrl',
			resolve: {
				event: ['$stateParams', 'events', function($stateParams, events){
					return events.get($stateParams.id);
				}]
			}
		});

		$urlRouterProvider.otherwise('home');
	}]);

// This is controlling the homepage part at the moment: allows user to add an event
app.controller('MainCtrl', [
	'$scope',
	'events',
	'auth',
	function($scope, events, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.events = events.events;
		$scope.addEvent = function(){
			if(!$scope.title || $scope.title == '') { return; }
			if(!$scope.time || $scope.time == '') { return; }
			if(!$scope.location || $scope.location == '') { return; }
			if(!$scope.contact || $scope.contact == '') { return; }
			if(!$scope.description || $scope.description == '') { return; }

			events.create({
				title: $scope.title,
				time: $scope.time,
				location: $scope.location,
				contact: $scope.contact,
				description: $scope.description
			});
			$scope.title = '';
			$scope.time = '';
			$scope.location = '';
			$scope.contact = '';
			$scope.description = '';
		};
	}
	]);

app.controller('EventsCtrl', [
	'$scope',
	'events',
	'event',
	'auth',
	function($scope, events, event, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.event = event;
		$scope.addSubscriber = function(){
			if(!$scope.firstname || $scope.firstname == '') { return; }
			if(!$scope.lastname || $scope.lastname == '') { return; }
			//console.log("HERE" + $scope.firstname + " " + $scope.lastname);
			events.addSubscriber(event._id, {
				firstname: $scope.firstname,
				lastname: $scope.lastname,

				//MADE CHANGES HERE
				author: 'user'

			}).success(function(subscriber){
				$scope.event.subscribers.push(subscriber);
			});
			$scope.firstname = '';
			$scope.lastname = '';
		};
		$scope.deleteEvent = function(){
			console.log("In delete");
			events.deleteEvent(event._id);
		};
	}
	]);

app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};

		$scope.logIn = function(){
			auth.logIn($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};
	}]);

app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}]);

app.controller('CreateEventCtrl', [
	'$scope',
	'events',
	'auth',
	function($scope, events, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.events = events.events;
		$scope.addEvent = function(){
			if(!$scope.title || $scope.title == '') { return; }
			if(!$scope.time || $scope.time == '') { return; }
			if(!$scope.location || $scope.location == '') { return; }
			if(!$scope.contact || $scope.contact == '') { return; }
			if(!$scope.description || $scope.description == '') { return; }

			events.create({
				title: $scope.title,
				time: $scope.time,
				location: $scope.location,
				contact: $scope.contact,
				description: $scope.description
			});
			$scope.title = '';
			$scope.time = '';
			$scope.location = '';
			$scope.contact = '';
			$scope.description = '';
		};
	}
	]);

	app.controller('EditEventCtrl', [
		'$scope',
		'events',
		'event',
		'auth',
		function($scope, events, event, auth){
			$scope.isLoggedIn = auth.isLoggedIn;
			$scope.event = event;
			$scope.editEvent = function(){
				if(!$scope.title || $scope.title == '') { return; }
				if(!$scope.time || $scope.time == '') { return; }
				if(!$scope.location || $scope.location == '') { return; }
				if(!$scope.contact || $scope.contact == '') { return; }
				if(!$scope.description || $scope.description == '') { return; }

				events.editEvent(event._id, {
					title: $scope.title,
					time: $scope.time,
					location: $scope.location,
					contact: $scope.contact,
					description: $scope.description
				});
			};
		}
		]);
