<template>
  <div class="app-container">
    <ClientOnly>
      <FlipbookViewer />
    </ClientOnly>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
