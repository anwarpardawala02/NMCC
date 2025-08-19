import { useState, useEffect } from 'react';
import { 
  VStack, 
  HStack,
  FormControl, 
  FormLabel, 
  Input, 
  Textarea,
  Button,
  useToast,
  Box,
  Heading,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge
} from '@chakra-ui/react';
import { createBlog, listBlogs } from '../lib/db';
import type { Blog } from '../lib/db';

export function AdminBlogForm() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    published: false
  });
  const toast = useToast();

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      const data = await listBlogs(false); // Get all blogs including unpublished
      setBlogs(data);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createBlog(form);
      toast({
        title: 'Blog Post Created',
        description: `Blog post ${form.published ? 'published' : 'saved as draft'}`,
        status: 'success'
      });
      setForm({
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        published: false
      });
      loadBlogs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Create Blog Post</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Blog post title"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Excerpt</FormLabel>
              <Textarea
                value={form.excerpt}
                onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary of the post"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Featured Image URL</FormLabel>
              <Input
                value={form.featured_image}
                onChange={e => setForm(prev => ({ ...prev, featured_image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Content</FormLabel>
              <Textarea
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content here..."
                rows={10}
              />
            </FormControl>

            <FormControl>
              <HStack>
                <FormLabel mb={0}>Publish immediately</FormLabel>
                <Switch
                  isChecked={form.published}
                  onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                />
              </HStack>
            </FormControl>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Creating..."
              w="full"
            >
              {form.published ? 'Publish Post' : 'Save as Draft'}
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>All Blog Posts</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Author</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </Tr>
            </Thead>
            <Tbody>
              {blogs.map(blog => (
                <Tr key={blog.id}>
                  <Td>{blog.title}</Td>
                  <Td>{blog.author?.full_name || 'Unknown'}</Td>
                  <Td>
                    <Badge colorScheme={blog.published ? 'green' : 'yellow'}>
                      {blog.published ? 'Published' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td>{new Date(blog.created_at).toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}