<template>
  <div class="flipbook-wrapper" :class="{ maximized: isMaximized }" ref="wrapperRef">
    <!-- Background Music -->
    <audio ref="audioRef" src="/wedding-music.mp3" loop preload="auto"></audio>

    <div v-if="isLoading" class="loading-state">
      Loading your flipbook...
    </div>

    <div v-else class="book-container">
      <div id="flipbook" ref="bookRef" :style="{ transform: bookTransform }">
        <!-- Front Cover Outer -->
        <div class="page" data-density="hard">
          <div class="page-content">
            <NuxtImg 
              v-if="bookData.covers.frontOuter"
              :src="bookData.covers.frontOuter" 
              format="webp"
              alt="Front Cover Outer"
              class="page-image"
              loading="lazy"
              sizes="xs:100vw sm:100vw md:50vw lg:1122px"
              @load="(e) => e.target.classList.add('loaded')"
            />
            <span v-else>Front Cover</span>
          </div>
        </div>

        <!-- Front Cover Inner -->
        <div class="page" data-density="hard">
          <div class="page-content">
            <NuxtImg 
              v-if="bookData.covers.frontInner"
              :src="bookData.covers.frontInner" 
              format="webp"
              alt="Front Cover Inner"
              class="page-image"
              loading="lazy"
              sizes="xs:100vw sm:100vw md:50vw lg:1122px"
              @load="(e) => e.target.classList.add('loaded')"
            />
            <span v-else>Inside Front</span>
          </div>
        </div>

        <!-- Inner Pages (Dynamic) -->
        <div class="page" data-density="hard" v-for="(pageUrl, idx) in bookData.pages" :key="pageUrl">
          <div class="page-content">
            <NuxtImg 
              :src="pageUrl" 
              format="webp"
              :alt="`Page ${idx + 1}`"
              class="page-image"
              loading="lazy"
              sizes="xs:100vw sm:100vw md:50vw lg:1122px"
              @load="(e) => e.target.classList.add('loaded')"
            />
          </div>
        </div>

        <!-- Back Cover Inner -->
        <div class="page" data-density="hard">
          <div class="page-content">
            <NuxtImg 
              v-if="bookData.covers.backInner"
              :src="bookData.covers.backInner" 
              format="webp"
              alt="Back Cover Inner"
              class="page-image"
              loading="lazy"
              sizes="xs:100vw sm:100vw md:50vw lg:1122px"
              @load="(e) => e.target.classList.add('loaded')"
            />
            <span v-else>Inside Back</span>
          </div>
        </div>

        <!-- Back Cover Outer -->
        <div class="page" data-density="hard">
          <div class="page-content">
            <NuxtImg 
              v-if="bookData.covers.backOuter"
              :src="bookData.covers.backOuter" 
              format="webp"
              alt="Back Cover Outer"
              class="page-image"
              loading="lazy"
              sizes="xs:100vw sm:100vw md:50vw lg:1122px"
              @load="(e) => e.target.classList.add('loaded')"
            />
            <span v-else>Back Cover</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-container glass-panel">
      <!-- <button @click="goToFirst" title="First Page" class="control-btn">
        <IconFirst />
      </button> -->
      <button @click="goToPrev" title="Previous Page" class="control-btn">
        <IconPrev />
      </button>
      
      <div class="divider"></div>
      
      <button @click="toggleAutoPlay" :title="isAutoPlaying ? 'Pause' : 'Auto Play'" class="control-btn play-btn" :class="{ active: isAutoPlaying }">
        <IconPause v-if="isAutoPlaying" />
        <IconPlay v-else />
      </button>
      
      <div class="divider"></div>
      
      <button @click="goToNext" title="Next Page" class="control-btn">
        <IconNext />
      </button>
      <!-- <button @click="goToLast" title="Last Page" class="control-btn">
        <IconLast />
      </button> -->
      
      <div class="divider"></div>
      
      <button @click="toggleMusic" :title="isMusicPlaying ? 'Mute Music' : 'Play Music'" class="control-btn music-btn" :class="{ 'music-on': isMusicPlaying }">
        <IconVolume2 v-if="isMusicPlaying" />
        <IconVolumeX v-else />
      </button>

      <div class="divider"></div>
      
      <button @click="toggleMaximize" :title="isMaximized ? 'Minimize' : 'Maximize'" class="control-btn">
        <IconMinimize v-if="isMaximized" />
        <IconMaximize v-else />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick } from 'vue'
