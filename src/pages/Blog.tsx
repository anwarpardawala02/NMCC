import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  VStack, 
  Image, 
  Text,
  Button,
  Container,
  Badge
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { listBlogs } from "../lib/db";
import type { Blog } from "../lib/db";

export default function Blog() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      const data = await listBlogs(true);
      setBlogs(data);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    }
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Club News & Updates
          </Heading>
          <Text color="gray.600">
            Stay up to date with the latest news from Northolt Manor Cricket Club
          </Text>
        </Box>

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
    </Container>
  );
}