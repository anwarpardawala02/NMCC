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
        <p>Established in 1925, Northolt Manor Cricket Club has been serving the local community for nearly a century. 
        Our club promotes the spirit of cricket, focusing on player development and creating a welcoming environment for all.</p>
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