import { 
  ArrowLeftToLine as IconFirst,
  ChevronLeft as IconPrev,
  Play as IconPlay,
  Pause as IconPause,
  ChevronRight as IconNext,
  ArrowRightToLine as IconLast,
  Maximize as IconMaximize,
  Minimize as IconMinimize,
  Volume2 as IconVolume2,
  VolumeX as IconVolumeX
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const bookData = ref({
  pages: [],
  covers: {
    frontOuter: null,
    frontInner: null,
    backInner: null,
    backOuter: null
  }
})

const checkFileExists = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) return false
    
    // Check if Nuxt is returning an HTML fallback instead of a 404
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

const extensions = ['.jpg', '.jpeg', '.png', '.webp']

const findCover = async (prefix) => {
  for (const ext of extensions) {
    const url = `/cover/${prefix}${ext}`
    if (await checkFileExists(url)) return url
  }
  return null
}

const fetchBookData = async () => {
  // Find Covers
  bookData.value.covers.frontOuter = await findCover('front-cover-1')
  bookData.value.covers.frontInner = await findCover('front-cover-2')
  bookData.value.covers.backInner = await findCover('back-cover-1')
  bookData.value.covers.backOuter = await findCover('back-cover-2')

  // Find Pages up to 200, allowing for some missing numbers (gaps)
  let consecutiveMisses = 0
  for (let i = 1; i <= 200; i++) {
    let found = null
    for (const ext of extensions) {
      const url = `/pages/${i}${ext}`
      if (await checkFileExists(url)) {
        found = url
        break
      }
    }
    if (found) {
      bookData.value.pages.push(found)
      consecutiveMisses = 0 // reset misses when a page is found
    } else {
      consecutiveMisses++
      // If we can't find 10 pages in a row, assume we've reached the end
      if (consecutiveMisses >= 10) {
        break
      }
    }
  }

  isLoading.value = false
}

const bookRef = ref(null)
const wrapperRef = ref(null)
const audioRef = ref(null)
const pageFlipInstance = shallowRef(null)

const isMaximized = ref(false)
const isAutoPlaying = ref(false)
const isMusicPlaying = ref(false)
const bookTransform = ref('translateX(0)')
let autoPlayInterval = null

onMounted(async () => {
  // Fetch pages dynamically from the client side
  await fetchBookData()
  
  const { PageFlip } = await import('page-flip')
  
  await nextTick() // Ensure DOM is fully rendered with the dynamic data

  if (!bookRef.value) return;
  
  // A4 Landscape aspect ratio: 297/210 ≈ 1.414
  pageFlipInstance.value = new PageFlip(bookRef.value, {
    width: 1122,
    height: 793,
    size: 'stretch',
    minWidth: 300,
    maxWidth: 1122,
    minHeight: 212,
    maxHeight: 793,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: true,
    usePortrait: true // Switch to single page mode on portrait devices
  })

  // Load pages from DOM
  const pages = bookRef.value.querySelectorAll('.page')
  pageFlipInstance.value.loadFromHTML(pages)

  // Listen for flip and state events to handle centering and query params
  pageFlipInstance.value.on('flip', (e) => {
    updateCentering(e.data)
    
    // Update query params to keep in sync
    const currentPage = e.data + 1
    router.replace({ query: { ...route.query, page: currentPage.toString() } })
  })

  pageFlipInstance.value.on('changeOrientation', () => {
    updateCentering(pageFlipInstance.value.getCurrentPageIndex())
  })

  // Initialize from query param if it exists
  const startPage = parseInt(route.query.page, 10)
  if (!isNaN(startPage) && startPage > 0) {
    const targetIndex = startPage - 1
    if (targetIndex < pageFlipInstance.value.getPageCount()) {
      pageFlipInstance.value.turnToPage(targetIndex)
      updateCentering(targetIndex)
    } else {
      updateCentering(0)
    }
  } else {
    // Initial centering
    setTimeout(() => {
      updateCentering(0)
    }, 100)
  }
})

