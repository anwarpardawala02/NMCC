import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    nmccBlue: {
      500: '#1a3a5c',
      600: '#15304a',
    },
    nmccGreen: {
      500: '#7ed957',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#f5f7fa',
        color: '#344563',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
      },
      defaultProps: {
        colorScheme: 'blue',
      },
    },
    VStack: {
      baseStyle: {
        spacing: 4,
      },
    },
  },
})

export default theme
