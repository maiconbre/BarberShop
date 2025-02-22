import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'BarberGR - Barbearia Moderna',
  description = 'Agende seu horário na BarberGR. Cortes modernos e clássicos, profissionais qualificados e ambiente acolhedor.',
  image = '/img/fotohero.avif',
  url = 'https://barber-gr.vercel.app',
  type = 'website'
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: 'BarberGR',
    image,
    '@id': url,
    url,
    telephone: '+55 21 99776-0398',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Endereço da Barbearia',
      addressLocality: 'Rio de Janeiro',
      addressRegion: 'RJ',
      postalCode: '20000-000',
      addressCountry: 'BR'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -22.9068467,
      longitude: -43.1728965
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '20:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '18:00'
      }
    ],
    priceRange: '$$',
    servesCuisine: 'Barber Shop'
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${url}${image}`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="BarberGR" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${url}${image}`} />
      
      {/* Mobile Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#0D121E" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;