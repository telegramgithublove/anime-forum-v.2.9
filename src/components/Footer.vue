<template>
  <footer class="footer bg-gradient-to-r from-purple-600 to-blue-500 text-white py-4">
    <div class="container mx-auto flex justify-between items-center">
      <!-- Логотип и копирайт -->
      <div class="flex items-center space-x-4">
        <img src="/image/logo.png" alt="Logo" class="w-14 h-14" />
        <span>© 2024 Anime Lights Forum. Все права защищены.</span>
      </div>

      <!-- Ссылки в футере -->
      <nav class="space-x-4 ml-auto">
        <a href="#" class="hover:underline">О нас</a>
        <a href="#" class="hover:underline">Правила форума</a>
        <a href="#" class="hover:underline">Контакты</a>
        <a href="#" class="hover:underline">Помощь</a>
      </nav>
    </div>
  </footer>
</template>

<script setup>
// Footer logic, если нужно
</script>

<style scoped>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
}
</style>
