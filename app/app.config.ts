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
        tr: 'data-[selected=true]:bg-elevated/50 hover:bg-elevated transition-colors',
      },
    },
  },
})
