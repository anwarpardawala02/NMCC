import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  Text, 
  SimpleGrid, 
  Image, 
  VStack, 
  HStack,
  Badge,
  Button,
  Container
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { listPhotos, listBlogs, listMatches } from "../lib/db";
import type { Photo, Blog, Match } from "../lib/db";

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [photosData, blogsData, matchesData] = await Promise.all([
        listPhotos(),
        listBlogs(true),
        listMatches()
      ]);
      
      setPhotos(photosData.slice(0, 6)); // Show latest 6 photos
      setBlogs(blogsData.slice(0, 3)); // Show latest 3 blogs
      
      // Filter upcoming matches
      const today = new Date().toISOString().split('T')[0];
      const upcoming = matchesData
        .filter(match => match.match_date >= today && match.status === 'scheduled')
        .slice(0, 3);
      setUpcomingMatches(upcoming);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Hero Section */}
      <Box textAlign="center" mb={12}>
        <Heading size="2xl" mb={4} color="#344563">
          Welcome to Northolt Manor Cricket Club
        </Heading>
        <Text fontSize="xl" color="gray.600" mb={6}>
          Established in 1979, serving the community for nearly a half-century
        </Text>
        <HStack justify="center" spacing={4}>
          <Button as={RouterLink} to="/register" colorScheme="green" size="lg">
            Join Our Club
          </Button>
          <Button as={RouterLink} to="/team/matches" variant="outline" size="lg">
            View Fixtures
          </Button>
        </HStack>
      </Box>

      {/* About Section */}
      <Box mb={12} p={6} bg="gray.50" borderRadius="lg">
        <Heading size="lg" mb={4}>About Our Club</Heading>
        <Text 
          fontSize="lg" 
          lineHeight="tall" 
          textAlign="center"
        >
          Our club was established in the year 1979 and was called London Shabab Cricket Club &amp; later it was changed to Northolt Manor Cricket Club in 2019.
          <br /><br />
          We have been hosting friendly cricket fixtures as it gave our players flexibility to meet religious &amp; family commitments. We also have organised community UK T10 Tournaments &amp; our team holds the record of winning the most Trophies, most recent was in 2019.
          <br /><br />
          In 2021 we joined Middlesex County Cricket League. Our players enjoyed the experience &amp; competitiveness of playing in the league. Playing in the league for first year we finished 4th.
          <br /><br />
          We at Northolt Manor CC believe that without teamwork a team cannot succeed.
          <br /><br />
          Our aim is to build a team based on the following qualities which can make us a successful winning team. Communication, Hard Work, Motivation, Creative Freedom, Co-operation, Discipline, Respect &amp; Trust.
        </Text>
      </Box>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <Box mb={12}>
          <Heading size="lg" mb={6}>Upcoming Matches</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {upcomingMatches.map((match) => (
              <Box key={match.id} p={4} borderWidth={1} borderRadius="lg" bg="white">
                <VStack align="start" spacing={2}>
                  <Badge colorScheme={match.home_away === 'home' ? 'green' : 'blue'}>
                    {match.home_away.toUpperCase()}
                  </Badge>
                  <Heading size="md">vs {match.opponent}</Heading>
                  <Text color="gray.600">
                    {new Date(match.match_date).toLocaleDateString()}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {match.venue}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
          <Box textAlign="center" mt={6}>
            <Button as={RouterLink} to="/team/matches" variant="outline">
              View All Fixtures
            </Button>
          </Box>
        </Box>
      )}

      {/* Latest News */}
      {blogs.length > 0 && (
        <Box mb={12}>
          <Heading size="lg" mb={6}>Latest News</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {blogs.map((blog) => (
              <Box key={blog.id} borderWidth={1} borderRadius="lg" overflow="hidden" bg="white">
                {blog.featured_image && (
                  <Image src={blog.featured_image} alt={blog.title} h="200px" w="full" objectFit="cover" />
                )}
                <Box p={4}>
                  <Heading size="md" mb={2} noOfLines={2}>
                    {blog.title}
                  </Heading>
                  <Text color="gray.600" noOfLines={3} mb={3}>
                    {blog.excerpt}
                  </Text>
                  <Button as={RouterLink} to={`/blog/${blog.id}`} size="sm" variant="outline">
                    Read More
                  </Button>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
          <Box textAlign="center" mt={6}>
            <Button as={RouterLink} to="/blog" variant="outline">
              View All News
            </Button>
          </Box>
        </Box>
      )}

      {/* Photo Gallery Preview */}
      {photos.length > 0 && (
        <Box>
          <Heading size="lg" mb={6}>Gallery</Heading>
          <SimpleGrid columns={[2, 3, 6]} spacing={4}>
            {photos.map((photo) => (
              <Box key={photo.id} borderRadius="lg" overflow="hidden">
                <Image 
                  src={photo.url} 
                  alt={photo.title} 
                  h="150px" 
                  w="full" 
                  objectFit="cover"
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="transform 0.2s"
                />
              </Box>
            ))}
          </SimpleGrid>
          <Box textAlign="center" mt={6}>
            <Button as={RouterLink} to="/gallery" variant="outline">
              View Full Gallery
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}