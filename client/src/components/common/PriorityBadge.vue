<script setup lang="ts">
defineProps<{ priority: number }>()

function getPriorityClass(p: number) {
  if (p >= 5) return 'priority-p0'
  if (p >= 4) return 'priority-p1'
  if (p >= 3) return 'priority-p2'
  if (p >= 2) return 'priority-p3'
  return 'priority-p4'
}

function getPriorityLabel(p: number) {
  if (p >= 5) return 'P0 紧急'
  if (p >= 4) return 'P1 高'
  if (p >= 3) return 'P2 中'
  if (p >= 2) return 'P3 低'
  return 'P4 最低'
}
</script>

<template>
  <span class="priority" :class="getPriorityClass(priority)">{{ getPriorityLabel(priority) }}</span>
</template>
