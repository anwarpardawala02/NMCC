import { Box, Heading, Text, Image, SimpleGrid } from "@chakra-ui/react";

export default function Home() {
  // TODO: Fetch photos from Supabase
  return (
    <Box p={6}>
      <Heading mb={4}>Northolt Manor Cricket Club</Heading>
      <Text mb={6}>
        Welcome to our Dawoodi Bohra community-affiliated cricket club. 
        Here we celebrate our history and showcase memorable moments.
      </Text>

      <Heading size="md" mb={4}>Photo Gallery</Heading>
      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        <Image src="https://via.placeholder.com/200" alt="club photo" />
        <Image src="https://via.placeholder.com/200" alt="club photo" />
      </SimpleGrid>
    </Box>
  );
}
