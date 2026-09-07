export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'zinc',
    },
    table: {
      slots: {
        th: 'px-2 py-2 text-sm text-highlighted text-start font-semibold whitespace-nowrap [&:has([role=checkbox])]:pe-0',
        td: 'px-2 py-1.5 text-sm text-muted whitespace-nowrap [&:has([role=checkbox])]:pe-0',
        tr: 'data-[selected=true]:bg-primary-100 dark:data-[selected=true]:bg-primary-900/55 data-[selected=true]:ring-1 data-[selected=true]:ring-inset data-[selected=true]:ring-primary/45 hover:bg-elevated data-[selectable=true]:cursor-pointer transition-colors',
      },
    },
  },
})
