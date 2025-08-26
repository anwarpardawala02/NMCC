import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Heading, Image, Container, Badge, Button, VStack, Spinner } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getBlog } from "../lib/db";
import type { Blog } from "../lib/db";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBlog(id);
    }
  }, [id]);

  async function loadBlog(blogId: string) {
    try {
      const data = await getBlog(blogId);
      setBlog(data);
    } catch (error) {
      console.error('Failed to load blog:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Box textAlign="center">
          <Spinner size="xl" color="green.500" />
        </Box>
      </Container>
    );
  }

  if (!blog) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={4}>
          <Heading size="lg" color="red.500">Blog post not found</Heading>
          <Button as={RouterLink} to="/blog" leftIcon={<ArrowBackIcon />}>
            Back to Blog
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Button 
          as={RouterLink} 
          to="/blog" 
          leftIcon={<ArrowBackIcon />}
          variant="ghost"
          alignSelf="start"
        >
          Back to Blog
        </Button>

        <Box>
          <Heading size="xl" mb={4}>{blog.title}</Heading>
          
          <Box mb={6}>
            <Badge colorScheme="green" mr={2}>
              {new Date(blog.created_at).toLocaleDateString()}
            </Badge>
            {blog.author && (
              <Badge variant="outline">
                By {blog.author.full_name}
              </Badge>
            )}
          </Box>

          {blog.featured_image && (
            <Image 
              src={blog.featured_image} 
              alt={blog.title}
              w="full"
              h="400px"
              objectFit="cover"
              borderRadius="lg"
              mb={6}
            />
          )}

          <Box 
            fontSize="lg" 
            lineHeight="tall"
            dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }}
          />
        </Box>
      </VStack>
    </Container>
  );
}