const updateCentering = (pageIndex) => {
  if (!pageFlipInstance.value) return
  
  const orientation = pageFlipInstance.value.getOrientation()
  if (orientation === 'portrait') {
    bookTransform.value = 'translateX(0)'
    return
  }

  const total = pageFlipInstance.value.getPageCount()
  
  if (pageIndex === 0) {
    // Front cover is on the right side of the spread. Shift left to center it.
    bookTransform.value = 'translateX(-25%)'
  } else if (pageIndex >= total - 1) {
    // Back cover is on the left side of the spread. Shift right to center it.
    bookTransform.value = 'translateX(25%)'
  } else {
    // Book is open (middle pages). Center the whole spread.
    bookTransform.value = 'translateX(0)'
  }
}

onBeforeUnmount(() => {
  stopAutoPlay()
  if (pageFlipInstance.value) {
    pageFlipInstance.value.destroy()
  }
})

// Control methods
const goToFirst = () => {
  if (pageFlipInstance.value) pageFlipInstance.value.flip(0)
}

const goToPrev = () => {
  if (pageFlipInstance.value) pageFlipInstance.value.flipPrev()
}

const goToNext = () => {
  if (pageFlipInstance.value) pageFlipInstance.value.flipNext()
}

const goToLast = () => {
  if (pageFlipInstance.value) {
    const totalPages = pageFlipInstance.value.getPageCount()
    pageFlipInstance.value.flip(totalPages - 1)
  }
}

const toggleAutoPlay = () => {
  if (isAutoPlaying.value) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

const startAutoPlay = () => {
  isAutoPlaying.value = true
  autoPlayInterval = setInterval(() => {
    if (pageFlipInstance.value) {
      const current = pageFlipInstance.value.getCurrentPageIndex()
      const total = pageFlipInstance.value.getPageCount()
      if (current >= total - 1) {
        pageFlipInstance.value.flip(0)
      } else {
        pageFlipInstance.value.flipNext()
      }
    }
  }, 3000)
}

const stopAutoPlay = () => {
  isAutoPlaying.value = false
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

const toggleMusic = () => {
  if (!audioRef.value) return
  
  if (isMusicPlaying.value) {
    audioRef.value.pause()
    isMusicPlaying.value = false
  } else {
    audioRef.value.play().then(() => {
      isMusicPlaying.value = true
    }).catch(err => {
      console.error("Audio playback failed:", err)
    })
  }
}

const toggleMaximize = () => {
  if (!document.fullscreenElement) {
    if (wrapperRef.value.requestFullscreen) {
      wrapperRef.value.requestFullscreen()
    }
    isMaximized.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    isMaximized.value = false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isMaximized.value = !!document.fullscreenElement
  })
})
</script>

<style scoped>
.flipbook-wrapper {
  position: relative;
  width: 95vw;
  height: 90dvh;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-color);
  padding: 10px 0 20px 0; /* Top padding, no left/right, 20px bottom */
  box-sizing: border-box;
}

.flipbook-wrapper.maximized {
  width: 100vw;
  height: 100dvh;
  max-width: none;
  background: var(--bg-gradient);
}

.loading-state {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-color);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.book-container {
  width: 100%;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  min-height: 0; /* Ensures flex container can shrink if controls wrap */
}

#flipbook {
  /* Removed box-shadow here to prevent empty 2-page outline when closed */
  transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
  touch-action: pan-y pinch-zoom; /* Prevent browser swipe-to-go-back but allow pinch zoom */
}

