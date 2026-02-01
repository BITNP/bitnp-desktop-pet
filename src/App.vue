<template>
  <div class="move-box" id="move-box"></div>
  <Page ref="Demo"/>
</template>

<script>
import Page from './pages/PetPage.vue'
// import Demo from './Demo/Teacher.vue'

export default {
  components: {
    Page
  }
};
</script>

<style>

* {
  margin: 0;
  padding: 0;
}

html {
  background-color: rgba(255, 255, 255, 0);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

button {
  user-select: none;
}
</style>
