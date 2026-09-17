export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'zinc',
    },
    table: {
      slots: {
        // Hover vive en tbody (default Nuxt UI); hay que overridearlo acá o gana elevated/50.
        tbody:
          'divide-y divide-default [&>tr]:data-[selectable=true]:hover:bg-elevated/50 [&>tr]:data-[selectable=true]:data-[selected=true]:hover:bg-primary-200 dark:[&>tr]:data-[selectable=true]:data-[selected=true]:hover:bg-primary-800/70 [&>tr]:data-[selectable=true]:focus-visible:outline-primary',
        th: 'px-2 py-2 text-sm text-highlighted text-start font-semibold whitespace-nowrap [&:has([role=checkbox])]:pe-0',
        td: 'px-2 py-1.5 text-sm text-muted whitespace-nowrap [&:has([role=checkbox])]:pe-0',
        tr: 'data-[selected=true]:bg-primary-100 dark:data-[selected=true]:bg-primary-900/55 data-[selectable=true]:cursor-pointer transition-colors',
      },
    },
  },
})
