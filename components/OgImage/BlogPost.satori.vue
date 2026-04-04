<script setup lang="ts">
const props = defineProps<{
  title?: string
  description?: string
  tags?: string[]
  authorName?: string
  authorRole?: string
  authorAvatar?: string
  coverColor?: string
}>()
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      background: props.coverColor || '#0f172a',
      fontFamily: 'Inter, sans-serif',
      padding: '64px',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Cercles décoratifs -->
    <div
      :style="{
        position: 'absolute',
        top: '-180px',
        right: '-180px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
      }"
    />
    <div
      :style="{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
      }"
    />

    <!-- Logo + nom du blog -->
    <div :style="{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }">
      <div
        :style="{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: '700',
          color: 'white',
        }"
      >B</div>
      <span :style="{ fontSize: '18px', fontWeight: '600', color: '#64748b' }">
        Le Blog d'Antoine
      </span>
    </div>

    <!-- Tags -->
    <div
      v-if="tags?.length"
      :style="{ display: 'flex', gap: '10px', marginBottom: '24px' }"
    >
      <span
        v-for="tag in tags.slice(0, 4)"
        :key="tag"
        :style="{
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.75)',
          fontSize: '14px',
          fontWeight: '500',
        }"
      >{{ tag }}</span>
    </div>

    <!-- Titre -->
    <div
      :style="{
        flex: '1',
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: title && title.length > 60 ? '36px' : '44px',
        fontWeight: '700',
        color: '#f8fafc',
        lineHeight: '1.25',
        marginBottom: '20px',
      }"
    >
      {{ title }}
    </div>

    <!-- Description -->
    <div
      v-if="description"
      :style="{
        fontSize: '19px',
        color: '#94a3b8',
        lineHeight: '1.5',
        marginBottom: '40px',
      }"
    >
      {{ description.slice(0, 115) }}{{ description.length > 115 ? '…' : '' }}
    </div>

    <!-- Auteur -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }"
    >
      <img
        :src="authorAvatar || 'https://avatars.githubusercontent.com/u/115811899'"
        width="40"
        height="40"
        :style="{ borderRadius: '50%', objectFit: 'cover' }"
      />
      <div :style="{ display: 'flex', flexDirection: 'column', gap: '2px' }">
        <span :style="{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }">{{ authorName || 'MASIA Antoine' }}</span>
        <span :style="{ fontSize: '13px', color: '#475569' }">{{ authorRole || 'Développeur Full-Stack, DevOps & CyberSécurité' }}</span>
      </div>
    </div>
  </div>
</template>
