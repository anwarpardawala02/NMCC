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
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Badge
} from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";
import { listPhotos, uploadPhoto, listBlogs } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import type { Photo, Blog } from "../lib/db";
import { AdminBlogForm } from "../components/AdminBlogForm";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";


export default function ClubMediaHub() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine tab index from route
  const tabIndex = location.pathname.endsWith('/blog') ? 1 : 0;

  useEffect(() => {
    loadPhotos();
    loadBlogs();
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

  async function loadBlogs() {
    try {
      const data = await listBlogs(true);
      setBlogs(data);
    } catch (error: any) {
      toast({
        title: "Error loading blogs",
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
      <Tabs
        index={tabIndex}
        onChange={i => navigate(i === 0 ? '/gallery' : '/gallery/blog')}
        variant="enclosed-colored"
        colorScheme="green"
        isFitted
      >
        <TabList mb={6}>
          <Tab fontWeight="bold">Social Media</Tab>
          <Tab fontWeight="bold">Blog</Tab>
        </TabList>
        <TabPanels>
          {/* Social Media Tab */}
          <TabPanel px={0}>
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading size="xl" mb={4} color="green.600">
                  Club Media Hub
                </Heading>
                {/* Trendy Instagram Feed Section */}
                <Box
                  mt={8}
                  mb={8}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                >
                  <Box
                    bgGradient="linear(to-r, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
                    borderRadius="2xl"
                    boxShadow="2xl"
                    p={[4, 6]}
                    w={["100%", "80%", "60%", "500px"]}
                    maxW="500px"
                    mb={4}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box display="flex" alignItems="center" mb={2}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 8}}>
                        <radialGradient id="ig-gradient" cx="0.5" cy="0.5" r="0.8">
                          <stop offset="0%" stopColor="#f09433"/>
                          <stop offset="25%" stopColor="#e6683c"/>
                          <stop offset="50%" stopColor="#dc2743"/>
                          <stop offset="75%" stopColor="#cc2366"/>
                          <stop offset="100%" stopColor="#bc1888"/>
                        </radialGradient>
                        <rect width="32" height="32" rx="8" fill="url(#ig-gradient)"/>
                        <path d="M22 10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h8zm-4 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" fill="#fff"/>
                      </svg>
                      <Heading size="md" color="white" fontWeight="bold" letterSpacing="wide">
                        Follow Us on Instagram
                      </Heading>
                    </Box>
                    <Box color="white" fontSize="md" mb={3}>
                      <a
                        href="https://www.instagram.com/northoltmanor/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'underline', fontWeight: 600 }}
                      >
                        @northoltmanor
                      </a>
                      {" "}for the latest updates, photos, and stories!
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="center"
                      w="100%"
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="lg"
                      transition="transform 0.2s"
                      _hover={{ transform: 'scale(1.03)' }}
                      bg="white"
                      p={1}
                    >
                      <iframe
                        src="https://www.instagram.com/northoltmanor/embed"
                        width="100%"
                        height="480"
                        frameBorder="0"
                        scrolling="no"
                        allowTransparency={true}
                        style={{ border: 'none', borderRadius: '12px', width: '100%' }}
                        title="Instagram Feed"
                      ></iframe>
                    </Box>
                  </Box>
                </Box>
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
            </VStack>
          </TabPanel>
          {/* Blog Tab */}
          <TabPanel px={0}>
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading size="xl" mb={4} color="green.600">
                  Club News & Updates
                </Heading>
                <Text color="gray.600">
                  Stay up to date with the latest news from Northolt Manor Cricket Club
                </Text>
              </Box>
              {user?.is_admin && (
                <Box mb={8}>
                  <AdminBlogForm />
                </Box>
              )}
              {blogs.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Heading size="md" color="gray.500" mb={2}>
                    No blog posts yet
                  </Heading>
                  <Text color="gray.400">
                    Check back soon for the latest club news and updates
                  </Text>
                </Box>
              ) : (
                <VStack spacing={8} align="stretch">
                  {blogs.map((blog) => (
                    <Box
                      key={blog.id}
                      p={6}
                      borderWidth={1}
                      borderRadius="lg"
                      bg="white"
                      _hover={{ shadow: 'md' }}
                      transition="box-shadow 0.2s"
                    >
                      <VStack align="start" spacing={4}>
                        {blog.featured_image && (
                          <Image
                            src={blog.featured_image}
                            alt={blog.title}
                            w="full"
                            h="300px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        )}
                        <VStack align="start" spacing={2} w="full">
                          <Heading size="lg">{blog.title}</Heading>
                          <Box>
                            <Badge colorScheme="green" mr={2}>
                              {new Date(blog.created_at).toLocaleDateString()}
                            </Badge>
                            {blog.author && (
                              <Badge variant="outline">
                                By {blog.author.full_name}
                              </Badge>
                            )}
                          </Box>
                          <Text color="gray.600" fontSize="lg">
                            {blog.excerpt}
                          </Text>
                          <Button
                            as={RouterLink}
                            to={`/blog/${blog.id}`}
                            colorScheme="green"
                            variant="outline"
                          >
                            Read Full Article
                          </Button>
                        </VStack>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
}