<template>
  <footer class="bg-gray-800 text-white py-4 mt-8 w-full">
    <div class="container mx-auto px-6 flex justify-between items-center">
      <div class="text-sm">
        &copy; {{ currentYear }} MongoDB Web-Based CLI | Created by <a href="https://github.com/aleksis-ste" target="_blank" class="text-blue-300 hover:text-blue-500">Aleksis Šteinburgs</a>
      </div>
      <div class="flex space-x-4">
        <a href="https://github.com/aleksis-ste/mongodb-web-cli" target="_blank" class="text-blue-300 hover:text-blue-500">
          <i class="fab fa-github"></i> GitHub
        </a>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  data() {
    return {
      currentYear: new Date().getFullYear(),
    };
  },
};
</script>

<style scoped>
/* Ensure the footer looks clean and consistent */
footer {
  border-top: 1px solid #4a5568;
}
</style>