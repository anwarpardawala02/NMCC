import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  SimpleGrid, 
  Image, 
  Button,
  Input,
  VStack,
  useToast,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";
import { listPhotos, uploadPhoto } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import type { Photo } from "../lib/db";

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const data = await listPhotos();
      setPhotos(data);
    } catch (error: any) {
      toast({
        title: "Error loading photos",
        description: error.message,
        status: "error",
      });
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload photos",
        status: "warning",
      });
      return;
    }

    const file = e.target.files[0];
    setUploading(true);

    try {
      await uploadPhoto(file, file.name);
      toast({
        title: "Upload Successful",
        description: "Photo uploaded successfully",
        status: "success",
      });
      loadPhotos();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        status: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    onOpen();
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Club Gallery
          </Heading>
          
          {user && (
            <Box>
              <Input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                display="none"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button
                  as="span"
                  leftIcon={<AttachmentIcon />}
                  isLoading={uploading}
                  loadingText="Uploading..."
                  cursor="pointer"
                  colorScheme="green"
                >
                  Upload Photo
                </Button>
              </label>
            </Box>
          )}
        </Box>

        {photos.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Heading size="md" color="gray.500" mb={2}>
              No photos yet
            </Heading>
            <Box color="gray.400">
              {user ? "Be the first to upload a photo!" : "Photos will appear here once uploaded"}
            </Box>
          </Box>
        ) : (
          <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
            {photos.map((photo) => (
              <Box 
                key={photo.id} 
                borderRadius="lg" 
                overflow="hidden" 
                cursor="pointer"
                _hover={{ transform: 'scale(1.02)' }}
                transition="transform 0.2s"
                onClick={() => openModal(photo)}
              >
                <Image 
                  src={photo.url} 
                  alt={photo.title} 
                  h="250px" 
                  w="full" 
                  objectFit="cover"
                />
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Photo Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            {selectedPhoto && (
              <Image 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title}
                w="full"
                maxH="80vh"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}