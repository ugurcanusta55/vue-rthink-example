<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import VueSocketIOExt from 'vue-socket.io-extended';
import { io } from 'socket.io-client';
import Vue from 'vue'

const socket = io('https://test-sock.example.com');

Vue.use(VueSocketIOExt, socket);


export default {
  name: 'App',
  components: {
    HelloWorld
  },
  sockets: {
    connect() {
      console.log('socket connected')
      this.$socket.client.emit("clientId", "asdadsa");
    },
    gps_data(val) {
      console.log('this method was fired by the socket server. eg: io.emit("customEmit", data)', val)
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
