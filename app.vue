<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<style>
.page-enter-active,
.page-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.page-enter-from {
  transform: translateY(5%);
  opacity: 0;
}
.page-leave-to {
  transform: translateY(5%);
  opacity: 0;
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.4s;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
