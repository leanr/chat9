var app = angular.module('chatApp', ['ngRoute']);
var socket, nickname;
app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'login.html',
        controller: 'AuthController'
      }).
      when('/chat', {
        templateUrl: 'chat.html',
        controller: 'ChatController'
      }).
      otherwise({
        redirectTo: '/'
      });
  }
]);

app.controller('AuthController', function ($scope,$location) {

  $scope.login = function(){
    if(($scope.nickname).length < 3){   
      alert('Nick name must be atleast 3 characters long!');
      return false;
    } 
    else if(($scope.email).length < 4){
      alert('Invalid email');
      return false;
    } else{
      $scope.connect();
    }
  }

  $scope.connect = function(){
      socket = io.connect('http://manachat537.mybluemix.net');
      var hash = CryptoJS.MD5($scope.email);
      socket.emit('newuser',{nickname: $scope.nickname, emailhash: String(hash)},function(data){
         if(data.status == true){
            nickname = $scope.nickname;
            $scope.$apply(function(){
               $location.path('/chat');
            });
         } else{
            alert('Nickname already taken!');
         }
      });
  }

});

app.controller('ChatController', function ($scope,$location,$timeout) {
  if(nickname == ''){
    $location.path('/');
    return false;
  }
   var messages = {};
   $scope.mynickname = nickname;
   $scope.activeChat = false;
   $scope.emptyChat = true;
   if(socket == undefined){
      $location.path('/');
      return false;
   }

   socket.on('users',function(users){
      $scope.$apply(function(){
         $scope.mysocketid = localStorage.getItem('socketid');
         $scope.users = users.filter(function(item) { return item.nickname !== nickname; });
         if(users.filter(function(item) { return item.nickname === $scope.selectedUser; }).length == 0){
            $scope.emptyChat = true;
            $scope.activeChat = false;
            $scope.conversation = [];
         }
      });
   });

   $scope.loadChat = function(data){ 
          $scope.msgcount = 0;
          $scope.rec_socketid = data.currentTarget.attributes.socketid.value;
          $scope.selectedUser = data.currentTarget.attributes.nickname.value;
          $scope.selectedUserHash = data.currentTarget.attributes.emailhash.value;
          angular.element(document.querySelector('li[nickname="'+$scope.selectedUser+'"]')).removeClass('pending');
          $scope.emptyChat = false;
          $scope.activeChat = true;
          $scope.conversation = messages[$scope.selectedUser];
          if($scope.conversation !== undefined){
            $scope.msgcount = ($scope.conversation).length;
            $scope.scrollToBottom();
          }
   }

   $scope.sendMessage = function(data){
      if($scope.message == '') return false;
      $scope.pushMessage($scope.selectedUser,nickname,$scope.message);
      socket.emit('sendmessage',{message:$scope.message,receiver:$scope.rec_socketid});
      $scope.message = '';
      $timeout(function(){
          $scope.conversation = messages[$scope.selectedUser];
          $scope.msgcount = ($scope.conversation).length;
          $scope.scrollToBottom();
      }, 100);
   }

   socket.on('receivemessage',function(data){  
      $scope.pushMessage(data.nickname,data.nickname,data.message);
      if($scope.selectedUser == undefined || $scope.selectedUser != data.nickname){         
         angular.element(document.querySelector('li[nickname="'+data.nickname+'"]')).addClass('pending');
      }
      
      $timeout(function(){
        if($scope.selectedUser == data.nickname){
          $scope.conversation = messages[data.nickname];
          $scope.msgcount = ($scope.conversation).length;
          $scope.scrollToBottom();
        }
      }, 100);
   });

   $scope.pushMessage = function(p_nickname,p_from,p_message){
      if(messages.hasOwnProperty(p_nickname)){
      } else{
         messages[p_nickname] = [];
      }
      var msg = {
         from: p_from,
         message: p_message,
         time: Math.round((new Date() / 1000))
      };
      messages[p_nickname].push(msg);
   }

   $scope.scrollToBottom = function(){
      $timeout(function() {
        var scroller = document.getElementById("chat-data");
        scroller.scrollTop = scroller.scrollHeight;
      }, 0, false);
   }
});
