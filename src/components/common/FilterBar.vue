<template>
  <section class="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
    <div class="flex flex-col gap-5">
      <slot name="filters" />
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
