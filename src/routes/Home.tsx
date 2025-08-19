import { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, useToast } from '@chakra-ui/react';
import { PhotoUploader } from '../components/PhotoUploader';
import { useAuth } from '../hooks/useAuth';
import { listPhotos } from '../lib/db';

export function Home() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const data = await listPhotos();
      setPhotos(data);
    } catch (error: any) {
      toast({
        title: 'Error loading photos',
        description: error.message,
        status: 'error',
      });
    }
  }

  return (
    <Box>
      <Heading mb={8}>Northolt Manor Cricket Club</Heading>
      
      <Box mb={8}>
        <Heading size="md" mb={4}>About Us</Heading>
        <p>About Us
Our club was established in the year 1979 and was called London Shabab Cricket Club & later it was changed to Northolt Manor Cricket Club in 2019.
We have been hosting friendly cricket fixtures as it gave our players flexibility to meet religious & family commitments. We also have organised community UK T10 Tournaments & our team holds the record of winning the most Trophies, most recent was in 2019.
In 2021 we joined Middlesex County Cricket League. Our players enjoyed the experience & competitiveness of playing in the league. Playing in the league for first year we finished 4th.
We at Northolt Manor CC believe that without teamwork a team cannot succeed.
Our aim is to build a team based on the following qualities which can make us a successful winning team. Communication, Hard Work, Motivation, Creative Freedom, Co-operation, Discipline, Respect & Trust.</p>
      </Box>

      <Box mb={8}>
        <Heading size="md" mb={4}>Gallery</Heading>
        {user && (
          <Box mb={4}>
            <PhotoUploader onSuccess={loadPhotos} />
          </Box>
        )}
        <SimpleGrid columns={[2, 3, 4]} spacing={4}>
          {photos.map((photo: any) => (
            <Box key={photo.id} borderRadius="lg" overflow="hidden">
              <img src={photo.url} alt={photo.title} className="w-full h-48 object-cover" />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
