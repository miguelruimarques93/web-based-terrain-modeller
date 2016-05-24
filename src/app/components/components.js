import angular from 'angular';
// import Home from './home/home';
import Editor from './editor/editor';

let componentModule = angular.module('app.components', [
  // Home.name,
  Editor.name
]);

export default componentModule;