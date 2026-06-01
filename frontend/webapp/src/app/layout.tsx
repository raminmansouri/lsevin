import localFont from 'next/font/local'


const vazir = localFont({
  // src: '../../public/fonts/Iranian Sans.ttf',

  src: [
    {
      path: '../../public/fonts/Vazir.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Vazir-Light.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Vazir-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Vazir-Light.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
})


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return  <html  className={vazir.className}>
      <body>{children}</body>
    </html>;
}
