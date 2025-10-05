<template>
  <div class="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
    <slot name="icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-10 w-10 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="m3 7 7 5 7-5" />
      </svg>
    </slot>
    <p class="text-sm">
      <slot>No Data</slot>
    </p>
  </div>
</template>
