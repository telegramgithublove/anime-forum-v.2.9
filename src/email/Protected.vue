<template>
  <div class="protected-page">
    <h2>Защищенная страница</h2>
    <p>Если вы видите эту страницу, значит ваш email подтвержден!</p>
  </div>
</template>

<script>
export default {
  name: 'Protected'
}
</script>

<style scoped>
.protected-page {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
</style>