.page {
  background-color: #fafafa;
  border: solid 1px hsl(0, 0%, 88%);
  overflow: hidden;
  /* Placeholder for empty images */
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ccc;
  font-size: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Specific styles for hard covers */
.page[data-density="hard"] {
  background-color: #f0f0f0;
  border: solid 2px #ddd;
}

.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #eee;
}

/* Loading Spinner (Wedding Theme Emojis & Flowers) */
.page-content::before {
  content: "❤️"; /* Fallback */
  position: absolute;
  font-size: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

/* Randomize emojis and assign different random movement animations */
.page:nth-child(8n+1) .page-content::before { content: "🌸"; animation: float1 3s ease-in-out infinite alternate; }
.page:nth-child(8n+2) .page-content::before { content: "💍"; animation: float2 3.5s ease-in-out infinite alternate; }
.page:nth-child(8n+3) .page-content::before { content: "✨"; animation: float3 2.5s ease-in-out infinite alternate; }
.page:nth-child(8n+4) .page-content::before { content: "🌻"; animation: float1 4s ease-in-out infinite alternate-reverse; }
.page:nth-child(8n+5) .page-content::before { content: "💐"; animation: float2 3s ease-in-out infinite alternate-reverse; }
.page:nth-child(8n+6) .page-content::before { content: "🌹"; animation: float3 4.5s ease-in-out infinite alternate; }
.page:nth-child(8n+7) .page-content::before { content: "💖"; animation: float1 2.8s ease-in-out infinite alternate; }
.page:nth-child(8n+8) .page-content::before { content: "❤️"; animation: float2 3.2s ease-in-out infinite alternate-reverse; }

/* Hide spinner once image is loaded */
.page-content:has(.page-image.loaded)::before {
  display: none;
  animation: none;
}

@keyframes float1 {
  0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
  33%  { transform: translate(15px, -20px) scale(1.1) rotate(15deg); }
  66%  { transform: translate(-10px, 15px) scale(0.9) rotate(-10deg); }
  100% { transform: translate(-20px, -10px) scale(1.2) rotate(-20deg); }
}

@keyframes float2 {
  0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
  33%  { transform: translate(-15px, -15px) scale(1.2) rotate(-15deg); }
  66%  { transform: translate(20px, 10px) scale(0.9) rotate(20deg); }
  100% { transform: translate(10px, -20px) scale(1.1) rotate(10deg); }
}

@keyframes float3 {
  0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
  33%  { transform: translate(20px, 15px) scale(0.9) rotate(25deg); }
  66%  { transform: translate(-15px, -20px) scale(1.2) rotate(-15deg); }
  100% { transform: translate(-10px, 20px) scale(1) rotate(-5deg); }
}

.page-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
}

.page-image.loaded {
  opacity: 1;
}

/* Ensure missing image icon looks clean */
img.page-image:-moz-loading {
  visibility: hidden;
}

.controls-container {
  /* Removed absolute positioning so it sits safely below the book */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  padding: 12px 24px;
  border-radius: 50px;
  z-index: 100;
  max-width: calc(100vw - 16px); /* Ensures at least 8px space from window edges */
  margin-top: 10px;
  background: var(--control-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--control-border);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.05);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--accent-color);
}

.play-btn {
  width: 48px;
  height: 48px;
  background: var(--accent-color);
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.play-btn:hover {
  background: #2563eb;
  color: white;
}

.play-btn.active {
  background: #ef4444; 
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.play-btn.active:hover {
  background: #dc2626;
}

.music-btn.music-on {
  color: #10b981; /* Green when on */
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--control-border);
}

@media (max-width: 768px) {
  .flipbook-wrapper {
    width: 100vw;
    height: 100dvh;
  }
  
  .controls-container {
    bottom: 10px;
    padding: 10px 15px;
    gap: 8px;
  }
  
  .control-btn {
    width: 36px;
    height: 36px;
  }
  
  .play-btn {
    width: 42px;
    height: 42px;
  }
}
</style>
