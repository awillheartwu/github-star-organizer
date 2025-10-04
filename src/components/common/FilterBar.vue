<template>
  <section class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-center gap-3">
      <slot name="filters" />
      <div class="flex-1" />
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
